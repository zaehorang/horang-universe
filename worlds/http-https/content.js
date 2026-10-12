/* 우편 도시 — 주소 하나로 가게에 편지를 보내기까지 (DNS → TCP → TLS → HTTP)
   설명 내용: 겹 1(말풍선·자막) · 겹 2(패널) · 겹 3(실제로는?) · 이름 규칙 */
(function(){
"use strict";

var SHOP = window.SHARED.shops["shop-web"];
var GUEST = window.SHARED.guests["guest-browser"];
var SHOP_IP = window.SHARED.publicIps["shop-web"];
/* 바이트 수(DNS 질문 37 · 답 53, http 요청 69)는 도메인 길이에 묶여 있다. shop-web 도메인이 바뀌면 함께 고친다 */

var ACTORS = {
  browser:{ name:"내 브라우저", real:GUEST.real,
    tip:"주소를 받아 편지(요청)를 쓰고 보내는 집이에요. 수첩(캐시)도 여기 있어요.",
    what:"주소창의 이름을 보고 <b>번호(IP) 찾기 → 연결 → 봉인 → 요청</b> 순서로 일을 진행해요. 이미 아는 번호·연결·HSTS 표시는 수첩(캐시)에 적어 두고 다음에 다시 써요.",
    talks:[["동네 안내소 (DNS 리졸버)","DNS · UDP 53","이름 → IP 질문과 답"],[SHOP.name + " (웹 서버)","TCP 443 · TLS · HTTP","연결·봉인·요청과 응답"]],
    steps:["주소 해석 (scheme · host · path)","수첩 확인 (DNS·HSTS 캐시)","IP 묻기 (DNS)","연결 맺기 (TCP)","봉인 맞추기 (TLS)","요청 보내고 응답 그리기 (HTTP)"],
    xr:[{l:"브라우저가 한 일을 그대로 따라 하기", code:"<span class='k'>$ curl -v --http1.1 https://" + SHOP.domain + "/</span>\n* IPv6: (none)\n* IPv4: " + SHOP_IP + "\n*   Trying " + SHOP_IP + ":443...\n* Connected to " + SHOP.domain + " (" + SHOP_IP + ") port 443\n* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256 / X25519 / id-ecPublicKey\n> GET / HTTP/1.1\n> Host: " + SHOP.domain + "\n< HTTP/1.1 <span class='g'>200 OK</span>"},
        {l:"수첩 속 HSTS 기록 (Chrome)", code:"<span class='c'>chrome://net-internals/#hsts → Query HSTS domain</span>\nFound:\n  static_sts_domain:\n  dynamic_sts_domain: " + SHOP.domain + "\n  dynamic_upgrade_mode: FORCE_HTTPS"}],
    myth:"https를 붙이면 바로 서버로 간다? — 이름만으로는 갈 수 없어요. 먼저 DNS로 번호(IP)를 알아야 해요." },

  resolver:{ name:"동네 안내소", real:"Resolver (재귀 DNS 리졸버)",
    tip:"이름을 주면 번호(IP)를 찾아다 주는 안내소예요. 대신 여기저기 물어봐 줘요.",
    what:"브라우저의 질문을 받아 <b>루트 → .com → example.com 담당</b> 순서로 대신 물어보고(재귀 질의), 받은 답을 TTL 동안 기억해요(캐시). 보통 통신사나 공유기가 정해 준 곳이에요.",
    talks:[["내 브라우저","DNS · UDP 53","질문 받기 · 답 주기"],["주소 관청 3곳","DNS · UDP 53","차례로 묻기 (위임 따라가기)"]],
    steps:["질문 받기 (" + SHOP.domain + " 의 A 레코드)","캐시 확인","루트에 묻기 → .com 담당 안내","TLD(.com)에 묻기 → example.com 담당 안내","권한 있는 네임서버에 묻기 → IP","TTL 동안 기억하고 답하기"],
    xr:[{l:"안내소에 직접 묻기", code:"<span class='k'>$ dig " + SHOP.domain + "</span>\n;; ->>HEADER<<- opcode: QUERY, status: <span class='g'>NOERROR</span>, id: 41982\n;; QUESTION SECTION:\n;" + SHOP.domain + ".          IN  A\n;; ANSWER SECTION:\n" + SHOP.domain + ".   300  IN  A  " + SHOP_IP + "\n;; SERVER: 192.0.2.53#53(192.0.2.53) (UDP)"},
        {l:"없는 이름을 물으면", code:"<span class='k'>$ dig my-shopp.example.com</span>\n;; ->>HEADER<<- opcode: QUERY, status: <span class='y'>NXDOMAIN</span>, id: 52210"}],
    myth:"DNS 질문도 HTTPS처럼 봉인된다? — 기본 DNS(UDP 53)는 엽서예요. DoH·DoT를 켜야 봉인돼요." },

  namehall:{ name:"주소 관청 3곳", real:"Root·TLD·Authoritative (네임서버 3단)",
    tip:"이름의 뒤에서부터 담당을 나눠 맡은 관청들이에요. 각자 '다음은 저기'만 알아요.",
    what:"루트는 <b>.com 담당이 누구인지</b>만, .com 관청(TLD)은 <b>example.com 담당이 누구인지</b>만 알려 줘요(위임). 실제 번호는 마지막 관청, 도메인 주인이 정한 권한 있는 네임서버(ns1.example.com)가 답해요.",
    talks:[["동네 안내소","DNS · UDP 53","질문 받기 · 다음 담당(NS) 또는 IP 답하기"]],
    steps:["루트: '.com 은 a.gtld-servers.net 에게'","TLD: 'example.com 은 ns1.example.com 에게'","권한 NS: '" + SHOP.domain + " 은 " + SHOP_IP + "'","답에 TTL(기억해도 되는 시간)을 붙임"],
    xr:[{l:"위임의 사슬을 직접 따라가기", code:"<span class='k'>$ dig +trace " + SHOP.domain + "</span>\n.                    518400 IN NS a.root-servers.net.\n<span class='c'>;; Received 525 bytes from 192.0.2.53#53(192.0.2.53) in 2 ms</span>\ncom.                 172800 IN NS a.gtld-servers.net.\n<span class='c'>;; Received 1170 bytes from 198.41.0.4#53(a.root-servers.net) in 20 ms</span>\nexample.com.         172800 IN NS ns1.example.com.\n<span class='c'>;; Received 680 bytes from 192.5.6.30#53(a.gtld-servers.net) in 25 ms</span>\n" + SHOP.domain + ". 300    IN A  " + SHOP_IP + "\n<span class='c'>;; Received 64 bytes from 198.51.100.53#53(ns1.example.com) in 30 ms</span>"}],
    myth:"모든 이름을 아는 거대한 서버가 하나 있다? — 아니에요. 각 관청은 다음 담당만 알려 주는 위임의 사슬이에요." },

  road:{ name:"공용 도로 · 중계소", real:"Internet (라우터 · ISP)",
    tip:"내 집과 가게 사이의 공용 도로예요. 중계소들이 봉투 겉면만 보고 다음 길로 넘겨요.",
    what:"요청은 한 번에 가지 않고 공유기·통신사·데이터센터의 <b>라우터 여러 곳(홉)</b>을 거쳐요. 각 중계소는 봉투 겉면의 받는 주소(IP)만 보고 다음 중계소로 넘겨요. 길은 내 것이 아니라서 누구나 지나가는 길이에요.",
    talks:[["내 브라우저 · " + SHOP.name,"IP 패킷","봉투(패킷)를 받아 다음 홉으로 전달"]],
    steps:["봉투 겉면의 받는 IP 읽기","경로표(라우팅 테이블)에서 다음 홉 고르기","다음 중계소로 넘기기","가게가 있는 데이터센터에 도착"],
    xr:[{l:"거쳐 가는 중계소 보기", code:"<span class='k'>$ traceroute " + SHOP_IP + "</span>\n 1  192.0.2.1       1.2 ms   <span class='c'># 집 공유기</span>\n 2  198.51.100.1    6.8 ms   <span class='c'># 통신사</span>\n 3  198.51.100.77  11.4 ms\n 4  203.0.113.1    18.9 ms   <span class='c'># 데이터센터 입구</span>\n 5  " + SHOP_IP + "   19.3 ms"}],
    myth:"요청은 서버까지 선 하나로 바로 간다? — 중계소 여러 곳을 거치고, 각 중계소가 겉면(IP)을 읽어요." },

  snoop:{ name:"엿보는 사람", real:"eavesdropper (길 위의 도청자)",
    tip:"같은 와이파이나 중간 중계소에서 지나가는 봉투를 들여다보는 사람이에요.",
    what:"공용 와이파이 옆자리, 공유기, 통신사처럼 <b>길 위에 있는 누구든</b> 지나가는 패킷을 볼 수 있어요. HTTP 엽서는 내용까지 읽고 바꿀 수 있지만, HTTPS 상자는 겉면(IP·포트·SNI·크기)만 보여요.",
    talks:[["공용 도로","패킷 캡처","지나가는 봉투 들여다보기 · 바꿔치기 시도"]],
    steps:["지나가는 패킷 붙잡기","겉면 읽기 (IP · 포트)","HTTP면 내용(경로·쿠키)까지 읽기","HTTPS면 겉면과 크기·시간만 남음"],
    xr:[{l:"HTTPS 상자를 들여다보면", code:"<span class='k'>$ sudo tcpdump -t -n -X 'host " + SHOP_IP + " and port 443'</span>\nIP 192.0.2.10.54122 > " + SHOP_IP + ".443: Flags [P.], seq …, ack …, win 502, options [nop,nop,TS …], length 91\n  0x0000:  4500 008f 1c46 4000 4006 201e c000 020a  <span class='c'># IP 헤더 — 전체 길이 0x008f = 143바이트</span>\n  0x0020:  8018 .... .... 0000 0101 080a .... ....  <span class='c'># TCP 타임스탬프 옵션(0101 080a)은 0x0028 부터</span>\n  0x0030:  .... .... 1703 0300 563f c19e 4b77 d0a1  <span class='c'># 17 03 03 00 56 = TLS 1.3 레코드 머리(길이 86), 그 뒤는 알아볼 수 없음</span>"},
        {l:"HTTP 엽서를 들여다보면", code:"<span class='k'>$ sudo tcpdump -t -n -A 'host " + SHOP_IP + " and port 80'</span>\nIP 192.0.2.10.54130 > " + SHOP_IP + ".80: Flags [P.], seq 1:70, ack 1, win 502, options [nop,nop,TS …], length 69\n<span class='y'>GET / HTTP/1.1\nHost: " + SHOP.domain + "\nCookie: sid=7f3a9c2e41\n# Secure 표시가 없는 쿠키라 http 에도 실려요</span>"}],
    myth:"HTTPS면 아무것도 안 보인다? — 내용은 숨지만 서버 IP, 가게 이름(SNI), 시간과 크기는 보여요." },

  door80:{ name:"80번 문", real:"TCP:80 (HTTP 포트)",
    tip:"봉인 없이 엽서를 받는 옛 문이에요. 요즘은 대부분 443번 문으로 돌려보내요.",
    what:"http:// 로 오면 브라우저는 <b>80번 포트</b>로 TCP 연결을 맺고 바로 요청을 보내요. 문지기도, 신분증 확인도, 봉인도 없어요. 그래서 많은 가게가 여기서는 <b>301로 https 주소를 알려 주기만</b> 해요.",
    talks:[["내 브라우저","TCP 80 · HTTP","엽서 요청 받기 · 301 돌려보내기"]],
    steps:["연결 요청 받기 (SYN)","연결 수락 (SYN-ACK · ACK)","평문 요청 받기","301 + Location 으로 돌려보내기"],
    xr:[{l:"80번 문의 실제 응답", code:"<span class='k'>$ curl -sI http://" + SHOP.domain + "/</span>\nHTTP/1.1 <span class='y'>301 Moved Permanently</span>\nServer: nginx\nLocation: https://" + SHOP.domain + "/"},
        {l:"가게 설정 (nginx)", code:"server {\n  listen 80;\n  server_name " + SHOP.domain + ";\n  return 301 https://$host$request_uri;\n}"}],
    myth:"80번과 443번은 다른 서버다? — 같은 가게의 다른 문이에요. 문 번호(포트)가 다를 뿐이에요." },

  door443:{ name:"443번 문", real:"TCP:443 (HTTPS 포트)",
    tip:"HTTPS 손님을 받는 문이에요. 먼저 연결(TCP)을 맺고, 그다음 문지기가 봉인을 맞춰요.",
    what:"브라우저는 <b>SYN → SYN-ACK → ACK</b> 세 번을 주고받아 이 문과 TCP 연결을 맺어요. 양쪽이 서로의 순서 번호(seq)를 기억하게 되는 것이 '연결'이에요. 그 위에서 TLS 봉인이 시작돼요.",
    talks:[["내 브라우저","TCP 443","3단계 악수 (SYN · SYN-ACK · ACK)"],["문지기 (TLS)","같은 연결 위","연결이 생기면 봉인 맞추기 시작"]],
    steps:["SYN 받기 — 상대 seq 기억","SYN-ACK 보내기 — 내 seq 알려 주기","ACK 받기 — 연결 성립 (ESTABLISHED)","이 연결 위로 TLS 시작"],
    xr:[{l:"연결 상태 확인", code:"<span class='k'>$ ss -tn 'sport = :443'</span>\nState   Recv-Q Send-Q  Local Address:Port   Peer Address:Port\n<span class='g'>ESTAB</span>   0      0       " + SHOP_IP + ":443     192.0.2.10:54122"},
        {l:"문이 닫혀 있으면", code:"<span class='k'>$ curl https://" + SHOP.domain + "/</span>\ncurl: (7) Failed to connect to " + SHOP.domain + " port 443 after 21 ms: <span class='y'>Connection refused</span>"}],
    myth:"TCP 연결은 실제 선을 까는 것이다? — 양 끝이 번호를 기억하는 약속일 뿐, 길 위에는 아무것도 생기지 않아요." },

  guard:{ name:"문지기", real:"TLS 종료 (nginx ssl)",
    tip:"443번 문 앞에서 봉인을 맞추는 사람이에요. 열쇠 재료를 주고받고 신분증을 보여 줘요.",
    what:"브라우저의 <b>ClientHello</b>를 받고 ServerHello로 답해요. 서로 <b>열쇠 재료(key_share)</b>를 하나씩 내놓고, 양쪽이 각자 섞어 같은 세션 열쇠를 계산해요(ECDHE). 그다음 신분증(인증서)과 '이 신분증의 주인이 나'라는 서명을 보내요.",
    talks:[["내 브라우저","TLS 1.3 핸드셰이크","열쇠 재료 · 인증서 · 서명 · Finished"],[SHOP.name,"가게 안 (평문)","봉인 푼 요청 넘기기 · 응답 받아 봉인"]],
    steps:["ClientHello 받기 (지원 암호 · SNI · key_share)","ServerHello 보내기 (고른 암호 · key_share)","같은 세션 열쇠 계산 (ECDHE)","여기부터 암호화: Certificate · CertificateVerify · Finished","브라우저 Finished 확인 → 봉인 완료"],
    xr:[{l:"핸드셰이크 순서 (curl -v)", code:"* TLSv1.3 (OUT), TLS handshake, Client hello (1):\n* TLSv1.3 (IN), TLS handshake, Server hello (2):\n* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):\n* TLSv1.3 (IN), TLS handshake, Certificate (11):\n* TLSv1.3 (IN), TLS handshake, CERT verify (15):\n* TLSv1.3 (IN), TLS handshake, Finished (20):\n* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):\n* TLSv1.3 (OUT), TLS handshake, Finished (20):\n* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256 / X25519 / id-ecPublicKey"},
        {l:"문지기 설정 (nginx)", code:"server {\n  listen 443 ssl;\n  server_name " + SHOP.domain + ";\n  ssl_certificate     /etc/letsencrypt/live/" + SHOP.domain + "/fullchain.pem;\n  ssl_certificate_key /etc/letsencrypt/live/" + SHOP.domain + "/privkey.pem;\n  ssl_protocols TLSv1.2 TLSv1.3;\n}"}],
    myth:"열쇠를 상자에 넣어 상대에게 보낸다? — TLS 1.3은 재료(key_share)만 주고받고 각자 같은 열쇠를 계산해요." },

  cert:{ name:"가게 신분증", real:"Certificate (X.509 · TLS 인증서)",
    tip:"'이 이름의 가게가 맞다'고 발급소가 도장을 찍어 준 신분증이에요.",
    what:"신분증에는 <b>가게 이름(subjectAltName)·유효 기간·가게의 공개 열쇠·발급소 서명</b>이 적혀 있어요. 브라우저는 이름이 주소창과 같은지, 기한이 남았는지, 서명이 믿는 발급소 것인지 확인해요. 사람 신분증과 달리 '착한 가게'인지는 보증하지 않아요.",
    talks:[["문지기","TLS Certificate 메시지","브라우저에게 보여 주기"],["신분증 발급소","발급 (ACME)","도메인 주인임을 확인받고 도장 받기"]],
    steps:["이름 확인 — 주소창 이름 ∈ subjectAltName","기한 확인 — notBefore ~ notAfter","사슬 확인 — 가게 신분증 ← 중간 발급소 ← 루트","서명 확인 — 브라우저의 도장 목록(trust store)으로","CertificateVerify — 신분증 주인이 맞는지 서명 확인"],
    xr:[{l:"신분증과 그 사슬", code:"<span class='k'>$ openssl s_client -connect " + SHOP.domain + ":443 -servername " + SHOP.domain + "</span>\nCertificate chain\n 0 s:CN=" + SHOP.domain + "\n   i:C=US, O=Let's Encrypt, CN=E5\n 1 s:C=US, O=Let's Encrypt, CN=E5\n   i:C=US, O=Internet Security Research Group, CN=ISRG Root X2\nVerify return code: <span class='g'>0 (ok)</span>"},
        {l:"이름이 다르면", code:"curl: (60) SSL: no alternative certificate subject name matches target host name '<span class='y'>" + SHOP.domain + "</span>'"}],
    myth:"신분증(자물쇠 표시)이 있으면 믿을 만한 가게다? — '이 이름의 주인'만 보증해요. 피싱 사이트도 자기 이름 신분증은 받아요." },

  ca:{ name:"신분증 발급소", real:"CA (Certificate Authority)",
    tip:"가게가 그 이름의 주인인지 확인하고 신분증에 도장을 찍어 주는 곳이에요.",
    what:"가게는 미리 발급소에 가서 <b>도메인을 실제로 다루고 있음</b>을 증명하고 신분증을 받아 둬요(예: Let's Encrypt의 ACME). 브라우저·OS에는 믿는 발급소 도장 목록(루트 인증서)이 <b>미리 들어 있어서</b>, 접속할 때 발급소에 묻지 않고 서명만 확인해요.",
    talks:[[SHOP.name,"ACME (HTTPS)","도메인 확인 · 신분증 발급 (미리, 수십 일마다)"],["내 브라우저","OS·브라우저 업데이트","도장 목록(trust store) 배포 (미리)"]],
    steps:["가게가 발급 신청","도메인 주인 확인 (HTTP-01 · DNS-01 챌린지)","신분증에 발급소 서명","유효 기간이 지나기 전에 갱신"],
    xr:[{l:"가게가 미리 신분증 받기", code:"<span class='k'>$ certbot certonly --nginx -d " + SHOP.domain + "</span>\n<span class='g'>Successfully received certificate.</span>\nCertificate is saved at: /etc/letsencrypt/live/" + SHOP.domain + "/fullchain.pem\nThis certificate expires on 2026-12-30."}],
    myth:"브라우저가 접속할 때마다 발급소에 물어본다? — 도장 목록을 미리 갖고 있어 그 자리에서 서명만 확인해요." },

  shop:{ name:SHOP.name, real:"nginx (웹 서버 + 앱)",
    tip:"요청을 실제로 처리해 페이지를 돌려주는 가게예요. 문은 80번과 443번 두 개예요.",
    what:"문지기가 봉인을 푼 요청을 받아 <b>무엇을 원하는지(메서드·경로·헤더)</b> 보고 응답을 만들어요. 응답은 다시 같은 세션 열쇠로 봉인돼 같은 연결로 돌아가요. 봉인은 길 위에서만 — 가게 안에서는 평문으로 처리돼요.",
    talks:[["문지기 (TLS)","가게 안","봉인 푼 요청 받기 · 응답 넘기기"],["내 브라우저","HTTP/1.1 (TLS 위)","요청 · 응답"]],
    steps:["요청 줄 읽기 (GET / HTTP/1.1)","헤더 읽기 (Host · Cookie)","페이지 만들기","응답 줄·헤더 붙이기 (200 OK · Content-Type)","문지기에게 넘겨 봉인"],
    xr:[{l:"가게의 접수 기록 (access log)", code:"192.0.2.10 - - [08/Oct/2026:14:03:21 +0900] \"GET / HTTP/1.1\" <span class='g'>200</span> 5123 \"-\" \"Mozilla/5.0 ...\""},
        {l:"돌려준 응답 머리", code:"HTTP/1.1 <span class='g'>200 OK</span>\nServer: nginx\nContent-Type: text/html; charset=utf-8\nContent-Length: 5123\nCache-Control: no-cache\nETag: \"6ac72104-1403\"\nStrict-Transport-Security: max-age=31536000"}],
    myth:"HTTPS면 가게 안의 데이터도 안전하다? — 봉인은 길 위에서만이에요. 가게 안에서는 열어서 처리해요." }
};

/* ── 사건 1: https 로 들어가기 ── */
var HTTPS_BEATS = [
  { actor:"browser",
    text:"주소창에 https://" + SHOP.domain + " 을 치면, 브라우저는 먼저 이 이름의 <b>번호(IP)</b>를 알아야 해요. 수첩(캐시)에 없으니 동네 안내소(DNS)에 물어요.",
    xray:[{l:"브라우저가 주소를 나눈 모습", code:"https://" + SHOP.domain + "/\n<span class='c'>scheme</span> https   <span class='c'>→ 443번 문 · TLS 봉인</span>\n<span class='c'>host  </span> " + SHOP.domain + "\n<span class='c'>path  </span> /"},
          {l:"안내소로 나간 질문 (UDP 53)", code:"IP 192.0.2.10.51834 > 192.0.2.53.53: 41982+ A? " + SHOP.domain + ". (37)"}] },
  { actor:"resolver",
    text:"안내소는 <b>루트 → .com → example.com 담당</b> 관청을 차례로 물어 답 " + SHOP_IP + " 를 받아 와요. 이 질문과 답은 봉인 없이 엽서처럼 오가요.",
    xray:[{l:"관청마다 받은 답", code:".                    IN NS a.root-servers.net.   <span class='c'># 루트에 물으러 감</span>\ncom.                 IN NS a.gtld-servers.net.   <span class='c'># 루트: .com 은 저기</span>\nexample.com.         IN NS ns1.example.com.      <span class='c'># .com: example.com 은 저기</span>\n" + SHOP.domain + ". 300 IN A <span class='g'>" + SHOP_IP + "</span>        <span class='c'># 권한 NS: 번호는 이것</span>"},
          {l:"브라우저가 받은 답", code:"IP 192.0.2.53.53 > 192.0.2.10.51834: 41982 1/0/0 A " + SHOP_IP + " (53)"}] },
  { actor:"door443",
    text:"이제 " + SHOP_IP + " 의 <b>443번 문</b>에 연결을 청해요. SYN → SYN-ACK → ACK 세 번이면 TCP 연결이 생겨요 — 끈은 그림일 뿐, 실제로는 양 끝이 번호를 기억하는 거예요.",
    xray:[{l:"길 위에서 잡힌 세 번의 악수", code:"<span class='k'>$ sudo tcpdump -t -n 'host " + SHOP_IP + " and port 443'</span>\nIP 192.0.2.10.54122 > " + SHOP_IP + ".443: Flags [S], seq 1830412270, win 64240, options [mss 1460,…], length 0\nIP " + SHOP_IP + ".443 > 192.0.2.10.54122: Flags [S.], seq 3221790041, ack 1830412271, win 65160, options [mss 1460,…], length 0\nIP 192.0.2.10.54122 > " + SHOP_IP + ".443: Flags [.], ack 1, win 502, options [nop,nop,TS …], length 0"}] },
  { actor:"guard",
    text:"브라우저가 <b>ClientHello</b>(가게 이름 + 열쇠 재료)를 보내면 문지기가 ServerHello(열쇠 재료)로 답해요. 양쪽은 재료를 섞어 같은 열쇠를 만들어요. 신분증(Certificate)은 그 뒤 이 열쇠로 암호화된 별도 메시지로 따로 와요.",
    xray:[{l:"ClientHello — 길 위에서 그대로 보임", code:"Handshake Protocol: Client Hello\n  Cipher Suites: TLS_AES_128_GCM_SHA256, TLS_CHACHA20_POLY1305_SHA256, ...\n  Extension: server_name → <span class='y'>" + SHOP.domain + "</span>   <span class='c'># SNI</span>\n  Extension: supported_versions → TLS 1.3\n  Extension: key_share → x25519, 공개 값 32바이트"},
          {l:"ServerHello — 이 뒤부터는 암호화", code:"Handshake Protocol: Server Hello\n  Cipher Suite: TLS_AES_128_GCM_SHA256\n  Extension: key_share → x25519, 공개 값 32바이트\n<span class='c'>--- 여기부터 세션 열쇠로 암호화 ---</span>\nEncrypted Extensions · Certificate · CertificateVerify · Finished"}] },
  { actor:"cert",
    text:"받은 <b>신분증</b>의 이름·기한·서명을 미리 갖고 있던 도장 목록으로 그 자리에서 확인해요. 이어 양쪽이 <b>Finished</b>를 주고받으면 봉인이 끝나요(노란 선).",
    xray:[{l:"브라우저가 확인한 항목 (curl -v)", code:"* Server certificate:\n*  subject: CN=" + SHOP.domain + "\n*  start date: Oct  1 00:00:00 2026 GMT\n*  expire date: Dec 30 23:59:59 2026 GMT\n*  subjectAltName: host \"" + SHOP.domain + "\" matched cert's \"" + SHOP.domain + "\"\n*  issuer: C=US; O=Let's Encrypt; CN=E5\n*  <span class='g'>SSL certificate verify ok.</span>"},
          {l:"봉인 완료 — 양쪽 Finished (curl -v)", code:"* TLSv1.3 (IN), TLS handshake, Finished (20):\n* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):\n* TLSv1.3 (OUT), TLS handshake, Finished (20):\n* SSL connection using TLSv1.3 / TLS_AES_128_GCM_SHA256 / X25519 / id-ecPublicKey"}] },
  { actor:"snoop",
    text:"이제 <b>HTTP 요청</b>(GET / · 쿠키)이 봉인 상자에 담겨 중계소를 지나가요. 엿보는 사람에게는 받는 주소와 가게 이름(SNI)만 보이고, 상자 안은 보이지 않아요.",
    xray:[{l:"길 위에서 보이는 것", code:"IP 192.0.2.10.54122 > " + SHOP_IP + ".443: Flags [P.], seq …, ack …, win 502, options [nop,nop,TS …], length 91\n  0x0000:  4500 008f 1c46 4000 4006 201e c000 020a  <span class='c'># IP 헤더 — 전체 길이 0x008f = 143바이트</span>\n  0x0020:  8018 .... .... 0000 0101 080a .... ....  <span class='c'># TCP 타임스탬프 옵션(0101 080a)은 0x0028 부터</span>\n  0x0030:  .... .... 1703 0300 563f c19e 4b77 d0a1  <span class='c'># 17 03 03 00 56 = TLS 1.3 레코드 머리(길이 86), 그 뒤는 알아볼 수 없음</span>"},
          {l:"상자 안에 든 것 (가게만 열어 봄)", code:"GET / HTTP/1.1\nHost: " + SHOP.domain + "\nCookie: sid=7f3a9c2e41"}] },
  { actor:"shop",
    text:"문지기가 상자를 열어 넘기면 가게는 <b>200 OK</b>와 페이지를 만들어 다시 봉인해 보내요. 이름 찾기 → 연결 → 봉인 → 배달 중, HTTPS가 더한 건 '봉인' 한 단계예요.",
    xray:[{l:"가게가 돌려준 응답 (봉인 안쪽)", code:"HTTP/1.1 <span class='g'>200 OK</span>\nContent-Type: text/html; charset=utf-8\nContent-Length: 5123\nCache-Control: no-cache\nETag: \"6ac72104-1403\"\nStrict-Transport-Security: max-age=31536000\n\n&lt;!doctype html&gt; ..."},
          {l:"가게의 접수 기록", code:"192.0.2.10 - - [08/Oct/2026:14:03:21 +0900] \"GET / HTTP/1.1\" <span class='g'>200</span> 5123"}] }
];

/* ── 사건 2: http 로 들어가면? ── */
var HTTP_BEATS = [
  { actor:"door80",
    text:"이번엔 <b>HSTS 기록이 지워진</b> 브라우저(쿠키는 남아 있어요)로 http:// 를 쳐요. 번호는 수첩에 있어 바로 <b>80번 문</b>과 연결해요 — 문지기도 열쇠도 없어요.",
    xray:[{l:"80번 문과의 연결", code:"<span class='k'>$ curl -v http://" + SHOP.domain + "/</span>\n*   Trying " + SHOP_IP + ":80...\n* Connected to " + SHOP.domain + " (" + SHOP_IP + ") port 80\n<span class='c'># TLS 줄이 하나도 없어요</span>"}] },
  { actor:"snoop",
    text:"요청이 <b>엽서</b>로 길을 가요. 엿보는 사람은 경로와 쿠키까지 그대로 읽고, 마음먹으면 내용을 바꿔치기할 수도 있어요.",
    xray:[{l:"길 위에서 그대로 읽힌 요청", code:"<span class='k'>$ sudo tcpdump -t -n -A 'port 80'</span>\nIP 192.0.2.10.54130 > " + SHOP_IP + ".80: Flags [P.], seq 1:70, ack 1, win 502, options [nop,nop,TS …], length 69\n<span class='y'>GET / HTTP/1.1\nHost: " + SHOP.domain + "\nCookie: sid=7f3a9c2e41\n# Secure 표시가 없는 쿠키라 http 에도 실려요</span>"}] },
  { actor:"door80",
    text:"가게는 엽서 요청에 페이지 대신 <b>301</b>로 'https 주소로 다시 오세요'라고 답해요. 하지만 처음 보낸 엽서는 이미 길 위에서 읽혔어요.",
    xray:[{l:"80번 문의 답", code:"HTTP/1.1 <span class='y'>301 Moved Permanently</span>\nServer: nginx\nLocation: https://" + SHOP.domain + "/"}] },
  { actor:"browser",
    text:"브라우저는 https 로 다시 들어가 봉인된 응답에 붙은 <b>HSTS</b>를 수첩에 적어요. 다음부터는 http 로 쳐도 길에 나가기 전에 https 로 바꿔요 — 차이는 결국 엽서냐 봉인 상자냐예요.",
    xray:[{l:"봉인된 응답에 붙은 HSTS", code:"HTTP/1.1 <span class='g'>200 OK</span>\nStrict-Transport-Security: max-age=31536000\n<span class='c'># http 엽서 응답에 붙은 HSTS 는 브라우저가 무시해요</span>"},
          {l:"다음 방문: 길에 나가기 전에 바꿈 (DevTools)", code:"Request URL: http://" + SHOP.domain + "/\nStatus Code: <span class='y'>307 Internal Redirect</span>\nNon-Authoritative-Reason: HSTS\nLocation: https://" + SHOP.domain + "/"}] }
];

/* ── 사건 3: 신분증이 틀리면? ── */
var BADCERT_BEATS = [
  { actor:"snoop",
    text:"https 사건에 이어 번호와 HSTS 가 수첩에 있는 브라우저로, 이번엔 카페 와이파이에서 접속해요. 길가의 엿보는 사람이 <b>ClientHello</b>를 가로채 '내가 my-shop' 이라며 대신 답하려 해요.",
    xray:[{l:"중간에서 대신 받은 연결", code:"<span class='c'># 브라우저는 " + SHOP_IP + " 의 443번 문과 악수한다고 믿지만,\n# 와이파이를 장악한 엿보는 사람이 가게 행세를 하며 대신 답해요</span>\nIP 192.0.2.10.54131 > " + SHOP_IP + ".443: Flags [S], seq …, win 64240, options [mss 1460,…], length 0\nIP " + SHOP_IP + ".443 > 192.0.2.10.54131: Flags [S.], seq …, ack …, win 65160, options [mss 1460,…], length 0   <span class='c'># 답한 건 중간자</span>"},
          {l:"가로챈 ClientHello — 여기까지는 평소와 같아요", code:"Handshake Protocol: Client Hello\n  Extension: server_name → <span class='y'>" + SHOP.domain + "</span>   <span class='c'># 누구 행세를 하면 될지 알려 주는 셈</span>\n  Extension: key_share → x25519, 공개 값 32바이트"}] },
  { actor:"ca",
    text:"엿보는 사람은 이름을 " + SHOP.domain + " 으로 적은 <b>가짜 신분증</b>을 직접 만들어 보내요. 이름·기한은 맞아도 도장이 자기 것(자체 서명)이라, 미리 받아 둔 발급소 도장 목록에 없어 떨어져요.",
    xray:[{l:"가짜 신분증을 받은 openssl", code:"<span class='k'>$ openssl s_client -connect " + SHOP.domain + ":443 -servername " + SHOP.domain + "</span>\nConnecting to " + SHOP_IP + "\ndepth=0 CN=" + SHOP.domain + "\nverify error:num=18:<span class='y'>self-signed certificate</span>\nverify return:1\ndepth=0 CN=" + SHOP.domain + "\nverify return:1\nCONNECTED(00000003)\n---\nCertificate chain\n 0 s:CN=" + SHOP.domain + "\n   i:CN=" + SHOP.domain + "   <span class='c'># 발급자 = 자기 자신</span>\n…\nVerify return code: <span class='y'>18 (self-signed certificate)</span>"},
          {l:"curl 은 여기서 멈춰요", code:"<span class='k'>$ curl https://" + SHOP.domain + "/</span>\ncurl: (60) SSL certificate problem: <span class='y'>self-signed certificate</span>\nMore details here: https://curl.se/docs/sslcerts.html"}] },
  { actor:"guard",
    text:"그럼 진짜 가게 신분증을 복사해 내밀면? 신분증은 공개라 복사는 쉽지만, 뒤따르는 <b>CertificateVerify</b> 서명은 가게 문지기만 가진 비밀 열쇠로만 만들 수 있어 또 떨어져요.",
    xray:[{l:"진짜 신분증은 누구나 받아 갈 수 있어요", code:"<span class='k'>$ openssl s_client -connect " + SHOP.domain + ":443 -servername " + SHOP.domain + " -showcerts</span>\nCertificate chain\n 0 s:CN=" + SHOP.domain + "\n   i:C=US, O=Let's Encrypt, CN=E5\n-----BEGIN CERTIFICATE-----\nMIID…   <span class='c'># 공개 열쇠가 든 공개 문서 — 비밀 열쇠(privkey.pem)는 없어요</span>\n-----END CERTIFICATE-----"},
          {l:"CertificateVerify 규칙 (RFC 8446 4.4.3)", code:"<span class='c'># 서명 대상: 0x20 × 64 + \"TLS 1.3, server CertificateVerify\" + 0x00\n#            + 지금까지 주고받은 핸드셰이크 메시지의 해시\n# 이번 연결의 열쇠 재료가 해시에 들어 있어 예전 서명을 재사용할 수도 없어요</span>\nIf the verification fails, the receiver MUST terminate the handshake\nwith a \"decrypt_error\" alert."},
          {l:"복사본 + 다른 비밀 열쇠로 서명했을 때", code:"<span class='k'>$ openssl s_client -connect " + SHOP.domain + ":443 -servername " + SHOP.domain + " -msg</span>\n<<< TLS 1.3, Handshake [length 0050], CertificateVerify\n>>> TLS 1.3, Alert [length 0002], <span class='y'>fatal decrypt_error</span>\n…:error:0A00007B:SSL routines:tls_process_cert_verify:<span class='y'>bad signature</span>:…\nVerify return code: 0 (ok)   <span class='c'># 신분증 사슬은 통과 — 서명에서 떨어짐</span>\n<span class='k'>$ curl -v https://" + SHOP.domain + "/</span>\n* TLSv1.3 (IN), TLS handshake, CERT verify (15):\n* TLSv1.3 (OUT), TLS alert, <span class='y'>decrypt error (563)</span>:\ncurl: (35) OpenSSL/3.1.4: error:0A00007B:SSL routines::bad signature"}] },
  { actor:"browser",
    text:"브라우저는 봉인을 끝내지 않고 <b>alert</b>를 보내 연결을 끊은 뒤, 경고 화면(NET::ERR_CERT_AUTHORITY_INVALID)을 띄워요. GET 요청과 쿠키는 한 글자도 길에 나가지 않았어요.",
    xray:[{l:"끊는 순간 (curl 8.5 -v)", code:"* TLSv1.3 (IN), TLS handshake, Certificate (11):\n* TLSv1.3 (OUT), TLS alert, <span class='y'>unknown CA (560)</span>:\n* SSL certificate problem: self-signed certificate\n* Closing connection\ncurl: (60) SSL certificate problem: self-signed certificate\n<span class='c'># '> GET /' 줄이 없어요 — 요청은 보내지 않았어요\n# 최신 curl(8.22)은 핸드셰이크를 마친 뒤 확인해 alert 줄 없이 끊지만, 역시 GET 은 안 보내요</span>"},
          {l:"브라우저 경고 화면 (Chrome)", code:"Your connection is not private\nAttackers might be trying to steal your information from " + SHOP.domain + "\n(for example, passwords, messages, or credit cards). Learn more about this warning\n<span class='y'>NET::ERR_CERT_AUTHORITY_INVALID</span>"}] },
  { actor:"cert",
    text:"이번엔 엿보는 사람 없이 진짜 가게에 연결했지만, 가게가 <b>갱신을 잊은 채</b> 2027년이 됐어요. 기한(notAfter)이 지난 신분증이라 브라우저는 똑같이 끊고 NET::ERR_CERT_DATE_INVALID 를 띄워요.",
    xray:[{l:"기한이 지난 신분증 (openssl)", code:"<span class='k'>$ openssl s_client -connect " + SHOP.domain + ":443 -servername " + SHOP.domain + "</span>\ndepth=2 C=US, O=Internet Security Research Group, CN=ISRG Root X2\nverify return:1\ndepth=1 C=US, O=Let's Encrypt, CN=E5\nverify return:1\ndepth=0 CN=" + SHOP.domain + "\nverify error:num=10:<span class='y'>certificate has expired</span>\nnotAfter=Dec 30 23:59:59 2026 GMT\nverify return:1\n…\nVerify return code: <span class='y'>10 (certificate has expired)</span>"},
          {l:"curl 과 고치는 법", code:"<span class='k'>$ curl -v https://" + SHOP.domain + "/</span>\n* TLSv1.3 (OUT), TLS alert, <span class='y'>certificate expired (557)</span>:\ncurl: (60) SSL certificate problem: <span class='y'>certificate has expired</span>\n<span class='k'>$ sudo certbot renew</span>   <span class='c'># 보통은 자동 갱신 타이머가 만료 전에 미리 해 줘요</span>\n<span class='g'>Congratulations, all renewals succeeded</span>: \n  /etc/letsencrypt/live/" + SHOP.domain + "/fullchain.pem (success)"}] },
  { actor:"cert",
    text:"이번엔 주소창에 <b>www." + SHOP.domain + "</b> 을 쳤는데 신분증에는 " + SHOP.domain + " 만 있어요. 이름(subjectAltName)이 안 맞아 NET::ERR_CERT_COMMON_NAME_INVALID — 도장이 진짜여도 통과 못 해요.",
    xray:[{l:"이름이 안 맞을 때 (curl -v)", code:"<span class='k'>$ curl -v https://www." + SHOP.domain + "/</span>\n* Server certificate:\n*  subject: CN=" + SHOP.domain + "\n*  …\n*  subjectAltName does not match www." + SHOP.domain + "\n* SSL: no alternative certificate subject name matches target host name '<span class='y'>www." + SHOP.domain + "</span>'\n* Closing connection\n* TLSv1.3 (OUT), TLS alert, close notify (256):\ncurl: (60) SSL: no alternative certificate subject name matches target host name 'www." + SHOP.domain + "'"},
          {l:"openssl 로 이름까지 확인하면", code:"<span class='k'>$ openssl s_client -connect www." + SHOP.domain + ":443 -verify_hostname www." + SHOP.domain + "</span>\ndepth=0 CN=" + SHOP.domain + "\nverify error:num=62:<span class='y'>hostname mismatch</span>\nverify return:1\n…\nVerify return code: <span class='y'>62 (hostname mismatch)</span>"},
          {l:"신분증에 적힌 이름과 고치는 법", code:"<span class='k'>$ openssl x509 -in fullchain.pem -noout -ext subjectAltName</span>\nX509v3 Subject Alternative Name: \n    DNS:" + SHOP.domain + "   <span class='c'># www 가 없어요</span>\n<span class='k'>$ sudo certbot certonly --nginx -d " + SHOP.domain + " -d www." + SHOP.domain + "</span>\n<span class='c'># 두 이름을 함께 적어 다시 받으면 해결</span>"}] },
  { actor:"browser",
    text:"세 경우 모두 브라우저는 봉인을 끝내기 전에 끊어 요청을 보내지 않아요. HSTS 가 적힌 " + SHOP.domain + " 은 '그래도 계속' 버튼조차 없어요 — 신분증은 <b>봉인한 상대가 진짜 가게인지</b>를 지켜요.",
    xray:[{l:"확인 항목 → 경고 코드 (Chrome)", code:"도장(발급자)  목록에 없음      → <span class='y'>NET::ERR_CERT_AUTHORITY_INVALID</span>\n기한          notAfter 지남    → <span class='y'>NET::ERR_CERT_DATE_INVALID</span>\n이름          SAN 에 없음      → <span class='y'>NET::ERR_CERT_COMMON_NAME_INVALID</span>"},
          {l:"HSTS 가 적힌 가게의 경고 화면 (Chrome)", code:"Your connection is not private\n…\nYou cannot visit " + SHOP.domain + " right now because the website uses HSTS.\nNetwork errors and attacks are usually temporary, so this page will probably work later.\n<span class='c'># 'Proceed to " + SHOP.domain + " (unsafe)' 링크가 없어요\n# 자세히 보기: …Chrome stopped the connection before any data was exchanged.</span>"}] }
];

/* ── 사건 4: 두 번째 방문 (재사용) ── */
var REVISIT_BEATS = [
  { actor:"browser",
    text:"https 사건에 이어서, 페이지를 받은 지 30초 만에 /menu 를 눌러요. 노란 선(봉인된 연결)이 아직 열려 있어 악수도 봉인도 없이 <b>같은 연결</b>로 상자만 보내요(keep-alive).",
    xray:[{l:"같은 연결로 두 번 (curl -v)", code:"<span class='k'>$ curl -v --http1.1 https://" + SHOP.domain + "/ https://" + SHOP.domain + "/menu</span>\n* Connected to " + SHOP.domain + " (" + SHOP_IP + ") port 443\n…\n> GET / HTTP/1.1\n< HTTP/1.1 200 OK\n< Connection: keep-alive\n* Connection #0 to host " + SHOP.domain + " left intact\n…\n* Re-using existing connection with host " + SHOP.domain + "\n> GET /menu HTTP/1.1\n< HTTP/1.1 <span class='g'>200 OK</span>"},
          {l:"연결은 여전히 하나", code:"<span class='k'>$ ss -tn 'dport = :443'</span>\nState   Recv-Q Send-Q  Local Address:Port   Peer Address:Port\n<span class='g'>ESTAB</span>   0      0       192.0.2.10:54122     " + SHOP_IP + ":443   <span class='c'># 첫 요청 때와 같은 포트</span>"}] },
  { actor:"door443",
    text:"그 뒤 한동안 조용하면 가게가 연결을 닫아요(nginx 기본 75초). 노란 선과 열쇠는 사라져도 수첩에는 번호·HSTS·<b>세션 티켓</b>·페이지 사본이 남아요 — 다음 방문에 쓸 것들이에요.",
    xray:[{l:"가게 쪽 설정 (nginx 기본값)", code:"keepalive_timeout   75s;   <span class='c'># 조용한 연결을 닫기까지</span>\nssl_session_tickets on;    <span class='c'># 세션 티켓 발급</span>\nssl_session_timeout 5m;    <span class='c'># 티켓을 받아 줄 기간</span>"},
          {l:"첫 방문 때 받아 둔 세션 티켓 (curl -v)", code:"> GET / HTTP/1.1\n* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):\n* TLSv1.3 (IN), TLS handshake, Newsession Ticket (4):   <span class='c'># 봉인 직후 가게가 준 것</span>\n< HTTP/1.1 200 OK"},
          {l:"가게가 연결을 닫음", code:"IP " + SHOP_IP + ".443 > 192.0.2.10.54122: Flags [F.], seq …, ack …, win 501, options [nop,nop,TS …], length 0"}] },
  { actor:"browser",
    text:"4분 뒤 주소창에 http://" + SHOP.domain + " 을 쳐요. 수첩의 HSTS 가 길에 나가기 전에 https 로 바꾸고, 번호도 수첩에서 꺼내요(TTL 300초 안) — 80번 문과 안내소로는 <b>아무것도 안 나가요</b>.",
    xray:[{l:"길에 나가기 전에 바꿈 (DevTools)", code:"Request URL: http://" + SHOP.domain + "/\nStatus Code: <span class='y'>307 Internal Redirect</span>\nNon-Authoritative-Reason: HSTS\nLocation: https://" + SHOP.domain + "/"},
          {l:"안내소에 직접 물으면 보이는 남은 TTL", code:"<span class='k'>$ dig " + SHOP.domain + "</span>\n;; ANSWER SECTION:\n" + SHOP.domain + ".   <span class='y'>60</span>  IN  A  " + SHOP_IP + "   <span class='c'># 300초 중 240초가 지나 60초 남음</span>\n<span class='c'># 브라우저·OS 의 수첩도 같은 TTL 안에서만 답을 다시 써요</span>"}] },
  { actor:"door443",
    text:"닫힌 연결은 되살릴 수 없어 <b>SYN → SYN-ACK → ACK</b>는 다시 해요. 재사용으로도 줄일 수 없는 한 번의 왕복이에요 — 새 연결이라 내 쪽 포트 번호도 바뀌어요.",
    xray:[{l:"새 연결의 세 번 악수", code:"<span class='k'>$ sudo tcpdump -t -n 'host " + SHOP_IP + " and port 443'</span>\nIP 192.0.2.10.54126 > " + SHOP_IP + ".443: Flags [S], seq 2914470021, win 64240, options [mss 1460,…], length 0\nIP " + SHOP_IP + ".443 > 192.0.2.10.54126: Flags [S.], seq 1407783310, ack 2914470022, win 65160, options [mss 1460,…], length 0\nIP 192.0.2.10.54126 > " + SHOP_IP + ".443: Flags [.], ack 1, win 502, options [nop,nop,TS …], length 0"}] },
  { actor:"guard",
    text:"ClientHello 에 지난번 <b>세션 티켓(PSK)</b>을 붙여 보내요. 문지기가 알아보면 신분증·서명 없이 바로 봉인하고, 0-RTT 를 켠 가게라면 첫 상자를 ClientHello 와 함께 보낼 수도 있어요.",
    xray:[{l:"티켓을 붙인 ClientHello → 신분증 없는 답 (RFC 8446)", code:"Handshake Protocol: Client Hello\n  Extension: key_share → x25519, 공개 값 32바이트\n  Extension: psk_key_exchange_modes → psk_dhe_ke\n  Extension: pre_shared_key → identity = 세션 티켓   <span class='c'># 항상 맨 마지막 확장</span>\nHandshake Protocol: Server Hello\n  Extension: pre_shared_key → selected_identity = 0\n<span class='c'>--- 여기부터 암호화 ---</span>\nEncrypted Extensions · Finished   <span class='c'># Certificate · CertificateVerify 가 없어요</span>"},
          {l:"재사용 확인 (openssl)", code:"<span class='k'>$ openssl s_client -connect " + SHOP.domain + ":443 -servername " + SHOP.domain + " -sess_out sess.pem</span>\n<span class='y'>New</span>, TLSv1.3, Cipher is TLS_AES_128_GCM_SHA256\n<span class='k'>$ openssl s_client -connect " + SHOP.domain + ":443 -servername " + SHOP.domain + " -sess_in sess.pem -msg</span>\n<<< TLS 1.3, Handshake [length …], ServerHello\n<<< TLS 1.3, Handshake [length 000a], EncryptedExtensions\n<<< TLS 1.3, Handshake [length 0034], Finished   <span class='c'># Certificate 줄이 없어요</span>\n<span class='g'>Reused</span>, TLSv1.3, Cipher is TLS_AES_128_GCM_SHA256\nEarly data was not sent   <span class='c'># 0-RTT 는 쓰지 않았어요</span>\n<span class='k'>$ openssl sess_id -in sess.pem -noout -text</span>\n    TLS session ticket lifetime hint: 300 (seconds)"},
          {l:"0-RTT 를 켜려면 (nginx)", code:"ssl_early_data on;                            <span class='c'># 기본은 off</span>\nproxy_set_header Early-Data $ssl_early_data;  <span class='c'># 앱에 '0-RTT 로 온 요청'임을 알림</span>\n<span class='c'># 0-RTT 상자는 남이 그대로 다시 보낼 수 있어(재전송) GET 처럼 여러 번 와도 되는 요청에만\n# 위험한 요청이면 앱이 425 Too Early 로 돌려보내요 (RFC 8470)</span>"}] },
  { actor:"shop",
    text:"상자 속 요청에는 사본의 ETag 가 <b>If-None-Match</b> 로 붙어 가요. 가게는 그대로인 걸 확인하고 본문 없이 304 만 돌려주고, style.css 는 max-age 안이라 아예 묻지 않아요.",
    xray:[{l:"조건부 요청과 304 (봉인 안쪽)", code:"GET / HTTP/1.1\nHost: " + SHOP.domain + "\nIf-None-Match: \"6ac72104-1403\"\nCookie: sid=7f3a9c2e41\n\nHTTP/1.1 <span class='g'>304 Not Modified</span>\nServer: nginx\nLast-Modified: Thu, 08 Oct 2026 04:50:12 GMT\nConnection: keep-alive\nETag: \"6ac72104-1403\"\nCache-Control: no-cache\n<span class='c'># 본문 없음 — 5123바이트를 다시 받지 않아요</span>"},
          {l:"style.css 를 처음 받을 때 붙은 기한", code:"HTTP/1.1 200 OK\nCache-Control: max-age=86400\n<span class='c'># DevTools Network 의 Size 칸: (disk cache) — 가게에 묻지 않고 사본을 씀</span>"},
          {l:"가게의 접수 기록", code:"192.0.2.10 - - [08/Oct/2026:14:07:21 +0900] \"GET / HTTP/1.1\" <span class='g'>304</span> 0\n<span class='c'># style.css 는 줄이 없어요 — 요청이 오지 않았으니까요</span>"}] },
  { actor:"browser",
    text:"첫 방문과 비교하면 DNS·80번 문·신분증 확인·본문 전송이 빠지고, 새로 한 건 TCP 악수와 짧은 봉인뿐이에요. 재사용의 핵심은 <b>확인한 것을 수첩에 적고 기한 안에서만 믿기</b>예요.",
    xray:[{l:"첫 방문 vs 4분 뒤 다시", code:"             첫 방문                     4분 뒤 다시\nhttp→https   80번 문 왕복 + 301 (http 로 쳤다면)   HSTS 로 집 안에서 (307)\nDNS          안내소 → 관청 3곳             수첩 (TTL 300초 안)\nTCP          SYN · SYN-ACK · ACK           다시 함 (생략 불가)\nTLS          전체 + 신분증 확인            세션 티켓(PSK) · 신분증 없음\nHTTP         200 + 본문 5123바이트         304 · 본문 0바이트"},
          {l:"수첩마다 정해진 기한", code:"DNS          TTL 300          <span class='c'># 가게 주인이 DNS 에 정함</span>\nHSTS         max-age=31536000 <span class='c'># 1년 · 가게 응답 헤더</span>\n세션 티켓    ssl_session_timeout 5m\n페이지 사본  Cache-Control: no-cache      <span class='c'># 쓰기 전에 매번 ETag 로 확인</span>\nstyle.css    Cache-Control: max-age=86400 <span class='c'># 하루 동안 묻지 않음</span>"}] }
];

/* 직접 지은 이름 — 가게 도메인은 shop-web 벌에서 읽는다 */
var CUSTOM = {"my-shop":"c", "example.com":"cdom2", "ns1.example.com":"cns", "sid":"ccookie",
  "my-shopp.example.com":"cdom", "fullchain.pem":"cfile", "/menu":"cpath", "style.css":"cpath", "sess.pem":"csess"};
CUSTOM[SHOP.domain] = "cdom";
CUSTOM["www." + SHOP.domain] = "cdomw";
CUSTOM["/etc/letsencrypt/live/" + SHOP.domain + "/fullchain.pem"] = "cfile";
CUSTOM["/etc/letsencrypt/live/" + SHOP.domain + "/privkey.pem"] = "cfile";
var SHOP_IP_RE = SHOP_IP.replace(/\./g, "\\.");

window.CONTENT = {
  meta:{
    concepts:["dns", "udp", "tcp", "tls", "sni", "certificate", "certificate-authority", "http", "https", "hsts", "http-cache"],
    guest:"browser",
    values:["shop-web", "guest-browser"],
    hubColor:"#c99a2e",
    doors:[{from:"shop", to:"network-layers:server", why:"가게 안의 7층 빌딩을 보러 간다"}]
  },
  title:"우편 도시: 주소 하나가 가게에 닿기까지",
  subtitle:"DNS → TCP → TLS → HTTP 를 우편 도시로 그렸어요",
  logo:"✉",
  intro:{
    title:"이 도시가 인터넷이에요",
    body:"왼쪽 <b>내 브라우저</b>가 오른쪽 <b>" + SHOP.name + "</b>에 편지를 보내요. 그러려면 먼저 위쪽 <b>이름 찾기 구역</b>에서 번호를 알아내고, 누구나 지나다니는 <b>공용 도로</b>를 건너야 해요.<br>왼쪽 아래 버튼으로 https 와 http 를 각각 보내 보고, 길가의 엿보는 사람에게 무엇이 보이는지 비교해 보세요. 신분증이 틀릴 때와 다시 방문할 때도 일으켜 볼 수 있어요.",
    sub:"궁금한 건물이나 인물은 언제든 눌러 보세요. 누를수록 더 깊이 들어갑니다."
  },
  actors:ACTORS,
  events:[
    {id:"https", kind:"normal", icon:"🔒", title:"https 로 들어가기", sub:"이름 찾기 → 연결 → 봉인 → 배달", beats:HTTPS_BEATS},
    {id:"http", kind:"attack", icon:"✉️", title:"http 로 들어가면?", sub:"봉인 없는 엽서와 비교하기", beats:HTTP_BEATS},
    {id:"badcert", kind:"failure", icon:"⚠️", title:"신분증이 틀리면?", sub:"가짜·만료·이름 불일치 신분증", beats:BADCERT_BEATS},
    {id:"revisit", kind:"revisit", icon:"↻", title:"두 번째 방문 (재사용)", sub:"수첩 덕분에 무엇이 빠지나", beats:REVISIT_BEATS}
  ],
  names:{
    examples:{o:"ClientHello", c:SHOP.domain, a:SHOP_IP},
    official:["DNS","TCP","TLS","HTTP","HTTPS","IP","UDP","SYN","SYN-ACK","ACK","ESTABLISHED","ESTAB","ClientHello","ServerHello",
      "Client hello","Server hello","Client Hello","Server Hello","Certificate","CertificateVerify","CERT verify","Finished","Encrypted Extensions",
      "key_share","server_name","supported_versions","SNI","TLS 1.3","TLSv1.3","TLSv1.2","TLS 1.2","ECDHE","x25519","X25519","TLS_AES_128_GCM_SHA256",
      "TLS_CHACHA20_POLY1305_SHA256","Cipher Suites","Cipher Suite","GET","Host","Cookie","200 OK","301 Moved Permanently","301","307 Internal Redirect",
      "Location","Content-Type","Content-Length","Server","Strict-Transport-Security","HSTS","max-age","HTTP/1.1","NOERROR","NXDOMAIN","TTL",
      "QUESTION SECTION","ANSWER SECTION","Flags","seq","ack","subjectAltName","subject","issuer","CN","X.509","notBefore","notAfter",
      "a.root-servers.net","a.gtld-servers.net",".com","TLD","Root","Authoritative NS","DoH","DoT","ACME","HTTP-01","DNS-01",
      "trust store","IPv4","Connection refused","listen","server_name","ssl_certificate","ssl_certificate_key","ssl_protocols","return",
      "scheme","host","path","Non-Authoritative-Reason","access log","dynamic_sts_domain","FORCE_HTTPS","utf-8",
      "NET::ERR_CERT_AUTHORITY_INVALID","NET::ERR_CERT_DATE_INVALID","NET::ERR_CERT_COMMON_NAME_INVALID","TLS alert","alert","unknown CA",
      "self-signed certificate","certificate has expired","hostname mismatch","Verify return code","verify error","verify return","SignatureScheme",
      "X509v3 Subject Alternative Name","Newsession Ticket","pre_shared_key","psk_key_exchange_modes","psk_dhe_ke","selected_identity","PSK","0-RTT",
      "Reused","New","Early data was not sent","ssl_early_data","Early-Data","425 Too Early","keepalive_timeout","ssl_session_tickets","ssl_session_timeout",
      "keep-alive","Re-using existing connection","Cache-Control","no-cache","ETag","If-None-Match","304 Not Modified","disk cache","FIN",
      "Request URL","Status Code","decrypt_error","decrypt error","bad signature","close notify","certificate expired","Last-Modified",
      "Connection","Resumption PSK","TLS session ticket lifetime hint","id-ecPublicKey"],
    projects:["curl","dig","tcpdump","openssl","nginx","Let's Encrypt","ISRG Root X2","E5","certbot","Chrome","traceroute","ss","Mozilla/5.0","Internet Security Research Group","DevTools","OpenSSL"],
    custom:CUSTOM,
    auto:{"41982":"adns", "52210":"adns", "7f3a9c2e41":"asess", "1830412270":"aseq", "1830412271":"aseq", "3221790041":"aseq",
      "2914470021":"aseq", "2914470022":"aseq", "1407783310":"aseq", "6ac72104-1403":"aetag"},
    patterns:[
      {re:SHOP_IP_RE + "\\.(?:443|80)", parts:function(m){ var i = m.lastIndexOf("."); return [["a","aip",m.slice(0,i)], ["o","oport",m.slice(i)]]; }},
      {re:SHOP_IP_RE, parts:function(m){ return [["a","aip",m]]; }},
      {re:"192\\.0\\.2\\.\\d+\\.\\d{5}", parts:function(m){ var i = m.lastIndexOf("."); return [["a","anet",m.slice(0,i)], ["a","aport",m.slice(i)]]; }},
      {re:"192\\.0\\.2\\.\\d+(?:#53)?", parts:function(m){ return [["a","anet",m]]; }},
      {re:"443|80|53", parts:function(m){ return [["o","oport",m]]; }},
      {re:"5412\\d|5413\\d|51834", parts:function(m){ return [["a","aport",m]]; }}
    ],
    messages:{
      o:"<b>공식 용어</b> · 인터넷 표준(RFC)이나 도구가 정한 이름이라 그대로 써야 해요.",
      oext:"<b>공식 이름</b> · 함께 쓰는 도구·기관의 정식 이름이에요. 그대로 써요.",
      oport:"<b>표준 번호</b> · 잘 알려진 포트예요. HTTP 80, HTTPS 443, DNS 53 으로 정해져 있어요.",
      cdom:"<b>직접 지은 이름</b> · 가게 주인이 정한 도메인 이름(서브도메인 my-shop)이에요. 다른 이름이어도 돼요.",
      cdom2:"<b>직접 산 이름</b> · 도메인 주인이 등록한 이름이에요. (example.com 은 예시용으로 예약된 이름)",
      cns:"<b>직접 정한 이름</b> · 도메인 주인이 정한 네임서버 이름이에요.",
      ccookie:"<b>직접 지은 이름</b> · 가게(앱) 개발자가 정한 쿠키 이름이에요.",
      cfile:"<b>직접 정한 경로</b> · 인증서·열쇠 파일을 어디 둘지는 가게 관리자가 정해요.",
      cdomw:"<b>직접 지은 이름</b> · 가게 주인이 따로 만든 이름(www 서브도메인)이에요. 신분증에 이 이름도 적어야 통과해요.",
      cpath:"<b>직접 지은 이름</b> · 가게(앱) 개발자가 정한 경로·파일 이름이에요.",
      csess:"<b>직접 정한 파일 이름</b> · openssl 에게 세션을 저장해 두라고 정한 파일이에요.",
      aetag:"<b>자동 생성</b> · nginx 가 파일의 수정 시각(16진수)과 크기(5123 = 0x1403)로 만든 값이에요. 내용이 바뀌면 달라져요.",
      aip:"<b>자동 배정</b> · 클라우드·호스팅 업체가 가게 서버에 배정한 공인 IP예요. 주인은 이 값을 DNS에 적어 둘 뿐이고, 서버를 옮기면 바뀌어요.",
      anet:"<b>자동 배정</b> · 공유기·통신사가 내 컴퓨터(또는 안내소 주소)에 자동으로 정해 준 값이에요. 네트워크를 옮기면 바뀌어요.",
      aport:"<b>자동 생성</b> · 내 쪽 포트 번호는 OS가 연결마다 비어 있는 번호를 골라 붙여요(임시 포트).",
      aseq:"<b>자동 생성</b> · 연결마다 무작위로 시작하는 순서 번호(seq)예요. 남이 끼어들기 어렵게 해요.",
      adns:"<b>자동 생성</b> · DNS 질문마다 붙는 무작위 번호예요. 답이 어느 질문의 것인지 맞춰 봐요.",
      asess:"<b>자동 생성</b> · 가게가 로그인한 손님에게 발급한 세션 값이에요. 이걸 훔치면 손님 행세를 할 수 있어요."
    }
  }
};
})();
