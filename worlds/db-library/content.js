/* 데이터베이스 도서관 — 겹 1(말풍선·자막) · 겹 2(패널) · 겹 3(실제로는?) · 이름 규칙
   실제 예시는 PostgreSQL 16 기준. 예시 데이터: my_pay DB · wallets 표 · mina / joon 두 줄 */
(function(){
"use strict";

var PAY = window.SHARED.shops["pay-app"];
var GUEST = window.SHARED.guests["guest-app"];
var APP_NAME = PAY.appName;
var DB_HOST = PAY.dbHost;
var DB_USER = PAY.dbUser;


var ACTORS = {
  client:{ name:GUEST.name, real:GUEST.real,
    tip:"데이터가 필요한 앱이에요. SQL 신청서를 들고 정문으로 와요.",
    what:`손님은 우리 앱(${APP_NAME})이에요. DB 파일을 직접 열지 않고 <b>연결을 맺은 뒤 SQL 문장</b>을 보내 결과만 받아요. 무엇을 원하는지만 말하고(선언형), 어떻게 찾을지는 DB가 정해요.`,
    talks:[["정문 안내원","TCP 5432 · PostgreSQL 프로토콜","연결 요청 · 인증"],["전담 사서","같은 연결 위 SQL 메시지","SQL 보내기 · 결과 행 받기"]],
    steps:["주소로 접속 (host · port · DB 이름)","인증 (사용자 · 비밀번호)","SQL 문장 보내기","결과 행 받기","여러 문장을 BEGIN … COMMIT 으로 묶기"],
    xr:[{l:"연결 주소", code:`postgresql://${DB_USER}@${DB_HOST}:5432/${PAY.db}   <span class='c'># ← 사용자·DB 이름은 직접 지은 이름</span>`},
        {l:"psql 로 같은 일 해 보기", code:`<span class='k'>$ psql -h ${DB_HOST} -U ${DB_USER} ${PAY.db}</span>\n${PAY.db}=> SELECT balance FROM ${PAY.table} WHERE owner = '${GUEST.users[0]}';\n balance\n---------\n   50000\n(1 row)`}],
    myth:"앱이 DB 파일을 직접 읽는다? — 아니에요. 늘 연결로 SQL을 보내고, 파일은 DB 서버만 만져요." },

  gate:{ name:"정문 안내원", real:"postmaster",
    tip:"5432번 문을 지키다가, 손님이 오면 그 손님만 맡을 사서를 붙여 줘요.",
    what:"PostgreSQL 서버의 첫 프로세스(postmaster)예요. 5432 포트에서 <b>연결을 기다리다가</b>, 연결이 오면 그 연결만 맡을 프로세스(backend)를 <b>fork</b>로 하나 만들어 넘겨요. 비정상 종료 뒤에는 복구를 먼저 시키고 나서야 문을 열어요.",
    talks:[["손님","TCP 5432","연결 받기"],["전담 사서","fork()","연결 하나당 프로세스 하나"],["복구 담당","프로세스 시작","재시작 때 복구 맡기기"]],
    steps:["5432 포트에서 대기 (listen)","연결 받기 (accept)","전담 프로세스 만들기 (fork)","인증은 새 프로세스가 pg_hba.conf 규칙으로","재시작 중이면 복구가 끝날 때까지 새 연결 거절"],
    xr:[{l:"프로세스 목록", code:`<span class='k'>$ ps -ef | grep postgres</span>\npostgres  1201     1 … postgres -D /var/lib/postgresql/16/main …\npostgres  1205  1201 … postgres: checkpointer\npostgres  1208  1201 … postgres: walwriter\npostgres 41822  1201 … postgres: ${DB_USER} ${PAY.db} 10.0.0.5(52344) idle`},
        {l:"복구 중에 연결하면", code:"FATAL:  the database system is starting up"}],
    myth:"프로세스 하나가 모든 손님을 돌본다? — 연결마다 프로세스를 하나씩 만들어요. 그래서 연결이 아주 많으면 커넥션 풀을 써요." },

  backend:{ name:"전담 사서", real:"backend process",
    tip:"손님 한 명만 맡아 신청서를 검사하고, 길을 고르고, 직접 찾아 와요.",
    what:"연결 하나를 맡는 프로세스예요. 받은 SQL을 <b>검사(parse) → 길 고르기(plan) → 실행(execute)</b> 순서로 처리해요. 지도에서는 사서가 데스크 사이를 걷지만, <b>실제로는 한 프로세스 안에서 단계가 차례로 불리는 것</b>이에요.",
    talks:[["손님","같은 TCP 연결","SQL 받기 · 결과 보내기"],["열람 책상","공유 메모리","페이지 찾기 · 읽기 · 고치기"],["일지 바구니","공유 메모리","변경 기록 넣기 · COMMIT 때 디스크로"]],
    steps:["SQL 받기","문장 검사 (parser · analyzer)","실행 계획 만들기 (planner)","계획대로 실행 (executor)","페이지는 버퍼에서 찾고, 없으면 디스크에서 읽기","결과 행 돌려주기"],
    xr:[{l:"지금 무엇을 하나", code:`<span class='k'>${PAY.db}=> SELECT pid, state, query</span>\n<span class='k'>${PAY.db}-> FROM pg_stat_activity</span>\n<span class='k'>${PAY.db}-> WHERE datname = '${PAY.db}';</span>\n  pid  | state  | query\n-------+--------+--------------------------------------\n 41822 | active | SELECT pid, state, query FROM pg_stat_activity …`}],
    myth:"SQL을 보내면 바로 디스크를 뒤진다? — 검사와 계획을 먼저 거치고, 디스크보다 메모리(버퍼)를 먼저 봐요." },

  parser:{ name:"문장 검사 데스크", real:"parser · analyzer",
    tip:"SQL 문장이 문법에 맞는지, 말한 표와 열이 정말 있는지 확인해요.",
    what:"SQL 글자를 읽어 <b>문법 트리</b>로 바꾸고(parser), 시스템 카탈로그를 보며 <b>표·열·타입이 실제로 있는지</b> 확인해(analyzer) 쿼리 트리로 만들어요. 여기서 틀리면 실행 전에 바로 오류가 나요.",
    talks:[["전담 사서","함수 호출 (같은 프로세스)","SQL 글자 → 쿼리 트리"],["시스템 카탈로그","pg_class · pg_attribute 조회","표·열 이름 확인"]],
    steps:["글자를 단어로 쪼개기","문법 규칙으로 트리 만들기 (parser)","이름·타입 확인 (analyzer)","뷰·규칙 펼치기 (rewriter)","쿼리 트리를 planner에 넘기기"],
    xr:[{l:"문법 오류", code:`${PAY.db}=> SELEC balance FROM ${PAY.table};\nERROR:  syntax error at or near "SELEC"\nLINE 1: SELEC balance FROM ${PAY.table};\n        ^`},
        {l:"없는 표 이름", code:`${PAY.db}=> SELECT balance FROM wallet;\nERROR:  relation "wallet" does not exist\nLINE 1: SELECT balance FROM wallet;\n                            ^`}],
    myth:"SQL은 적힌 순서대로 실행된다? — 먼저 트리로 바뀌고, 어떤 순서·방법으로 할지는 다음 단계(planner)가 정해요." },

  planner:{ name:"길 고르는 지도 테이블", real:"planner (optimizer)",
    tip:"같은 결과로 가는 여러 길 중에서 가장 싸 보이는 길을 골라요.",
    what:"같은 SQL도 <b>전부 훑기(Seq Scan)</b>, <b>색인 보기(Index Scan)</b> 등 길이 여럿이에요. planner는 표 크기·값 분포 <b>통계</b>로 길마다 비용을 어림해 가장 싼 계획을 골라요. 통계가 낡으면 엉뚱한 길을 고르기도 해요.",
    talks:[["전담 사서","함수 호출 (같은 프로세스)","쿼리 트리 → 실행 계획"],["통계","pg_statistic 조회","행 수 · 값 분포"]],
    steps:["가능한 접근 방법 나열 (Seq Scan · Index Scan …)","통계로 걸러질 행 수 어림","방법마다 비용 계산","여러 표면 조인 순서·방법 고르기","가장 싼 계획 선택"],
    xr:[{l:"고른 계획 보기", code:`<span class='k'>${PAY.db}=> EXPLAIN SELECT balance FROM ${PAY.table}</span>\n<span class='k'>${PAY.db}-> WHERE owner = '${GUEST.users[0]}';</span>\n                                   QUERY PLAN\n----------------------------------------------------------------------------------\n Index Scan using wallets_owner_idx on ${PAY.table}  (cost=0.29..8.31 rows=1 width=8)\n   Index Cond: (owner = '${GUEST.users[0]}'::text)`},
        {l:"통계 새로 모으기", code:`<span class='k'>${PAY.db}=> ANALYZE ${PAY.table};</span>\nANALYZE`}],
    myth:"색인이 있으면 무조건 색인을 쓴다? — 결과가 표의 큰 부분이면 전부 훑기가 더 싸서 그쪽을 골라요." },

  index:{ name:"색인 서랍", real:"B-tree index",
    tip:"이름순으로 정리된 카드 서랍이에요. 몇 번만 내려가면 책 번호가 나와요.",
    what:"wallets_owner_idx는 owner 값을 <b>정렬된 나무(B-tree)</b>로 정리한 별도 파일이에요. 맨 위(root)에서 범위를 보고 내려가면 잎(leaf)에 <b>그 줄의 위치(TID, 예: (7,3))</b>가 있어요. 실제로는 색인도 8KB 페이지라 <b>열람 책상(버퍼)에 올려서</b> 읽어요 — 지도처럼 서고에서 바로 읽는 게 아니에요.",
    talks:[["전담 사서","Index Scan","owner 값 → 줄 위치(TID)"],["열람 책상","shared_buffers","색인 페이지 올려 읽기"]],
    steps:["root 페이지 읽기","키 범위를 비교해 아래 페이지 고르기",`leaf에서 '${GUEST.users[0]}' 찾기`,"TID (7,3) 얻기","표의 7번 페이지 3번째 줄로 가기"],
    xr:[{l:"색인 만들기", code:`<span class='k'>${PAY.db}=> CREATE INDEX wallets_owner_idx ON ${PAY.table} (owner);</span>\nCREATE INDEX`},
        {l:"나무 높이 (pageinspect)", code:`<span class='k'>${PAY.db}=> SELECT root, level</span>\n<span class='k'>${PAY.db}-> FROM bt_metap('wallets_owner_idx');</span>\n root | level\n------+-------\n    3 |     1\n<span class='c'>-- level 1 = root 아래 한 층 → 두 번 만에 leaf</span>`}],
    myth:"색인은 많을수록 좋다? — 줄을 고칠 때마다 색인도 고쳐야 해서 쓰기가 느려지고 공간도 들어요." },

  buffer:{ name:"열람 책상", real:"shared_buffers",
    tip:"자주 보는 책을 올려 두는 큰 책상이에요. 여기서 읽고 여기서 고쳐요.",
    what:"디스크의 8KB 페이지를 올려 두는 <b>공유 메모리 캐시</b>예요. 모든 사서가 함께 써요. 읽기도 고치기도 여기서 하고, <b>고친 페이지(dirty)</b>는 바로 디스크에 쓰지 않아요. 한 줄을 고치면 지우지 않고 <b>새 버전 줄</b>을 써요(MVCC).",
    talks:[["전담 사서","공유 메모리","페이지 찾기 · 읽기 · 고치기"],["서고 책장","파일 read / write","없는 페이지 읽어 오기"],["정리 담당","공유 메모리","dirty 페이지 넘기기"]],
    steps:["(표, 페이지 번호)로 찾기","있으면 바로 사용 (hit)","없으면 자리 비우고 디스크에서 읽기 (read)","고치면 새 버전 줄 + dirty 표시","dirty 페이지는 체크포인트 때 디스크로"],
    xr:[{l:"크기 (기본값)", code:`<span class='k'>${PAY.db}=> SHOW shared_buffers;</span>\n shared_buffers\n----------------\n 128MB`},
        {l:"한 줄의 여러 버전 (pageinspect · ② 사건 뒤)", code:`<span class='k'>${PAY.db}=> SELECT lp, t_xmin, t_xmax, t_ctid</span>\n<span class='k'>${PAY.db}-> FROM heap_page_items(</span>\n<span class='k'>${PAY.db}(>   get_raw_page('${PAY.table}', 7))</span>\n<span class='k'>${PAY.db}-> WHERE lp IN (3, 41);</span>\n lp | t_xmin | t_xmax | t_ctid\n----+--------+--------+--------\n  3 |    700 |    812 | (7,41)\n 41 |    812 |      0 | (7,41)`}],
    myth:"UPDATE는 그 자리 값을 덮어쓴다? — 새 버전 줄을 쓰고 옛 줄에 '여기까지(xmax)'를 표시해요. 옛 줄은 나중에 VACUUM이 치워요." },

  heap:{ name:"서고 책장", real:"heap (data files)",
    tip:"모든 책(페이지)이 진짜로 보관된 곳이에요. 느리지만 전원이 꺼져도 남아요.",
    what:"표 하나는 디스크의 파일(1GB마다 나뉨)이고, 그 안이 <b>8KB 페이지</b>로 나뉘어요. 페이지마다 여러 줄(행)이 들어 있어요. 메모리보다 훨씬 느려서 DB는 <b>디스크를 덜 읽는 것</b>에 많은 힘을 써요.",
    talks:[["열람 책상","파일 read","페이지 읽어 주기"],["정리 담당","write + fsync","체크포인트 때 dirty 페이지 받기"]],
    steps:["표 = 파일 (base/DB 번호/파일 번호)","파일 = 8KB 페이지가 이어진 것","페이지 = 머리말 + 줄 위치 목록 + 줄들","줄 = 머리(xmin · xmax) + 값"],
    xr:[{l:`${PAY.table} 표의 파일`, code:`<span class='k'>${PAY.db}=> SELECT pg_relation_filepath('${PAY.table}');</span>\n pg_relation_filepath\n----------------------\n base/16384/16397`},
        {l:"표 정의", code:`CREATE TABLE ${PAY.table} (            <span class='c'>-- ← 표·열 이름은 직접 지은 이름</span>\n  id      bigint PRIMARY KEY,\n  owner   text   NOT NULL,\n  balance bigint NOT NULL CHECK (balance >= 0)\n);`}],
    myth:"표는 한 덩어리로 읽고 쓴다? — 8KB 페이지 단위예요. 한 줄만 필요해도 페이지 한 장을 통째로 올려요." },

  wal:{ name:"변경 일지", real:"WAL (pg_wal)",
    tip:"무엇을 고쳤는지 순서대로 적는 일지예요. 책보다 일지를 먼저 디스크에 써요.",
    what:"모든 변경을 <b>먼저 일지에 적고(Write-Ahead Log)</b>, 데이터 페이지는 나중에 써요. COMMIT은 <b>일지를 디스크에 확정(fsync)</b>하는 순간이라, 페이지가 메모리에만 있어도 정전 뒤 일지로 되살려요. 일지는 끝에 덧붙이기만 해서 빨라요.",
    talks:[["일지 바구니","write + fsync","COMMIT 때 쪽지 받기"],["복구 담당","파일 읽기","재시작 때 redo 위치부터 읽히기"],["정리 담당","체크포인트 기록","'여기까지는 페이지도 디스크에' 표시"]],
    steps:["변경마다 기록 하나 (위치 번호 LSN)","COMMIT 기록 추가","디스크까지 확정 (fsync)","손님에게 COMMIT 응답","체크포인트 이전 일지는 재활용·삭제"],
    xr:[{l:"일지 파일 (16MB 조각)", code:"<span class='k'>$ ls $PGDATA/pg_wal</span>\n000000010000000000000001\narchive_status"},
        {l:"일지 내용 (pg_waldump · ② 사건)", code:"<span class='k'>$ pg_waldump -p $PGDATA/pg_wal 000000010000000000000001</span>\nrmgr: Heap        … tx:        812, lsn: 0/01A2A0F0, … desc: HOT_UPDATE … old_off: 3, … new_off: 41, blkref #0: rel 1663/16384/16397 blk 7\nrmgr: Heap        … tx:        812, lsn: 0/01A2A168, … desc: HOT_UPDATE … old_off: 5, … new_off: 42, blkref #0: rel 1663/16384/16397 blk 7\nrmgr: Transaction … tx:        812, lsn: 0/01A2A1E0, … desc: COMMIT 2026-10-12 10:02:11.482915 KST"}],
    myth:"COMMIT하면 표 파일에 바로 써진다? — 일지만 디스크에 확정되고, 표 파일은 나중에 체크포인트 때 써져요." },

  walbuf:{ name:"일지 바구니", real:"wal_buffers",
    tip:"일지 쪽지가 디스크로 가기 전에 잠깐 모이는 메모리 바구니예요.",
    what:"변경 기록은 먼저 메모리의 <b>WAL 버퍼</b>에 쌓여요. COMMIT하면 그때까지의 쪽지를 디스크 일지로 내려요. 메모리라서 <b>정전 때 사라지지만</b>, COMMIT 응답 전에 이미 디스크로 내렸으니 확정된 일은 잃지 않아요.",
    talks:[["전담 사서","공유 메모리","변경 기록 넣기"],["변경 일지","write + fsync","COMMIT 때 내려 쓰기"]],
    steps:["변경 기록을 바구니에 넣기","COMMIT이면 바구니 → 디스크 일지 (fsync)","비운 자리 다시 쓰기","walwriter가 틈틈이 미리 내려 두기도 함"],
    xr:[{l:"크기 (기본값: shared_buffers 의 1/32)", code:`<span class='k'>${PAY.db}=> SHOW wal_buffers;</span>\n wal_buffers\n-------------\n 4MB`},
        {l:"COMMIT 응답 전에 디스크까지 기다리나", code:`<span class='k'>${PAY.db}=> SHOW synchronous_commit;</span>\n synchronous_commit\n--------------------\n on`}],
    myth:"COMMIT 응답이 와도 아직 메모리에만 있을 수 있다? — synchronous_commit = on(기본값)이면 일지가 디스크에 확정된 뒤에 응답해요." },

  checkpointer:{ name:"정리 담당", real:"checkpointer",
    tip:"가끔 책상의 고친 책을 서고에 베껴 두고, 일지에 '여기까지 정리'라고 남겨요.",
    what:"주기적으로(기본 5분, 또는 일지가 많이 쌓이면) <b>dirty 페이지를 모두 데이터 파일에 써요</b>. 끝나면 체크포인트 기록을 남겨, 다음 복구는 <b>그 redo 위치부터만</b> 읽으면 되게 해요. 책을 옮기는 게 아니라 베끼는 거라 책상에는 그대로 남아요.",
    talks:[["열람 책상","공유 메모리","dirty 페이지 찾기"],["서고 책장","write + fsync","페이지 내려 쓰기"],["변경 일지","체크포인트 기록","redo 위치 남기기"]],
    steps:["redo 위치 정하기 (지금의 일지 위치)","dirty 페이지 모두 쓰기","fsync로 디스크 확정","체크포인트 기록을 일지에 쓰기","pg_control 갱신 · 오래된 일지 정리"],
    xr:[{l:"체크포인트 로그 (log_checkpoints = on)", code:"LOG:  checkpoint starting: time\nLOG:  checkpoint complete: wrote 1 buffers (0.0%); …"},
        {l:"주기 (기본값)", code:`<span class='k'>${PAY.db}=> SHOW checkpoint_timeout;</span>\n checkpoint_timeout\n--------------------\n 5min`}],
    myth:"COMMIT할 때마다 체크포인트가 일어난다? — 아니에요. 체크포인트는 가끔이고, COMMIT은 일지만 확정해요." },

  startup:{ name:"복구 담당", real:"startup process",
    tip:"재시작할 때만 일해요. 일지를 정리 지점부터 다시 읽어 책을 되살려요.",
    what:"서버가 정상 종료되지 않았으면 문을 열기 전에 <b>마지막 체크포인트의 redo 위치</b>부터 일지 끝까지 <b>변경을 다시 적용(redo)</b>해요. COMMIT 기록이 없는 거래의 줄은 지우지 않고, 그 번호를 '중단됨'으로 봐서 <b>안 보이게</b> 해요(PostgreSQL에는 따로 되돌리는 undo 단계가 없어요).",
    talks:[["변경 일지","파일 읽기","redo 위치부터 기록 읽기"],["열람 책상","공유 메모리","페이지 올리고 변경 다시 적용"],["정문 안내원","종료 알림","복구 끝 → 문 열기"]],
    steps:["pg_control에서 redo 위치 읽기","그 위치부터 일지 기록 하나씩 읽기","해당 페이지를 디스크에서 올리기","변경 다시 적용 (이미 적용된 건 페이지 LSN으로 건너뜀)","일지 끝 → 복구 체크포인트","postmaster에 끝 알리기"],
    xr:[{l:"복구 로그", code:"LOG:  database system was interrupted; last known up at 2026-10-12 10:04:58 KST\nLOG:  database system was not properly shut down; automatic recovery in progress\nLOG:  redo starts at 0/1A2B3C8\nLOG:  redo done at 0/1A2B5D0 …\nLOG:  checkpoint starting: end-of-recovery immediate wait\nLOG:  database system is ready to accept connections"}],
    myth:"복구는 커밋 안 된 변경을 찾아 지운다? — PostgreSQL은 지우지 않고 '중단된 거래'로 숨겨요. 실제 청소는 나중에 VACUUM이 해요." },

  lock:{ name:"잠금 표지판", real:"row-level lock",
    tip:"누가 어떤 줄을 고치는 중인지 표시해요. 같은 줄을 고치려는 사람은 줄을 서요.",
    what:"UPDATE는 고칠 줄에 <b>행 잠금</b>을 걸어요. 같은 줄을 고치려는 다른 거래는 앞 거래가 <b>끝날 때까지(COMMIT · ROLLBACK)</b> 기다려요. 하지만 <b>읽기는 기다리지 않고</b> 자기에게 보이는 버전을 읽어요(MVCC). 자물쇠는 비유이고, 실제 표시는 줄 머리의 xmax와 거래 번호 잠금으로 남아요.",
    talks:[["전담 사서 (고치는 쪽)","행 잠금 획득","줄 머리에 내 거래 번호"],["전담 사서 (기다리는 쪽)","transactionid 잠금 대기","앞 거래가 끝나길 기다림"]],
    steps:["UPDATE가 대상 줄 찾기","줄에 잠금 (xmax = 내 xid)","다른 쓰기는 그 xid가 끝나길 대기","COMMIT · ROLLBACK 때 풀림","기다리던 쪽은 최신 버전을 다시 확인"],
    xr:[{l:"거래 번호 잠금 (③ 사건 3장면)", code:`<span class='k'>${PAY.db}=> SELECT locktype, transactionid,</span>\n<span class='k'>${PAY.db}->   pid, granted</span>\n<span class='k'>${PAY.db}-> FROM pg_locks</span>\n<span class='k'>${PAY.db}-> WHERE transactionid = '901';</span>\n   locktype    | transactionid |  pid  | granted\n---------------+---------------+-------+---------\n transactionid |           901 | 41822 | t\n transactionid |           901 | 41907 | f\n<span class='c'>-- 41822 가 쥐고(t), 41907 이 기다림(f)</span>`},
        {l:"누가 막고 있나", code:`<span class='k'>${PAY.db}=> SELECT pg_blocking_pids(41907);</span>\n pg_blocking_pids\n------------------\n {41822}`}],
    myth:"누가 고치는 중이면 읽기도 막힌다? — 일반 SELECT는 막히지 않아요. 같은 줄을 고치는 쓰기끼리만 줄을 서요." }
};

/* ① 책 찾기 — SELECT */
var SELECT_BEATS = [
  { actor:"gate",
    text:"처음 상태예요 — 7번 책은 서고에만 있어요. 손님이 <b>5432번 정문</b>에 연결하면, 안내원이 이 손님만 맡을 <b>전담 사서</b>를 붙여 줘요(연결 하나 = 프로세스 하나).",
    xray:[{l:"연결 기록 (log_connections = on)", code:`LOG:  connection received: host=10.0.0.5 port=52344\nLOG:  connection authorized: user=${DB_USER} database=${PAY.db} application_name=${APP_NAME}`},
          {l:"새로 생긴 전담 프로세스", code:`postgres 41822  1201 … postgres: ${DB_USER} ${PAY.db} 10.0.0.5(52344) idle`}] },
  { actor:"parser",
    text:`사서가 <b>SQL 신청서</b>를 문장 검사 데스크에 올려요. 문법이 맞고 ${PAY.table} 표와 열이 정말 있어야 다음 단계로 가요.`,
    xray:[{l:"받은 SQL", code:`SELECT balance FROM ${PAY.table} WHERE owner = '${GUEST.users[0]}';`},
          {l:"열 이름이 틀렸다면 여기서 멈춰요", code:`ERROR:  column "blance" does not exist\nLINE 1: SELECT blance FROM ${PAY.table} WHERE owner = '${GUEST.users[0]}';\n               ^`}] },
  { actor:"planner",
    text:"지도 테이블에서 두 길을 비교해요. <b>책장 전부 훑기(비용 2137)</b>보다 <b>색인 서랍(비용 8.31)</b>이 훨씬 싸서 색인 길을 골라요.",
    xray:[{l:"고른 계획", code:`<span class='k'>${PAY.db}=> EXPLAIN SELECT balance FROM ${PAY.table}</span>\n<span class='k'>${PAY.db}-> WHERE owner = '${GUEST.users[0]}';</span>\n Index Scan using wallets_owner_idx on ${PAY.table}  (cost=0.29..8.31 rows=1 width=8)\n   Index Cond: (owner = '${GUEST.users[0]}'::text)`},
          {l:"색인이 없었다면", code:` Seq Scan on ${PAY.table}  (cost=0.00..2137.00 rows=1 width=8)\n   Filter: (owner = '${GUEST.users[0]}'::text)`}] },
  { actor:"index",
    text:`사서가 <b>색인 서랍</b>의 나무(B-tree)를 따라 내려가요. 두 번 만에 '${GUEST.users[0]}는 <b>7번 책 3번째 줄</b>'이라는 위치를 얻어요.`,
    xray:[{l:"색인이 알려 준 위치 (ctid)", code:`<span class='k'>${PAY.db}=> SELECT ctid, owner FROM ${PAY.table}</span>\n<span class='k'>${PAY.db}-> WHERE owner = '${GUEST.users[0]}';</span>\n ctid  | owner\n-------+-------\n (7,3) | ${GUEST.users[0]}`}] },
  { actor:"buffer",
    text:"먼저 <b>열람 책상(메모리)</b>에서 7번 책을 찾지만 없어요. 그래서 서고에서 <b>7번 책 한 권(8KB)</b>을 통째로 책상에 가져와요.",
    xray:[{l:"얼마나 책상에서, 얼마나 디스크에서", code:`<span class='k'>${PAY.db}=> EXPLAIN (ANALYZE, BUFFERS)</span>\n<span class='k'>${PAY.db}-> SELECT balance FROM ${PAY.table} WHERE owner = '${GUEST.users[0]}';</span>\n Index Scan using wallets_owner_idx on ${PAY.table}  (cost=0.29..8.31 rows=1 width=8) (actual … rows=1 loops=1)\n   Index Cond: (owner = '${GUEST.users[0]}'::text)\n   Buffers: shared hit=2 read=1\n<span class='c'>-- 색인 페이지 2장은 이미 책상 위(hit), 7번 책만 디스크에서(read)</span>`},
          {l:"이제 책상에 올라온 페이지 (pg_buffercache)", code:`<span class='k'>${PAY.db}=> SELECT relblocknumber, isdirty</span>\n<span class='k'>${PAY.db}-> FROM pg_buffercache</span>\n<span class='k'>${PAY.db}-> WHERE relfilenode = 16397;</span>\n relblocknumber | isdirty\n----------------+---------\n              7 | f`}] },
  { actor:"client",
    text:"7번 책 3번째 줄에서 잔액 <b>50000</b>을 읽어 손님에게 돌려줘요. 7번 책은 책상에 남아서, 다음엔 <b>디스크를 안 거치고</b> 바로 읽어요.",
    xray:[{l:"손님이 받은 결과", code:" balance\n---------\n   50000\n(1 row)"},
          {l:"같은 SQL 을 한 번 더", code:"   Buffers: shared hit=3\n<span class='c'>-- 세 장 모두 책상 위 — 디스크 읽기 0</span>"}] }
];

/* ② 책 고치기 — 트랜잭션 · 일지 · COMMIT */
var UPDATE_BEATS = [
  { actor:"backend",
    text:`<b>앞 사건에 이어서</b> 7번 책은 책상 위에 있어요. 손님이 ${GUEST.users[0]} → ${GUEST.users[1]} 10000원 이체를 <b>BEGIN</b>으로 시작해요 — 두 줄 모두 고치거나, 하나도 안 고치거나.`,
    xray:[{l:"손님이 보낼 묶음", code:`BEGIN;\nUPDATE ${PAY.table} SET balance = balance - 10000 WHERE owner = '${GUEST.users[0]}';\nUPDATE ${PAY.table} SET balance = balance + 10000 WHERE owner = '${GUEST.users[1]}';\nCOMMIT;`}] },
  { actor:"buffer",
    text:"사서가 책상 위 7번 책을 고쳐요. 옛 줄을 지우지 않고 <b>새 버전 줄</b>을 쓰고 거래 번호 812를 남겨요. 책에 <b>빨간 띠(dirty)</b>가 붙어요 — 서고엔 아직 옛 내용이에요.",
    xray:[{l:"응답", code:"UPDATE 1\nUPDATE 1"},
          {l:"7번 페이지 속 줄들 (pageinspect)", code:`<span class='k'>${PAY.db}=> SELECT lp, t_xmin, t_xmax, t_ctid</span>\n<span class='k'>${PAY.db}-> FROM heap_page_items(</span>\n<span class='k'>${PAY.db}(>   get_raw_page('${PAY.table}', 7))</span>\n<span class='k'>${PAY.db}-> WHERE lp IN (3, 5, 41, 42);</span>\n lp | t_xmin | t_xmax | t_ctid\n----+--------+--------+--------\n  3 |    700 |    812 | (7,41)\n  5 |    700 |    812 | (7,42)\n 41 |    812 |      0 | (7,41)\n 42 |    812 |      0 | (7,42)`}] },
  { actor:"walbuf",
    text:"고친 내용은 <b>일지 쪽지</b> 2장으로도 적혀 <b>일지 바구니</b>에 들어가요. 바구니는 아직 메모리라서, 지금 정전되면 쪽지도 사라져요.",
    xray:[{l:"쓴 위치 vs 디스크에 확정된 위치", code:`<span class='k'>${PAY.db}=> SELECT pg_current_wal_insert_lsn(),</span>\n<span class='k'>${PAY.db}->   pg_current_wal_flush_lsn();</span>\n pg_current_wal_insert_lsn | pg_current_wal_flush_lsn\n---------------------------+--------------------------\n 0/1A2A1E0                 | 0/1A2A0F0\n<span class='c'>-- 그 사이가 아직 바구니(메모리)에만 있는 쪽지</span>`}] },
  { actor:"wal",
    text:"손님이 <b>COMMIT</b>하면 바구니의 쪽지와 COMMIT 쪽지를 <b>일지에 쓰고 디스크까지 확정</b>해요. 그다음에야 'COMMIT' 응답이 가요 — 책은 아직 책상 위인데도요.",
    xray:[{l:"일지에 남은 기록 (pg_waldump)", code:"rmgr: Heap        … tx:        812, lsn: 0/01A2A0F0, … desc: HOT_UPDATE … old_off: 3, … new_off: 41, blkref #0: rel 1663/16384/16397 blk 7\nrmgr: Heap        … tx:        812, lsn: 0/01A2A168, … desc: HOT_UPDATE … old_off: 5, … new_off: 42, blkref #0: rel 1663/16384/16397 blk 7\nrmgr: Transaction … tx:        812, lsn: 0/01A2A1E0, … desc: COMMIT 2026-10-12 10:02:11.482915 KST"},
          {l:"손님이 받은 응답", code:"COMMIT"}] },
  { actor:"checkpointer",
    text:"얼마 뒤 <b>정리 담당</b>이 7번 책의 내용을 서고에 <b>베껴 써요(체크포인트)</b>. 정전 대비는 이미 일지가 했으니, 페이지 쓰기는 이렇게 나중에 몰아서 해요.",
    xray:[{l:"체크포인트 로그", code:"LOG:  checkpoint starting: time\nLOG:  checkpoint complete: wrote 1 buffers (0.0%); …"},
          {l:"남긴 redo 위치 (pg_controldata)", code:"<span class='k'>$ pg_controldata $PGDATA</span>\n…\nLatest checkpoint location:           0/1A2B440\nLatest checkpoint's REDO location:    0/1A2B3C8\n…"}] }
];

/* ③ 두 사람이 동시에 — 잠금 · MVCC · 격리 수준 */
var RACE_BEATS = [
  { actor:"lock",
    text:`<b>앞 사건에 이어서</b> ${GUEST.users[0]} 잔액은 40000이에요. 세션 A가 ${GUEST.users[0]}에서 30000을 빼며 그 줄에 <b>잠금(🔒)</b>을 걸고, 아직 COMMIT하지 않았어요.`,
    xray:[{l:"세션 A", code:`BEGIN;\nUPDATE ${PAY.table} SET balance = balance - 30000 WHERE owner = '${GUEST.users[0]}';\nUPDATE 1\n<span class='c'>-- 아직 COMMIT 안 함 (거래 번호 901)</span>`}] },
  { actor:"buffer",
    text:`세션 B가 ${GUEST.users[0]} 잔액을 읽어요. 901은 아직 커밋 전이라 B에게는 <b>옛 버전 40000</b>이 보이고, <b>잠금을 기다리지 않아요</b>(MVCC).`,
    xray:[{l:"세션 B", code:`SELECT balance FROM ${PAY.table} WHERE owner = '${GUEST.users[0]}';\n balance\n---------\n   40000\n(1 row)`}] },
  { actor:"lock",
    text:`세션 B가 ${GUEST.users[0]}에서 5000을 빼려 하자 <b>잠금</b>에 막혀요. 같은 줄을 고치는 쓰기끼리는 앞 거래가 끝날 때까지 <b>줄을 서요(⌛)</b>.`,
    xray:[{l:"세션 B — 응답 없이 멈춤", code:`UPDATE ${PAY.table} SET balance = balance - 5000 WHERE owner = '${GUEST.users[0]}';\n<span class='c'>-- (기다리는 중)</span>`},
          {l:"누가 누구를 기다리나", code:`<span class='k'>${PAY.db}=> SELECT pid, wait_event_type,</span>\n<span class='k'>${PAY.db}->   wait_event, state</span>\n<span class='k'>${PAY.db}-> FROM pg_stat_activity</span>\n<span class='k'>${PAY.db}-> WHERE datname = '${PAY.db}';</span>\n  pid  | wait_event_type |  wait_event   |        state\n-------+-----------------+---------------+---------------------\n 41822 | Client          | ClientRead    | idle in transaction\n 41907 | Lock            | transactionid | active`}] },
  { actor:"lock",
    text:`세션 A가 <b>COMMIT</b>하면 일지가 확정되고 <b>잠금이 풀려요</b>. 이제 ${GUEST.users[0]}의 최신 버전은 10000이에요.`,
    xray:[{l:"세션 A", code:"COMMIT;\nCOMMIT"},
          {l:"일지에 남은 기록", code:"rmgr: Transaction … tx:        901, lsn: 0/01A2B4E8, … desc: COMMIT 2026-10-12 10:05:40.118230 KST"}] },
  { actor:"backend",
    text:"B는 처음 본 40000이 아니라 <b>최신 버전 10000</b>에서 다시 계산해 5000으로 고쳐요(READ COMMITTED). 읽기는 기다리지 않고, 같은 줄 쓰기만 차례를 지켜요.",
    xray:[{l:"세션 B — 기다림이 끝나고", code:"UPDATE 1\nCOMMIT;\nCOMMIT"},
          {l:"B가 REPEATABLE READ 였다면", code:`BEGIN ISOLATION LEVEL REPEATABLE READ;\n…\nUPDATE ${PAY.table} SET balance = balance - 5000 WHERE owner = '${GUEST.users[0]}';\nERROR:  could not serialize access due to concurrent update\n<span class='c'>-- 처음 본 세상이 바뀌었으니 처음부터 다시 하라는 뜻</span>`}] }
];

/* ④ 정전 후 복구 — 일지 다시 읽기 */
var CRASH_BEATS = [
  { actor:"buffer",
    text:`<b>앞 사건에 이어서</b>, 마지막 정리 뒤의 변경(901·902)은 책상 위 7번 책에만 있어요. 세션 C가 ${GUEST.users[1]} 줄을 고치던 중(903, 커밋 전) <b>정전</b> — 책상과 바구니가 사라져요.`,
    xray:[{l:"세션 C — 고치던 중", code:`BEGIN;\nUPDATE ${PAY.table} SET balance = balance + 1000000 WHERE owner = '${GUEST.users[1]}';\nUPDATE 1\n<span class='c'>-- COMMIT 전에 전원이 꺼짐 (거래 번호 903)</span>`},
          {l:"디스크에 남은 것", code:"<span class='k'>$ pg_controldata $PGDATA</span>\nDatabase cluster state:               in production\n<span class='c'>-- 정상 종료였다면 'shut down'</span>\nLatest checkpoint's REDO location:    0/1A2B3C8"}] },
  { actor:"startup",
    text:"다시 켜면 정문을 열기 전에 <b>복구 담당</b>이 일지를 읽어요. 마지막 정리 지점(<b>redo 위치</b>)부터 끝까지만 보면 돼요.",
    xray:[{l:"서버 로그", code:"LOG:  database system was interrupted; last known up at 2026-10-12 10:04:58 KST\nLOG:  database system was not properly shut down; automatic recovery in progress\nLOG:  redo starts at 0/1A2B3C8"},
          {l:"이때 손님이 연결하면", code:"FATAL:  the database system is starting up"}] },
  { actor:"startup",
    text:"복구 담당이 서고의 7번 책(정리 때 버전)을 책상에 올리고, 일지의 변경을 <b>순서대로 다시 적용(redo)</b>해요. 커밋 안 된 903의 새 줄까지 일단 다시 써요.",
    xray:[{l:"다시 적용한 기록", code:"rmgr: Heap        … tx:        901, lsn: 0/01A2B470, … desc: HOT_UPDATE … old_off: 41, … new_off: 43, blkref #0: rel 1663/16384/16397 blk 7\nrmgr: Transaction … tx:        901, lsn: 0/01A2B4E8, … desc: COMMIT 2026-10-12 10:05:40.118230 KST\nrmgr: Heap        … tx:        902, lsn: 0/01A2B520, … desc: HOT_UPDATE … old_off: 43, … new_off: 44, blkref #0: rel 1663/16384/16397 blk 7\nrmgr: Transaction … tx:        902, lsn: 0/01A2B598, … desc: COMMIT 2026-10-12 10:05:52.904417 KST\nrmgr: Heap        … tx:        903, lsn: 0/01A2B5D0, … desc: HOT_UPDATE … old_off: 42, … new_off: 45, blkref #0: rel 1663/16384/16397 blk 7"},
          {l:"서버 로그", code:"LOG:  redo done at 0/1A2B5D0 …"}] },
  { actor:"buffer",
    text:"903은 <b>COMMIT 기록이 없어서</b> 중단된 거래로 처리돼요. 새 줄은 남아 있지만 아무에게도 <b>안 보여요</b> — 지우는 대신 숨겨요.",
    xray:[{l:"줄은 남아 있어요 (pageinspect)", code:`<span class='k'>${PAY.db}=> SELECT lp, t_xmin, t_xmax, t_ctid</span>\n<span class='k'>${PAY.db}-> FROM heap_page_items(</span>\n<span class='k'>${PAY.db}(>   get_raw_page('${PAY.table}', 7))</span>\n<span class='k'>${PAY.db}-> WHERE lp IN (42, 45);</span>\n lp | t_xmin | t_xmax | t_ctid\n----+--------+--------+--------\n 42 |    812 |    903 | (7,45)\n 45 |    903 |      0 | (7,45)`},
          {l:"하지만 보이는 건 커밋된 것뿐", code:`<span class='k'>${PAY.db}=> SELECT owner, balance FROM ${PAY.table}</span>\n<span class='k'>${PAY.db}-> WHERE owner IN ('${GUEST.users[0]}', '${GUEST.users[1]}') ORDER BY owner;</span>\n owner | balance\n-------+---------\n ${GUEST.users[1]}  |   30000\n ${GUEST.users[0]}  |    5000\n(2 rows)`}] },
  { actor:"gate",
    text:"복구가 끝나야 정문이 <b>다시 문을 열어요</b>. 커밋된 것은 모두 살아 있고 커밋 안 된 것은 없어요 — 일지가 지켜 주는 <b>원자성과 지속성</b>이에요.",
    xray:[{l:"서버 로그", code:"LOG:  checkpoint starting: end-of-recovery immediate wait\nLOG:  database system is ready to accept connections"}] }
];

window.CONTENT = {
  meta:{
    concepts:["postgresql", "sql", "query-planner", "btree", "shared-buffers", "transaction", "wal", "mvcc", "row-level-lock", "checkpoint", "crash-recovery"],
    guest:"client",
    values:["pay-app", "guest-app"],
    hubColor:"#7f1d1d",
    doors:[]
  },
  title:"데이터베이스 도서관",
  subtitle:"SQL 한 줄이 디스크까지 — PostgreSQL로 보는 DB의 큰 흐름",
  logo:"▤",
  intro:{
    title:"이 도서관이 데이터베이스예요",
    body:"왼쪽 <b>질의 처리</b>에서 SQL을 검사하고 길을 고르고, 가운데 <b>열람실(메모리)</b>에서 빠르게 일하고, 오른쪽·위 <b>서고와 일지(디스크)</b>에 오래 남겨요.<br>사건을 ①→④ 순서로 일으키면 <b>조회 → 트랜잭션 → 동시성 → 복구</b>, DB의 핵심 흐름이 하나로 이어져요.",
    sub:"실제 예시는 PostgreSQL 16 기준이에요. 궁금한 건물·인물은 언제든 눌러 보세요."
  },
  actors:ACTORS,
  events:[
    {id:"select", kind:"normal", icon:"🔍", title:"① 책 찾기", sub:"SELECT 한 번이 결과가 되기까지", beats:SELECT_BEATS},
    {id:"update", kind:"normal", icon:"✏️", title:"② 책 고치기", sub:"트랜잭션 · 일지 · COMMIT", beats:UPDATE_BEATS},
    {id:"race", kind:"normal", icon:"👥", title:"③ 두 사람이 동시에", sub:"잠금 · MVCC · 격리 수준", beats:RACE_BEATS},
    {id:"crash", kind:"recovery", icon:"⚡", title:"④ 정전 후 복구", sub:"일지로 되살리기", beats:CRASH_BEATS}
  ],
  names:{
    examples:{o:"COMMIT", c:`${PAY.table}`, a:"0/1A2B3C8"},
    official:["SELECT","FROM","WHERE","UPDATE","SET","BEGIN","COMMIT","ROLLBACK","CREATE TABLE","CREATE INDEX","CREATE DATABASE","CREATE ROLE",
      "ON","IN","ORDER BY","SHOW","EXPLAIN","ANALYZE","BUFFERS","PRIMARY KEY","NOT NULL","CHECK","bigint","text","ISOLATION LEVEL",
      "QUERY PLAN","Seq Scan","Index Scan","Index Cond","Filter","cost","rows","width","actual time","loops","Buffers","shared hit",
      "ctid","xmin","xmax","t_xmin","t_xmax","t_ctid","lp","heap_page_items","get_raw_page","bt_metap","root","level","leaf",
      "pg_buffercache","relblocknumber","isdirty","relfilenode","shared_buffers","wal_buffers","synchronous_commit","checkpoint_timeout",
      "pg_wal","pg_waldump","pg_controldata","pg_control","pg_xact","rmgr","Heap","HOT_UPDATE","HOT","Transaction","tx","lsn","desc","blkref","rel","blk",
      "old_off","new_off","LOG","ERROR","FATAL","LINE","pg_stat_activity","pg_locks","locktype","granted","pid","state","query","datname","wait_event","wait_event_type",
      "Lock","transactionid","Client","ClientRead","active","idle in transaction","idle","pg_blocking_pids","pg_relation_filepath",
      "pg_current_wal_insert_lsn","pg_current_wal_flush_lsn","pg_class","pg_attribute","pg_statistic","pg_hba.conf","application_name",
      "log_connections","log_checkpoints","PGDATA","archive_status","postmaster","backend","checkpointer","walwriter","startup process",
      "parser","analyzer","rewriter","planner","optimizer","executor","B-tree","TID","MVCC","WAL","LSN","xid","fsync","fork","VACUUM",
      "redo","undo","dirty","Write-Ahead Log","READ COMMITTED","REPEATABLE READ","Database cluster state","in production","shut down",
      "Latest checkpoint location","Latest checkpoint's REDO location","REDO location","OID","hit","heap","base","postgres"],
    projects:["PostgreSQL","psql","pageinspect"],
    custom:{[PAY.table]:"ctab", "wallets_owner_idx":"cidx", "owner":"ccol", "balance":"ccol", "id":"ccol", [GUEST.users[0]]:"cval", [GUEST.users[1]]:"cval",
      [PAY.db]:"cdb", [DB_USER]:"cuser", [APP_NAME]:"capp", [DB_HOST]:"chost", "blance":"ctypo", "wallet":"ctypo", "SELEC":"ctypo"},
    auto:{"700":"axid", "812":"axid", "901":"axid", "902":"axid", "903":"axid", "16384":"aoid", "16397":"aoid", "1663":"aoid",
      "41822":"apid", "41907":"apid", "1201":"apid", "1205":"apid", "1208":"apid", "52344":"aport", "10.0.0.5":"aip",
      "000000010000000000000001":"aseg"},
    patterns:[
      {re:"0/0?1A2[AB][0-9A-F]{3}", parts:function(m){ return [["a","alsn",m]]; }}
    ],
    messages:{
      o:"<b>공식 용어</b> · SQL·PostgreSQL이 정한 이름이라 그대로 써야 해요.",
      oext:"<b>공식 이름</b> · PostgreSQL과 그 도구·확장의 정식 이름이에요.",
      ctab:"<b>직접 지은 표 이름</b> · CREATE TABLE 때 정한 이름이에요. 다른 이름이어도 돼요.",
      cidx:"<b>직접 지은 색인 이름</b> · '표_열_idx'처럼 짓는 게 흔하지만 규칙은 없어요.",
      ccol:"<b>직접 지은 열 이름</b> · 표를 만들 때 정했어요.",
      cval:"<b>직접 넣은 값</b> · 예시 데이터예요.",
      cdb:"<b>직접 지은 DB 이름</b> · CREATE DATABASE 때 정한 이름이에요.",
      cuser:"<b>직접 정한 사용자 이름</b> · 관리자가 CREATE ROLE로 만들었어요.",
      capp:"<b>직접 지은 앱 이름</b> · 연결할 때 application_name으로 보낸 값이에요.",
      chost:"<b>예시 주소</b> · DB 서버 주소로, 운영하는 쪽이 정해요.",
      ctypo:"<b>일부러 틀린 이름</b> · 오류를 보여 주려고 잘못 적었어요.",
      axid:"<b>자동 생성</b> · 거래 번호(xid)예요. 처음 고치는 순간 DB가 차례로 붙여요.",
      aoid:"<b>자동 생성</b> · DB·표·테이블스페이스마다 DB가 붙인 번호(OID · 파일 번호)예요.",
      apid:"<b>자동 생성</b> · 운영체제가 붙인 프로세스 번호예요. 연결할 때마다 달라요.",
      aport:"<b>자동 배정</b> · 손님 쪽 운영체제가 고른 임시 포트예요.",
      aip:"<b>외부가 정한 값</b> · 손님 서버의 주소로, 네트워크가 배정해요.",
      alsn:"<b>자동 생성</b> · 일지 위치 번호(LSN)예요. 일지가 길어질수록 커지기만 해요.",
      aseg:"<b>자동 생성</b> · 일지 파일 이름 = 타임라인 + 위치. 16MB마다 새 파일이에요."
    }
  }
};
})();
