/* 층층 우체국 빌딩 — 겹 1(말풍선·자막) · 겹 2(패널) · 겹 3(실제로는?) · 이름 규칙
   actors 의 키는 world.js 의 ISO.act(..., "키") 와 같다. 장면(beats)은 world.js scenes 와 개수·순서가 같다.
   예시 값: 노트북 10.0.1.23 (MAC …53:23) → 스위치 → 라우터 10.0.1.1(…53:01) | 10.0.2.1(…53:02) → 서버 10.0.2.10 (…53:10)
   HTTP 요청 78바이트 · TCP 헤더 32 · IP 헤더 20 · IP 길이 130 · Ethernet 헤더 14 · 프레임 144 (+FCS 4) */
(function(){
"use strict";

/* D22: 도메인 길이에 묶인 HTTP 78바이트 예제를 보존한다.
   shop-web의 도메인·공인 IP 대신 이 세계의 도메인과 내부망 주소를 쓴다. */
var SHOP_NAME = window.SHARED.shops["shop-web"].shortName;

var REQ = "GET / HTTP/1.1<span class='c'>\\r\\n</span>\nHost: my-shop.example<span class='c'>\\r\\n</span>\nUser-Agent: curl/8.5.0<span class='c'>\\r\\n</span>\nAccept: */*<span class='c'>\\r\\n</span>\n<span class='c'>\\r\\n   ← 빈 줄 = 헤더 끝</span>";
/* D22 단언: 화면의 요청 줄(\r\n 포함)이 78바이트여야 TCP·IP·프레임 길이(130 · 144)가 맞는다 */
var REQ_BYTES = 78;
(function(){
  var raw = REQ.replace(/<span class='c'>\\r\\n[^<]*<\/span>\n?/g, "\r\n").replace(/<[^>]+>/g, "");
  if(raw.length !== REQ_BYTES) console.error("network-layers: 예제 HTTP 요청이 " + raw.length + "바이트 — " + REQ_BYTES + "바이트여야 130 · 144 가 맞는다 (D22)");
})();
var DUMP_L = "<span class='k'>$ sudo tcpdump -i eth0 -n -e 'tcp port 80'</span>\n10:21:07.412893 00:00:5e:00:53:23 > 00:00:5e:00:53:01, ethertype IPv4 (0x0800), length 144: 10.0.1.23.51514 > 10.0.2.10.80: Flags [P.], seq 1:79, ack 1, win 502, options [nop,nop,TS val 3051624811 ecr 1923044210], length 78: HTTP: GET / HTTP/1.1";

var ACTORS = {
  client:{ name:"요청 프로그램", real:"curl (HTTP 클라이언트 프로그램)",
    tip:"옥상에서 '페이지 주세요' 편지를 쓰게 하는 프로그램이에요. 브라우저도 같은 자리예요.",
    what:"사용자가 실행한 <b>프로그램</b>이에요. 프로그램 자체는 층이 아니라 7층 위에 있고, 7층 규칙(HTTP)을 빌려 요청을 써요. 4층 아래 일은 운영체제에 맡기고 바이트만 주고받아요(소켓 API).",
    talks:[["7층 응용 (HTTP)","라이브러리 호출","요청 내용 · 응답 본문"],["4층 전송 (TCP)","소켓 API (connect · send · recv)","보낼 바이트 · 받은 바이트"]],
    steps:["URL에서 이름·포트·경로 읽기","이름을 IP로 바꾸기 (DNS)","운영체제에 연결 부탁하기 (connect)","요청 바이트 넘기기 (send)","응답 바이트 읽기 (recv)"],
    xr:[{l:"curl 이 보여 주는 대화 (-v)", code:"<span class='k'>$ curl -v http://my-shop.example/</span>\n*   Trying 10.0.2.10:80...\n* Connected to my-shop.example (10.0.2.10) port 80\n> GET / HTTP/1.1\n> Host: my-shop.example\n> User-Agent: curl/8.5.0\n> Accept: */*\n>\n< HTTP/1.1 <span class='g'>200 OK</span>\n< Server: nginx\n<span class='c'># my-shop.example 은 직접 지은 이름 (example 은 문서용 도메인)</span>"}],
    myth:"프로그램이 직접 랜선에 신호를 보낸다? — 아니에요, 소켓에 바이트를 넘기면 그 아래는 운영체제와 랜카드가 해요." },

  app:{ name:"7층 응용", real:"HTTP (L7 응용 계층)",
    tip:"무엇을 원하는지 '내용'만 쓰는 층이에요. 주소와 배달은 신경 쓰지 않아요.",
    what:"HTTP·DNS·SSH처럼 <b>프로그램끼리 주고받는 말의 형식</b>을 정해요. 이 사건에서는 <code>GET / HTTP/1.1</code> 편지를 써요. 7층이 쓴 편지는 맞은편 7층(nginx)만 읽어요.",
    talks:[["맞은편 7층 (nginx)","HTTP (논리적인 짝)","GET 요청 · 200 응답"],["아래 4층 (TCP)","소켓 API","편지 바이트 넘기기"]],
    steps:["메서드·경로 정하기 (GET /)","헤더 붙이기 (Host · User-Agent · Accept)","빈 줄로 헤더 끝 표시","바이트로 만들어 아래층에 넘기기"],
    xr:[{l:"실제로 나가는 HTTP 요청", code:REQ + "\n<span class='c'># 16 + 23 + 24 + 13 + 2 = 78바이트</span>"},
        {l:"자주 보는 7층 규칙과 기본 포트", code:"HTTP 80 · HTTPS 443 · DNS 53 · SSH 22 · SMTP 25\n<span class='c'># 포트는 4층의 번호 — 7층 규칙마다 기본값이 정해져 있어요</span>"}],
    myth:"7층 = 앱 그 자체? — 아니에요, 앱이 쓰는 '대화 규칙'(HTTP)이 7층이에요. 크롬·curl은 그 규칙을 쓰는 프로그램이에요." },

  upper56:{ name:"6층 표현 · 5층 세션", real:"L5·L6 (세션·표현 계층)",
    tip:"형식 바꾸기(6층)와 대화 관리(5층)를 맡는 층이지만, 인터넷에서는 대개 따로 없어요.",
    what:"OSI 모델은 <b>표현(6층: 암호화·압축·문자 인코딩)</b>과 <b>세션(5층: 대화 열고 닫기)</b>을 따로 두었어요. 실제 인터넷에서는 이 일을 앱이나 TLS가 맡아서, TCP/IP 모델은 5·6·7층을 '응용 계층' 하나로 묶어요.",
    talks:[["7층 응용","같은 프로그램 안","인코딩·압축은 HTTP 헤더로 합의"],["4층 전송 (TCP)","TLS 레코드 (https 일 때)","암호화된 바이트"]],
    steps:["http:// 이면 아무것도 하지 않음","https:// 이면 TLS가 서버 인증서 확인","합의한 키로 편지 암호화 (TLS 레코드)","압축·문자 인코딩은 앱이 처리 (Content-Encoding · UTF-8)"],
    xr:[{l:"http:// 와 https:// 의 차이 (curl -v)", code:"<span class='k'>$ curl -v http://my-shop.example/</span>\n* Connected to my-shop.example (10.0.2.10) port 80\n> GET / HTTP/1.1\n<span class='c'># TLS 줄이 없어요 — 편지가 그대로 4층으로</span>\n\n<span class='k'>$ curl -v https://my-shop.example/</span>\n* Connected to my-shop.example (10.0.2.10) port 443\n…\n* SSL connection using TLSv1.3 / …\n> GET / HTTP/1.1\n<span class='c'># 이 GET 은 TLS 봉인 안에서 나가요</span>"}],
    myth:"TLS는 정확히 6층이다? — 딱 맞는 자리가 없어요. TCP 위·HTTP 아래에서 일해서 흔히 '5~6층쯤'이라고 부를 뿐이에요." },

  tcp:{ name:"4층 전송", real:"TCP (L4 전송 계층)",
    tip:"편지를 '어느 프로그램에게, 몇 번째 바이트인지' 적은 봉투에 넣는 층이에요.",
    what:"<b>포트 번호</b>로 컴퓨터 안의 어느 프로그램인지 가리키고, <b>순서 번호(seq)</b>와 확인 응답(ack)으로 빠짐없이 순서대로 닿게 해요. 잃어버리면 다시 보내요(재전송). 빠름이 더 중요하면 순서·재전송이 없는 UDP를 써요.",
    talks:[["맞은편 4층 (서버 TCP)","TCP 세그먼트","데이터 · seq/ack · 창 크기"],["아래 3층 (IP)","운영체제 내부","세그먼트를 IP 패킷의 내용으로 넘기기"]],
    steps:["연결 확인 (이미 ESTAB)","포트 적기 (출발 51514 · 도착 80)","순서 번호 매기기 (seq 1:79)","헤더 붙이기 (기본 20 + 옵션 12 = 32바이트)","ack 기다리기 — 안 오면 재전송"],
    xr:[{l:"지금 열린 연결 (ss)", code:"<span class='k'>$ ss -tn</span>\nState  Recv-Q  Send-Q   Local Address:Port    Peer Address:Port  Process\nESTAB  0       0            10.0.1.23:51514      10.0.2.10:80"},
        {l:"TCP 헤더의 주요 칸", code:"출발 포트 · 도착 포트        51514 → 80\n순서 번호 · 확인 번호        seq · ack\n플래그                       SYN · ACK · PSH · FIN\n창 크기                      win\n<span class='c'># '봉투에 넣는다' = 실제로는 편지 앞에 헤더 바이트를 붙이는 것</span>"}],
    myth:"스위치·라우터도 TCP 봉투를 연다? — 아니에요, TCP는 양 끝 컴퓨터에만 있어요. 중간 장비는 4층 봉투를 열지 않고 지나 보내요." },

  ip:{ name:"3층 네트워크", real:"IP (L3 네트워크 계층)",
    tip:"'어느 컴퓨터에서 어느 컴퓨터로'를 적고, 다른 동네면 길목으로 보내는 층이에요.",
    what:"<b>IP 주소</b>로 출발지와 최종 목적지 컴퓨터를 적어요. 목적지가 내 동네(서브넷)가 아니면 <b>라우팅 표</b>를 보고 길목(기본 게이트웨이)으로 보내요. TTL은 라우터를 지날 때마다 1씩 줄어 길 잃은 패킷이 영원히 떠도는 것을 막아요.",
    talks:[["맞은편 3층 (서버 IP)","IPv4 패킷","출발·도착 IP · TTL · 내용(TCP)"],["교차로 우체국 (라우터)","IPv4 패킷","도착 IP 를 보고 다음 길 고르기"],["아래 2층 (Ethernet)","ARP 표 조회","길목 10.0.1.1 의 MAC 묻기"]],
    steps:["도착 IP 10.0.2.10 확인","라우팅 표 조회 → 내 동네(10.0.1.0/24) 아님","기본 게이트웨이 10.0.1.1 로 결정","헤더 붙이기 (20바이트 · TTL 64)","2층에 '10.0.1.1 쪽으로' 넘기기"],
    xr:[{l:"어디로 보낼지 묻기", code:"<span class='k'>$ ip route get 10.0.2.10</span>\n10.0.2.10 via 10.0.1.1 dev eth0 src 10.0.1.23 uid 1000\n    cache"},
        {l:"내 주소", code:"<span class='k'>$ ip -4 -br addr show eth0</span>\neth0             UP             10.0.1.23/24\n<span class='c'># /24 — 앞 24비트(10.0.1)가 같으면 같은 동네</span>"}],
    myth:"IP 주소만 있으면 상대 컴퓨터로 바로 간다? — 다른 동네면 길목 라우터를 거쳐요. 그리고 실제로 선을 타는 건 늘 2층 봉투예요." },

  eth:{ name:"2층 데이터 링크", real:"Ethernet (L2 데이터 링크 계층)",
    tip:"같은 동네 안 '바로 옆 장비'까지만 가는 겉봉투를 씌우는 층이에요.",
    what:"<b>MAC 주소</b>로 같은 동네 안의 다음 장비를 가리켜요. 그래서 받는 MAC은 서버가 아니라 <b>길목 라우터</b>예요. 그 MAC은 ARP 표에서 찾아요. 한 구간짜리 봉투라 라우터를 지날 때마다 새로 씌워요.",
    talks:[["동네 분류소 (스위치)","Ethernet 프레임","받는·보내는 MAC · 내용(IP)"],["위 3층 (IP)","ARP","10.0.1.1 → 00:00:5e:00:53:01"]],
    steps:["다음 장비 IP 받기 (10.0.1.1)","ARP 표에서 MAC 찾기","헤더 붙이기 (받는 MAC · 보내는 MAC · EtherType = 14바이트)","끝에 오류 검사값 붙이기 (FCS 4바이트)","1층에 넘기기"],
    xr:[{l:"길목의 MAC (ARP 표)", code:"<span class='k'>$ ip neigh show 10.0.1.1</span>\n10.0.1.1 dev eth0 lladdr 00:00:5e:00:53:01 REACHABLE"},
        {l:"실제로 나간 프레임", code:DUMP_L + "\n<span class='c'># 받는 MAC 이 서버(…53:10)가 아니라 라우터(…53:01)</span>"}],
    myth:"MAC 주소로 인터넷 반대편까지 간다? — MAC은 한 구간용이에요. 라우터를 지날 때마다 받는·보내는 MAC이 바뀌고, 끝까지 그대로인 건 IP예요." },

  phy:{ name:"1층 물리", real:"PHY (L1 물리 계층)",
    tip:"봉투 전체를 0과 1의 전기·빛·전파 신호로 바꿔 선에 싣는 층이에요.",
    what:"랜카드와 케이블이 <b>비트를 신호로</b> 바꿔 보내요. 주소도 봉투도 모르고, 속도·케이블 종류·연결 여부만 신경 써요. 지도에서는 봉투가 날아가지만, 실제 선 위에는 비트의 흐름만 있어요.",
    talks:[["케이블 반대편 장비의 1층","전기 신호 (1000BASE-T)","비트"],["위 2층 (Ethernet)","랜카드 내부","프레임 ↔ 비트"]],
    steps:["프레임을 비트로 받기","앞에 동기 신호 붙이기 (프리앰블 8바이트)","전압 변화로 바꿔 케이블에 싣기","반대편이 신호를 비트로 되돌리기"],
    xr:[{l:"링크 상태", code:"<span class='k'>$ ethtool eth0</span>\nSettings for eth0:\n    Speed: 1000Mb/s\n    Duplex: Full\n    Port: Twisted Pair\n    Link detected: <span class='g'>yes</span>"}],
    myth:"Wi-Fi는 계층 이야기와 상관없다? — Wi-Fi도 1·2층이에요. 전파(1층)와 802.11 프레임(2층)을 쓸 뿐, 3층 위는 똑같아요." },

  sw:{ name:"동네 분류소", real:"Switch (L2 스위치)",
    tip:"같은 동네 안에서 겉봉투의 받는 MAC만 보고 맞는 출구로 넘겨요.",
    what:"스위치는 <b>2층 장비</b>예요. 들어온 프레임의 보내는 MAC으로 'MAC 표'를 스스로 배우고, 받는 MAC이 연결된 포트로만 내보내요. 표에 없는 MAC이면 모든 포트로 뿌려요(플러딩). IP·TCP 봉투는 열지 않아요.",
    talks:[["내 노트북","Ethernet 프레임","프레임 받기 (포트 Gi0/1)"],["교차로 우체국","Ethernet 프레임","프레임 내보내기 (포트 Gi0/3)"]],
    steps:["신호를 프레임으로 되돌리기","보내는 MAC …53:23 을 Gi0/1 로 기억","받는 MAC …53:01 을 MAC 표에서 찾기","Gi0/3 으로만 내보내기"],
    xr:[{l:"MAC 표", code:"<span class='k'>switch# show mac address-table</span>\n          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n   1    0000.5e00.5301    DYNAMIC     Gi0/3\n   1    0000.5e00.5323    DYNAMIC     Gi0/1\nTotal Mac Addresses for this criterion: 2"}],
    myth:"스위치가 IP 주소로 길을 찾는다? — 일반 스위치는 MAC만 봐요. IP로 길을 고르는 건 라우터예요." },

  router:{ name:"교차로 우체국", real:"Router (L3 라우터)",
    tip:"동네와 동네 사이 길목이에요. IP 봉투까지 열어 다음 길을 고르고 겉봉투를 새로 씌워요.",
    what:"라우터는 <b>3층 장비</b>예요. 겉봉투를 벗기고 <b>도착 IP</b>를 라우팅 표와 비교해 나갈 출구(eth1)를 골라요. TTL을 1 줄이고 그 출구 쪽 다음 장비의 MAC으로 새 겉봉투를 씌워요. 이 지도에선 바로 옆이 서버지만, 인터넷에선 라우터 여러 대를 거쳐요.",
    talks:[["1번 동네 쪽 (eth0 · 10.0.1.1)","Ethernet + IPv4","프레임 받기"],["2번 동네 쪽 (eth1 · 10.0.2.1)","Ethernet + IPv4","새 프레임 보내기"]],
    steps:["받는 MAC이 나(…53:01)인지 확인 → 겉봉투 벗기기","도착 IP 10.0.2.10 을 라우팅 표에서 찾기 → eth1","TTL 64 → 63 · IP 헤더 검사값 다시 계산","ARP 표에서 서버 MAC …53:10 찾기","새 겉봉투(…53:02 → …53:10)로 내보내기"],
    xr:[{l:"라우팅 표", code:"<span class='k'>router$ ip route</span>\n10.0.1.0/24 dev eth0 proto kernel scope link src 10.0.1.1\n10.0.2.0/24 dev eth1 proto kernel scope link src 10.0.2.1"},
        {l:"서버 MAC · 전달 기능", code:"<span class='k'>router$ ip neigh show dev eth1</span>\n10.0.2.10 lladdr 00:00:5e:00:53:10 REACHABLE\n<span class='k'>router$ sysctl net.ipv4.ip_forward</span>\nnet.ipv4.ip_forward = 1"}],
    myth:"집 공유기도 똑같다? — 공유기는 여기에 더해 출발 IP를 공인 IP로 바꿔요(NAT). 이 지도는 한 회사 안 두 동네라 NAT 없이 IP가 끝까지 그대로예요." },

  server:{ name:SHOP_NAME + " 서버", real:"nginx (웹 서버 프로그램)",
    tip:"봉투가 다 벗겨진 편지를 받아 페이지를 돌려주는 프로그램이에요.",
    what:"서버 컴퓨터의 각 층은 <b>자기 짝이 붙인 봉투만</b> 벗겨요. 2층은 라우터가 쓴 봉투를, 3·4층은 노트북이 쓴 봉투를 열어요. 포트 80에서 기다리던 nginx가 7층 편지를 읽고 200 응답을 같은 길로 돌려보내요.",
    talks:[["요청 프로그램 (curl)","HTTP (논리적인 짝)","GET / · 200 OK"],["4층 (서버 TCP)","소켓 API (accept · recv · send)","요청 바이트 · 응답 바이트"]],
    steps:["2층: 받는 MAC = 나 → 벗기기","3층: 도착 IP = 나 → 벗기기","4층: 도착 포트 80 → nginx 소켓으로","nginx: 요청 읽고 파일 찾기","200 OK 응답 쓰기 → 다시 아래층으로"],
    xr:[{l:"접근 기록", code:"<span class='k'>server$ tail -1 /var/log/nginx/access.log</span>\n10.0.1.23 - - [12/Oct/2026:10:21:07 +0900] \"GET / HTTP/1.1\" <span class='g'>200</span> 1534 \"-\" \"curl/8.5.0\""}],
    myth:"nginx가 받은 패킷을 통째로 본다? — nginx는 헤더가 다 벗겨진 바이트(HTTP 편지)만 받아요. MAC·IP·TCP 헤더는 운영체제가 처리해요." }
};

var REQUEST_BEATS = [
  { actor:"app",
    text:"DNS로 서버 주소를 알고 TCP 연결도 맺힌 상태에서 시작해요. 7층(응용)이 curl의 부탁으로 <b>HTTP 요청 편지</b>를 써요 — 내용만 쓰고, 배달은 아래층에 맡겨요.",
    xray:[{l:"7층이 쓴 편지 (78바이트)", code:REQ}] },
  { actor:"upper56",
    text:"편지가 6층(표현)·5층(세션)을 지나는데 아무 일도 없어요. http:// 라서예요 — 실제 인터넷엔 두 층이 따로 없고, https 라면 <b>TLS</b>가 여기쯤에서 봉인해요.",
    xray:[{l:"지나간 뒤에도 그대로", code:"<span class='c'># 7층이 넘긴 78바이트 = 4층이 받은 78바이트</span>\nGET / HTTP/1.1<span class='c'>\\r\\n</span>\n…"}] },
  { actor:"tcp",
    text:"4층(전송)이 편지를 <b>TCP 봉투</b>에 넣어요. '포트 80번 프로그램에게, 1~78번째 바이트'라고 적어 서버의 nginx에게 순서대로 닿게 해요.",
    xray:[{l:"TCP 부분 (tcpdump)", code:"10.0.1.23.51514 > 10.0.2.10.80: Flags [P.], seq 1:79, ack 1, win 502, options [nop,nop,TS val 3051624811 ecr 1923044210], length 78\n<span class='c'># seq 1:79 = 1번부터 78번 바이트까지 (끝 번호는 포함 안 함)</span>\n<span class='c'># TCP 헤더 32바이트 = 기본 20 + 옵션 12</span>"}] },
  { actor:"ip",
    text:"3층(네트워크)이 <b>IP 봉투</b>로 한 번 더 싸요. 최종 목적지 10.0.2.10 을 적고, 내 동네가 아니라서 길목 10.0.1.1 로 보내기로 정해요.",
    xray:[{l:"IP 헤더 (tcpdump -v)", code:"(tos 0x0, ttl 64, id 40211, offset 0, flags [DF], proto TCP (6), length 130)\n10.0.1.23.51514 > 10.0.2.10.80: …\n<span class='c'># length 130 = IP 헤더 20 + TCP 32 + HTTP 78</span>"},
          {l:"길 고르기", code:"<span class='k'>$ ip route get 10.0.2.10</span>\n10.0.2.10 via 10.0.1.1 dev eth0 src 10.0.1.23 uid 1000\n    cache"}] },
  { actor:"eth",
    text:"2층(데이터 링크)이 <b>Ethernet 겉봉투</b>를 씌워요. 받는 쪽은 서버가 아니라 바로 옆 길목 라우터의 MAC이에요 — 이 봉투는 한 구간짜리예요.",
    xray:[{l:"겉봉투에 적힌 것", code:"<span class='k'>$ ip neigh show 10.0.1.1</span>\n10.0.1.1 dev eth0 lladdr 00:00:5e:00:53:01 REACHABLE\n\n받는 MAC   00:00:5e:00:53:01   6바이트\n보내는 MAC 00:00:5e:00:53:23   6바이트\nEtherType  0x0800 (IPv4)       2바이트"},
          {l:"실제 바이트 순서 — 봉투가 아니라 한 줄", code:"[Ethernet 14][IP 20][TCP 32][HTTP 78][FCS 4]\n<span class='c'># 프레임 144바이트 (tcpdump 의 length 144) + FCS 4</span>"}] },
  { actor:"phy",
    text:"1층(물리)이 봉투 전체를 <b>0과 1의 전기 신호</b>로 바꿔 케이블에 실어요. 지도에선 봉투가 날아가지만, 실제 선 위에는 비트의 흐름만 있어요.",
    xray:[{l:"선 위에 실린 양", code:"(프리앰블 8 + 프레임 144 + FCS 4) × 8 = 1248비트\n1000Mb/s 에서 약 1.25 마이크로초\n<span class='c'># 이 다음 장면부터는 다시 봉투 모양으로 그려요</span>"}] },
  { actor:"sw",
    text:"동네 분류소(스위치)가 신호를 프레임으로 되돌려 <b>겉봉투의 받는 MAC</b>만 읽어요. MAC 표를 보고 라우터가 꽂힌 Gi0/3 으로만 넘기고, 안쪽 봉투는 열지 않아요.",
    xray:[{l:"분류소가 본 MAC 표", code:"<span class='k'>switch# show mac address-table</span>\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n   1    0000.5e00.5301    DYNAMIC     Gi0/3   <span class='c'>← 받는 MAC</span>\n   1    0000.5e00.5323    DYNAMIC     Gi0/1   <span class='c'>← 보낸 노트북</span>\nTotal Mac Addresses for this criterion: 2"}] },
  { actor:"router",
    text:"교차로 우체국(라우터)이 겉봉투를 버리고 <b>IP 봉투의 도착 주소</b>를 읽어 2번 동네 쪽 길을 골라요. TTL을 1 줄이고, 서버 MAC을 적은 새 겉봉투로 다시 싸서 보내요.",
    xray:[{l:"라우터 양쪽에서 본 같은 패킷", code:"<span class='k'>router$ sudo tcpdump -i eth0 -n -e -v 'tcp port 80'</span>\n… 00:00:5e:00:53:23 > 00:00:5e:00:53:01, ethertype IPv4 (0x0800), length 144: (tos 0x0, ttl 64, id 40211, …)\n    10.0.1.23.51514 > 10.0.2.10.80: …\n<span class='k'>router$ sudo tcpdump -i eth1 -n -e -v 'tcp port 80'</span>\n… 00:00:5e:00:53:02 > 00:00:5e:00:53:10, ethertype IPv4 (0x0800), length 144: (tos 0x0, ttl 63, id 40211, …)\n    10.0.1.23.51514 > 10.0.2.10.80: …\n<span class='c'># 바뀐 것: MAC 두 개 · ttl / 그대로: IP · 포트 · 내용</span>"}] },
  { actor:"server",
    text:"서버 빌딩은 아래층부터 <b>자기 짝이 붙인 봉투만</b> 벗겨요. 2층 봉투의 짝은 바로 옆 라우터, 3·4·7층의 짝은 노트북 — 같은 층끼리 대화하는 것처럼 보이는 이유예요.",
    xray:[{l:"서버에 도착한 패킷", code:"<span class='k'>server$ sudo tcpdump -i eth0 -n -e -v 'tcp port 80'</span>\n10:21:07.413201 00:00:5e:00:53:02 > 00:00:5e:00:53:10, ethertype IPv4 (0x0800), length 144: (tos 0x0, ttl 63, id 40211, offset 0, flags [DF], proto TCP (6), length 130)\n    10.0.1.23.51514 > 10.0.2.10.80: Flags [P.], …, seq 1:79, ack 1, win 502, …, length 78: HTTP, length: 78\n\tGET / HTTP/1.1\n\t…"},
          {l:"nginx 가 돌려준 답", code:"HTTP/1.1 <span class='g'>200 OK</span>\nServer: nginx\nContent-Type: text/html\nContent-Length: 1534\n<span class='c'># 응답도 4·3·2·1층을 거쳐 같은 길을 거꾸로 가요</span>"}] }
];

var TOUR_BEATS = [
  { actor:"app",
    text:"편지 없이 빈 빌딩을 7층부터 둘러봐요. 7층에서 알아야 할 건 <b>요청·응답의 형식</b>(메서드, 상태 코드, 헤더)과 이름을 IP로 바꾸는 DNS예요 — 배달 방법은 전혀 몰라요.",
    xray:[{l:"응답 머리말만 받아 보기", code:"<span class='k'>$ curl -sI http://my-shop.example/</span>\nHTTP/1.1 <span class='g'>200 OK</span>\nServer: nginx\nContent-Type: text/html\nContent-Length: 1534\n…"},
          {l:"이름 → IP (DNS)", code:"<span class='k'>$ dig +short my-shop.example</span>\n10.0.2.10"}] },
  { actor:"upper56",
    text:"6·5층은 거의 빈방이에요. OSI가 맡긴 일(암호화·압축·대화 관리)을 실제로는 <b>TLS와 앱</b>이 나눠 맡아서, TCP/IP 모델은 이 두 층을 7층에 합쳐요.",
    xray:[{l:"암호화는 TLS가 (https 로 연다고 가정)", code:"<span class='k'>$ openssl s_client -connect my-shop.example:443 -brief &lt;/dev/null</span>\nCONNECTION ESTABLISHED\nProtocol version: TLSv1.3\n…"},
          {l:"압축은 HTTP 헤더로 합의", code:"Accept-Encoding: gzip    <span class='c'>← 요청: 압축된 답도 읽을 수 있어요</span>\nContent-Encoding: gzip   <span class='c'>← 응답: 압축해서 보냈어요</span>"}] },
  { actor:"tcp",
    text:"4층의 핵심은 <b>포트</b>(어느 프로그램인지)와 믿고 보내는 장치(순서 번호·확인·재전송·창 크기)예요. 이런 보장이 필요 없으면 옆 창구 UDP를 써요.",
    xray:[{l:"서버에서 80번 우편함을 연 프로그램", code:"<span class='k'>server$ ss -tln</span>\nState   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process\nLISTEN  0       511           0.0.0.0:80         0.0.0.0:*"},
          {l:"임시 포트를 고르는 범위", code:"<span class='k'>$ sysctl net.ipv4.ip_local_port_range</span>\nnet.ipv4.ip_local_port_range = 32768    60999\n<span class='c'># 51514 는 이 범위에서 고른 값</span>"}] },
  { actor:"ip",
    text:"3층에선 <b>주소와 길</b>을 알아야 해요 — IP와 서브넷(/24), 라우팅 표와 기본 게이트웨이, 그리고 길을 확인하는 ICMP(ping·traceroute)예요.",
    xray:[{l:"닿는지 확인 (ICMP)", code:"<span class='k'>$ ping -c 1 10.0.2.10</span>\nPING 10.0.2.10 (10.0.2.10) 56(84) bytes of data.\n64 bytes from 10.0.2.10: icmp_seq=1 ttl=63 time=0.412 ms\n<span class='c'># ttl=63 — 서버가 64로 보냈고 라우터 하나를 지났어요</span>"},
          {l:"거쳐 가는 길", code:"<span class='k'>$ traceroute -n 10.0.2.10</span>\ntraceroute to 10.0.2.10 (10.0.2.10), 30 hops max, 60 byte packets\n 1  10.0.1.1  0.311 ms  0.287 ms  0.270 ms\n 2  10.0.2.10  0.402 ms  0.398 ms  0.391 ms"}] },
  { actor:"eth",
    text:"2층은 <b>같은 동네 안 배달</b>만 알아요. MAC 주소, 그 MAC을 묻는 ARP 방송, 스위치가 MAC을 배우는 방식, 한 스위치를 여러 동네로 나누는 VLAN이 핵심이에요.",
    xray:[{l:"ARP — 동네 전체에 묻고 한 명이 답해요", code:"<span class='k'>$ sudo tcpdump -i eth0 -n -e arp</span>\n10:20:59.101772 00:00:5e:00:53:23 > ff:ff:ff:ff:ff:ff, ethertype ARP (0x0806), length 42: Request who-has 10.0.1.1 tell 10.0.1.23, length 28\n10:20:59.102030 00:00:5e:00:53:01 > 00:00:5e:00:53:23, ethertype ARP (0x0806), length 60: Reply 10.0.1.1 is-at 00:00:5e:00:53:01, length 46\n<span class='c'># ff:ff:ff:ff:ff:ff = 동네 전체(브로드캐스트)</span>"}] },
  { actor:"phy",
    text:"1층은 <b>신호와 선</b>만 다뤄요. 아래층일수록 아는 게 적어서 1층은 주소도 모르지만, 덕분에 유선을 Wi-Fi로 바꿔도 위층들은 그대로 일해요.",
    xray:[{l:"선이 살아 있는지", code:"<span class='k'>$ ip link show eth0</span>\n2: eth0: &lt;BROADCAST,MULTICAST,UP,LOWER_UP&gt; mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000\n    link/ether 00:00:5e:00:53:23 brd ff:ff:ff:ff:ff:ff\n<span class='c'># LOWER_UP = 1층 신호가 잡힘 · mtu 1500 = 프레임 하나에 싣는 최대 크기</span>"}] }
];

var HS = "<span class='k'>$ sudo tcpdump -i eth0 -n 'tcp port 80'</span>\n";
var HANDSHAKE_BEATS = [
  { actor:"tcp",
    text:"아직 연결이 없는 상태에서 시작해요(DNS·ARP는 끝남). 노트북 4층이 <b>SYN</b>으로 '연결하자'며 시작 번호를 보내요 — 지도엔 4층끼리만 그렸지만 실제로는 아래층과 라우터를 거쳐요.",
    xray:[{l:"나간 SYN", code:HS + "10:21:07.410102 IP 10.0.1.23.51514 > 10.0.2.10.80: Flags [S], seq 3172449120, win 64240, options [mss 1460,sackOK,TS val 3051624810 ecr 0,nop,wscale 7], length 0"},
          {l:"노트북 4층의 상태", code:"<span class='k'>$ ss -tan</span>\nState     Recv-Q  Send-Q  Local Address:Port   Peer Address:Port\nSYN-SENT  0       1           10.0.1.23:51514     10.0.2.10:80"}] },
  { actor:"tcp",
    text:"80번에서 기다리던(LISTEN) 서버 4층이 <b>SYN-ACK</b>로 답해요. '네 번호 +1 까지 받았어'(ack)와 자기 시작 번호(seq)를 한 봉투에 담아요.",
    xray:[{l:"돌아온 SYN-ACK", code:HS + "10:21:07.410519 IP 10.0.2.10.80 > 10.0.1.23.51514: Flags [S.], seq 2841067534, ack 3172449121, win 65160, options [mss 1460,sackOK,TS val 1923044210 ecr 3051624810,nop,wscale 7], length 0"},
          {l:"서버 4층의 상태", code:"<span class='k'>server$ ss -tan</span>\nState     Recv-Q  Send-Q  Local Address:Port   Peer Address:Port\nLISTEN    0       511           0.0.0.0:80          0.0.0.0:*\nSYN-RECV  0       0           10.0.2.10:80      10.0.1.23:51514\n<span class='c'># ss 는 SYN-RECEIVED 를 SYN-RECV 로 줄여 써요</span>"}] },
  { actor:"tcp",
    text:"노트북 4층이 <b>ACK</b>로 '네 번호도 받았어'라고 답하면 양쪽이 ESTABLISHED가 돼요. 세 번 주고받아 서로의 시작 번호를 확인한 거예요.",
    xray:[{l:"마지막 ACK", code:HS + "10:21:07.410561 IP 10.0.1.23.51514 > 10.0.2.10.80: Flags [.], ack 1, win 502, options [nop,nop,TS val 3051624811 ecr 1923044210], length 0\n<span class='c'># 여기부터 tcpdump 는 상대 번호로 보여 줘요 (ack 1 = 2841067535)</span>"}] },
  { actor:"tcp",
    text:"연결은 전용 선이 아니라 <b>양쪽 4층이 가진 기록</b>(주소·포트·다음 번호)이에요. 분류소와 우체국은 이 연결을 모른 채 봉투만 넘기고, 이제 '웹 페이지 요청 한 번'의 GET이 나갈 수 있어요.",
    xray:[{l:"양쪽의 기록", code:"<span class='k'>$ ss -tn</span>\nState  Recv-Q  Send-Q  Local Address:Port   Peer Address:Port\nESTAB  0       0           10.0.1.23:51514     10.0.2.10:80\n<span class='k'>server$ ss -tn</span>\nState  Recv-Q  Send-Q  Local Address:Port   Peer Address:Port\nESTAB  0       0           10.0.2.10:80      10.0.1.23:51514"}] }
];

var ARP_BEATS = [
  { actor:"ip",
    text:"노트북이 막 동네에 들어와 ARP 표가 빈 상태에서 시작해요. 3층이 '길목 10.0.1.1로'라고 정했는데, 2층은 그 주소의 <b>MAC</b>을 몰라 겉봉투를 쓸 수 없어요.",
    xray:[{l:"길목은 알지만 MAC은 모름", code:"<span class='k'>$ ip route get 10.0.2.10</span>\n10.0.2.10 via 10.0.1.1 dev eth0 src 10.0.1.23 uid 1000\n    cache\n<span class='k'>$ ip neigh show 10.0.1.1</span>\n<span class='c'># (아무것도 안 나와요 — ARP 표에 없음)</span>"}] },
  { actor:"eth",
    text:"2층이 <b>ARP 요청</b>을 만들어 받는 칸에 ff:ff:ff:ff:ff:ff(동네 전체)를 적어요. 누구 MAC인지 모르니 모두에게 '10.0.1.1 누구야?'라고 묻는 거예요.",
    xray:[{l:"나간 ARP 요청", code:"<span class='k'>$ sudo tcpdump -i eth0 -n -e arp</span>\n10:20:59.101772 00:00:5e:00:53:23 > ff:ff:ff:ff:ff:ff, ethertype ARP (0x0806), length 42: Request who-has 10.0.1.1 tell 10.0.1.23, length 28"}] },
  { actor:"sw",
    text:"분류소는 받는 칸이 '전체'인 겉봉투를 들어온 곳만 빼고 <b>모든 출구로 복사</b>해요. 옆자리 PC는 자기 주소가 아니라 버리고, 분류소는 …53:23이 Gi0/1에 있다고 배워요.",
    xray:[{l:"분류소가 배운 것", code:"<span class='k'>switch# show mac address-table</span>\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n   1    0000.5e00.5323    DYNAMIC     Gi0/1\nTotal Mac Addresses for this criterion: 1\n<span class='c'># 옆자리 PC(Gi0/2)는 받기만 하고 보낸 게 없어 표에 없어요</span>"}] },
  { actor:"router",
    text:"교차로 우체국이 '10.0.1.1은 나'라며 <b>ARP 응답</b>을 노트북에게만 보내요. 받는 MAC이 정확히 적혀 있어 분류소도 Gi0/1로만 넘기고, 이때 …53:01이 Gi0/3에 있다는 것도 배워요.",
    xray:[{l:"돌아온 ARP 응답", code:"<span class='k'>$ sudo tcpdump -i eth0 -n -e arp</span>\n10:20:59.101772 00:00:5e:00:53:23 > ff:ff:ff:ff:ff:ff, ethertype ARP (0x0806), length 42: Request who-has 10.0.1.1 tell 10.0.1.23, length 28\n10:20:59.102030 00:00:5e:00:53:01 > 00:00:5e:00:53:23, ethertype ARP (0x0806), length 60: Reply 10.0.1.1 is-at 00:00:5e:00:53:01, length 46\n<span class='c'># 응답 길이 60 — 최소 크기에 맞춰 빈칸을 채웠어요</span>"}] },
  { actor:"eth",
    text:"2층이 ARP 표에 '10.0.1.1 → …53:01'을 적어 이제 겉봉투를 쓸 수 있어요. ARP는 <b>같은 동네 안에서만</b> 묻기 때문에, 서버의 MAC은 노트북이 끝까지 몰라요.",
    xray:[{l:"채워진 ARP 표", code:"<span class='k'>$ ip neigh show 10.0.1.1</span>\n10.0.1.1 dev eth0 lladdr 00:00:5e:00:53:01 REACHABLE\n<span class='c'># 서버 MAC(…53:10)은 라우터가 2번 동네에서 따로 물어요</span>"}] }
];

var TLS_BEATS = [
  { actor:"upper56",
    text:"443번으로 TCP 연결이 맺힌 상태에서 시작해요(맺는 법은 '연결 맺기'와 같아요). 6·5층 자리의 <b>TLS</b>가 ClientHello로 암호 방식과 열쇠 재료를 보내요.",
    xray:[{l:"ClientHello 의 이름은 길에서 보여요", code:"<span class='k'>$ sudo tshark -i eth0 -Y 'tls.handshake.type == 1' -T fields -e ip.dst -e tls.handshake.extensions_server_name</span>\n10.0.2.10    my-shop.example"}] },
  { actor:"upper56",
    text:"서버 TLS가 <b>ServerHello</b>로 방식을 정하고 열쇠 재료를 돌려줘요. 이제 양쪽이 같은 비밀 키를 계산할 수 있어서, 뒤따르는 인증서부터는 이미 암호화돼 있어요.",
    xray:[{l:"주고받은 순서 (curl -v)", code:"<span class='k'>$ curl -v https://my-shop.example/</span>\n* TLSv1.3 (OUT), TLS handshake, Client hello (1):\n* TLSv1.3 (IN), TLS handshake, Server hello (2):\n* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):\n* TLSv1.3 (IN), TLS handshake, Certificate (11):\n* TLSv1.3 (IN), TLS handshake, CERT verify (15):\n* TLSv1.3 (IN), TLS handshake, Finished (20):\n* TLSv1.3 (OUT), TLS handshake, Finished (20):"}] },
  { actor:"upper56",
    text:"노트북 TLS가 <b>인증서</b>를 확인해요 — 이름이 맞는지, 믿는 인증기관이 서명했는지. 통과하면 Finished를 주고받고 양쪽 6·5층에 같은 자물쇠가 생겨요.",
    xray:[{l:"확인한 인증서", code:"* Server certificate:\n*  subject: CN=my-shop.example\n*  start date: …\n*  expire date: …\n*  subjectAltName: host \"my-shop.example\" matched cert's \"my-shop.example\"\n*  issuer: C=US; O=Example CA; CN=Example CA R1\n*  SSL certificate verify <span class='g'>ok</span>.\n<span class='c'># Example CA 는 문서용 가짜 인증기관 이름</span>"}] },
  { actor:"upper56",
    text:"7층이 쓴 GET 편지가 6·5층에서 <b>TLS 봉인 상자</b>에 들어가요. 경로·헤더·쿠키까지 모두 상자 안이라, 이제 4층 아래는 내용을 모르고 상자만 나르게 돼요.",
    xray:[{l:"봉인된 편지의 첫 5바이트", code:"17 03 03 ?? ??   <span class='c'># 종류 17(응용 데이터) · 버전 03 03 · 길이 2바이트</span>\n…               <span class='c'># 그 뒤는 전부 암호문 (GET / … 이 이 안에)</span>"}] },
  { actor:"router",
    text:"봉인 상자도 TCP·IP·Ethernet 봉투를 똑같이 쓰고 길을 떠나요. 그래서 길 위에선 <b>주소·포트·SNI 이름</b>은 보이지만 경로와 내용은 보이지 않아요.",
    xray:[{l:"라우터에서 본 HTTPS 패킷", code:"<span class='k'>router$ sudo tcpdump -i eth0 -n 'tcp port 443'</span>\n10:22:15.203118 IP 10.0.1.23.51522 > 10.0.2.10.443: Flags [P.], seq …, ack …, win 502, options […], length …\n<span class='c'># 주소·포트·길이는 보여요 — HTTP: GET 줄이 없어요</span>"}] },
  { actor:"server",
    text:"서버는 아래층부터 봉투를 벗기고 6·5층에서 <b>봉인을 풀어</b> nginx에게 넘겨요. TLS는 4층 위에서 봉인하므로, 아래층 봉투(IP·포트·MAC)는 길 위에서 늘 보여요.",
    xray:[{l:"nginx 는 평소처럼 기록", code:"<span class='k'>server$ tail -1 /var/log/nginx/access.log</span>\n10.0.1.23 - - [12/Oct/2026:10:22:15 +0900] \"GET / HTTP/1.1\" <span class='g'>200</span> 1534 \"-\" \"curl/8.5.0\"\n<span class='c'># 봉인은 TLS 가 풀어 줬어요 — nginx 는 평범한 HTTP 편지를 받아요</span>"}] }
];

window.CONTENT = {
  meta:{
    concepts:["osi", "tcp-ip", "http", "tcp", "udp", "ip", "ethernet", "arp", "tls"],
    guest:"client",
    values:["shop-web"],
    hubColor:"#e07a5f",
    doors:[]
  },
  title:"층층 우체국 빌딩",
  subtitle:"네트워크 계층: 편지 한 장이 봉투를 겹겹이 쓰고 벗기기까지",
  logo:"🏢",
  intro:{
    title:"컴퓨터마다 7층 빌딩이 있어요",
    body:"편지는 <b>위층에서 아래층으로</b> 내려가며 층마다 봉투를 하나씩 더 쓰고, 도로를 건너, 맞은편 빌딩에서 <b>아래층부터 한 겹씩</b> 벗겨져요.<br>왼쪽은 OSI 7계층, 오른쪽은 실무에서 쓰는 TCP/IP 4계층 이름이에요. 왼쪽 아래 버튼으로 사건을 일으켜 보세요.",
    sub:"층·장비·사람을 누르면 그 층이 하는 일과 실제 명령 출력을 볼 수 있어요."
  },
  actors:ACTORS,
  events:[
    {id:"request", kind:"normal", icon:"✉️", title:"웹 페이지 요청 한 번", sub:"편지 한 장이 7층을 내려가 서버까지", beats:REQUEST_BEATS},
    {id:"tour", kind:"tour", icon:"🔍", title:"빌딩 안 둘러보기", sub:"층마다 들어가 알아야 할 것 보기", beats:TOUR_BEATS},
    {id:"handshake", kind:"normal", icon:"🤝", title:"TCP 연결 맺기", sub:"SYN · SYN-ACK · ACK 세 번 주고받기", beats:HANDSHAKE_BEATS},
    {id:"arp", kind:"normal", icon:"📣", title:"옆 장비 MAC 찾기", sub:"ARP로 동네 전체에 묻고 답 받기", beats:ARP_BEATS},
    {id:"tls", kind:"normal", icon:"🔒", title:"HTTPS로 봉인하기", sub:"TLS가 6·5층 자리에서 편지를 봉인", beats:TLS_BEATS}
  ],
  names:{
    examples:{o:"TCP", c:"my-shop.example", a:"00:00:5e:00:53:23"},
    official:["HTTP","HTTPS","HTTP/1.1","GET","Host","User-Agent","Accept","Server","Content-Type","Content-Length","Content-Encoding","UTF-8",
      "TLS","TLSv1.3","TCP","UDP","IP","IPv4","Ethernet","MAC","ARP","TTL","ttl","seq","ack","SYN","ACK","PSH","FIN","ESTAB","REACHABLE",
      "EtherType","ethertype","FCS","DHCP","DNS","NAT","OSI","SSH","SMTP","DYNAMIC","1000BASE-T","802.11","200 OK","connect","send","recv","accept",
      "net.ipv4.ip_forward","access.log","Vlan",
      "ICMP","MTU","VLAN","LISTEN","LOWER_UP","ff:ff:ff:ff:ff:ff","icmp_seq","who-has","is-at","gzip","Accept-Encoding",
      "net.ipv4.ip_local_port_range",
      "SYN-SENT","SYN-RECEIVED","SYN-RECV","ESTABLISHED","CLOSED","ClientHello","ServerHello","SNI","key_share","Finished",
      "mss","sackOK","wscale","tls.handshake.extensions_server_name","tls.handshake.type","ip.dst"],
    projects:["curl","nginx","tcpdump","ethtool","openssl","dig","ping","traceroute","tshark"],
    custom:{"my-shop.example":"chost", "my-shop":"c", "10.0.2.10":"csrv", "10.0.1.1":"cgw", "10.0.2.1":"cgw",
      "10.0.1.0/24":"cnet", "10.0.2.0/24":"cnet", "Example CA R1":"cca", "Example CA":"cca"},
    auto:{"10.0.1.23":"adhcp", "51514":"aport", "eth0":"aif", "eth1":"aif", "Gi0/1":"aswport", "Gi0/3":"aswport",
      "3051624811":"ats", "3051624810":"ats", "1923044210":"ats", "40211":"aid", "51522":"aport", "Gi0/2":"aswport",
      "3172449120":"aseq", "3172449121":"aseq", "2841067534":"aseq", "2841067535":"aseq"},
    patterns:[
      {re:"10\\.0\\.1\\.23\\.51514", parts:function(m){ return [["a","adhcp","10.0.1.23"], ["a","aport",".51514"]]; }},
      {re:"10\\.0\\.1\\.23\\.51522", parts:function(m){ return [["a","adhcp","10.0.1.23"], ["a","aport",".51522"]]; }},
      {re:"10\\.0\\.2\\.10\\.443", parts:function(m){ return [["c","csrv","10.0.2.10"], ["o","port443",".443"]]; }},
      {re:"10\\.0\\.2\\.10\\.80", parts:function(m){ return [["c","csrv","10.0.2.10"], ["o","port80",".80"]]; }},
      {re:"10\\.0\\.1\\.23/24", parts:function(m){ return [["a","adhcp","10.0.1.23"], ["c","cnet","/24"]]; }},
      {re:"00:00:5e:00:53:[0-9a-f]{2}", parts:function(m){ return [["a","amac",m]]; }},
      {re:"0000\\.5e00\\.53[0-9a-f]{2}", parts:function(m){ return [["a","amac",m]]; }},
      {re:"53:(?:01|02|10|23)", parts:function(m){ return [["a","amac",m]]; }}
    ],
    messages:{
      chost:"<b>직접 지은 이름</b> · 서버 주인이 정해 DNS에 등록한 이름이에요. example 은 문서용으로 비워 둔 도메인이에요.",
      csrv:"<b>관리자가 정한 값</b> · 서버에 고정으로 설정한 IP예요. 바꾸면 DNS 기록도 같이 바꿔야 해요.",
      cgw:"<b>관리자가 정한 값</b> · 라우터 쪽 주소(기본 게이트웨이)로 정한 IP예요. 동네의 .1 을 많이 써요.",
      cnet:"<b>관리자가 정한 값</b> · 동네(서브넷)의 범위예요. /24 는 앞 24비트가 같으면 같은 동네라는 뜻이에요.",
      adhcp:"<b>자동 배정</b> · 노트북이 동네에 들어올 때 DHCP 서버가 골라 준 IP예요. 다시 접속하면 바뀔 수 있어요.",
      aport:"<b>자동 생성</b> · 운영체제가 연결마다 고르는 임시 포트예요. Linux는 보통 32768~60999 사이에서 골라요.",
      port80:"<b>공식 번호</b> · HTTP의 잘 알려진 포트예요. 웹 서버는 보통 80번에서 기다려요.",
      amac:"<b>자동 · 제조사가 정함</b> · 랜카드에 새겨진 MAC 주소예요. 여기서는 문서용으로 비워 둔 00:00:5e:00:53:xx 대역을 썼어요.",
      aif:"<b>자동 생성</b> · 운영체제가 붙인 네트워크 인터페이스 이름이에요. 배포판에 따라 다른 형식의 이름이 붙기도 해요.",
      aswport:"<b>장비가 정한 이름</b> · 스위치의 몇 번째 기가비트 포트인지 나타내요. 케이블을 꽂은 자리가 정해요.",
      ats:"<b>자동 생성</b> · TCP 타임스탬프 값이에요. 왕복 시간을 재는 데 쓰고 패킷마다 바뀌어요.",
      aseq:"<b>자동 생성</b> · 연결마다 운영체제가 무작위로 고르는 시작 번호(ISN)예요. 남이 끼어들기 어렵게 매번 달라요.",
      cca:"<b>골라서 적은 이름</b> · 서버 주인이 인증서를 받은 인증기관이에요. 여기서는 문서용 가짜 이름을 썼어요.",
      port443:"<b>공식 번호</b> · HTTPS의 잘 알려진 포트예요.",
      aid:"<b>자동 생성</b> · IP 패킷 번호(id)예요. 운영체제가 붙이고 라우터는 바꾸지 않아요."
    }
  }
};
})();
