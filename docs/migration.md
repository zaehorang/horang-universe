# Migration

기존 세계 다섯(`SKALA/explainers/`)을 Phase 2 에 이관하고, 여섯 번째는 Phase 3 에 흡수하는 절차와 메모.
SKALA 쪽 폴더 삭제와 CLAUDE.md 수정은 사용자 승인 뒤에만.

## 공통 체크리스트 (세계 하나당)

1. [ ] 폴더와 id 가 아직 없을 때 `node tooling/scripts/new_world.mjs <id> --region <region-id>` 로 폴더·index.html·`draft` 등록부 항목 생성(초기 pos·since 자동 기록)
2. [ ] 원본의 `content.js` · `world.js` · `world.css` 내용을 생성된 폴더에 이관. 엔진 파일은 복사하지 않음
3. [ ] `content.js` 에 `meta` 추가: concepts · guest · values · doors
4. [ ] 모든 `events[]` 에 `id` · `kind` 부여 (world.js `scenes` 키와 같게)
5. [ ] 세계 간 공유 값(도메인 · 손님 이름 · 공인 IP)만 `shared/values.js` 상수로 교체. 서비스 벌의 연결 정보(appName · dbHost · dbUser)는 포함. 내부망 주소 · 바이트 수 · 세계 고유 값은 그대로
6. [ ] `world.css` 를 `design.md` §7 의 세계별 표대로 옮기기: `--world-bg(-deep)` · `--world-texture`, 라벨 크기·`.iptag`·사건 패널 덮어쓰기 삭제, `#dc2626` 류 패널 글자색은 `--danger`. 지도 안(world.js) 의미색은 그대로. 세계가 바탕 그라디언트를 따로 만들어 `#bg` 를 덮어쓰지 않는다(엔진 `worldBgGrad` 가 `--world-bg` → `--world-bg-deep` 를 이미 그린다)
7. [ ] `new_world` 가 추가한 등록부 항목의 region · pos · status `draft` 확인
8. [ ] `check_registry` → `check_world <id> --draft` → `build_atlas` → `check_all` 통과
9. [ ] 로컬 서버에서 허브 → 세계 진입 → 전 사건 재생. 이관 전후 스크린샷 비교
10. [ ] `verify_browser` 통과. 콘솔 오류 0
11. [ ] NOTES.md 가 있으면 엔진 복사 관련 문구를 참조 방식 설명으로 갱신
12. [ ] status `verified`

## 세계별 메모

| 순서 | 세계 | 지역 | 손님 actor | 값 벌 | 문 | 메모 |
|---|---|---|---|---|---|---|
| 1 | `network-layers` | network | `client` | `shop-web`(도메인 예외) | → `http-https:shop` 반대편으로 자동 | **verified (2026-10-12)**. 가장 작고 NOTES 있음. 절차 검증용. 도메인은 `my-shop.example` 유지(D22), 가게 이름만 `shop-web` 참조. 디자인: `--world-bg #dcebf5` · `--world-bg-deep` 풀색 `#a9d6a0`(땅이 지역색), 세계 `skyGrad`·`#bg` 덮어쓰기 제거(엔진 `worldBgGrad` 와 같음), `--world-texture:url(#tex-dots)`, `.events` 470px·2열·`.lbl` 크기 덮어쓰기 제거. 사건 유형 normal·tour 둘(셋 미만, D27 경고만). 등록부 pos `[300,465]` |
| 2 | `db-library` | data | `client` | `pay-app` · `guest-app` | 없음(공항 쪽에서 들어옴) | **verified (2026-10-12)**. mina·joon·my-pay 유지(D23). 결제 벌 확정: `pay-app` 에 `appName` · `dbHost` · `dbUser` 추가, psql 줄머리까지 `PAY.db` 로 통일. 디자인: `api.bg.setAttribute(fill)` 리터럴 제거, 바탕 `#e3e8df`, `--world-texture:url(#tex-paper)`, `.lbl` 크기 삭제. 사건 유형 normal·recovery 둘(셋 미만, D27 경고만) |
| 3 | `k8s-harbor` | ops | `guest` | `shop-web` · `guest-browser` | `gate` → `eks-security:ingress` | **verified (2026-10-12)**. 문 `gate → eks-security:ingress` 는 상대 세계가 없어 `meta.doors` 에서 잠시 빼고 주석으로 보관, 2차 배치(eks-security) 때 복원. `shop.example.com` → `SHOP.domain`(`my-shop.example.com`), 정문 공인 주소 → `publicIps["ops-ingress"]`, 손님 이름 → `guest-browser`(손님 IP `198.51.100.23` 은 세계 고유 값으로 유지). 디자인: seaGrad 제거 → `--world-bg #7cc6d8`·`--world-bg-deep #5eb3c9`, `--world-texture:url(#tex-waves)`, `.iptag` → `.tag-dark`(SVG 라 world.js 가 rect·text 에 fill 을 직접 줌), `.iptag.term` → `.pod-terminating`, `.stamp.on text` → `--danger`, `.lbl` 크기 삭제. 사건 유형 normal·scale·recovery 셋. 등록부 pos `[780,340]` |
| 4 | `eks-security` | ops | `user` | `shop-web` · `guest-browser` | `rds` → `db-library:gate` | **verified (2026-10-12)**. 인물 23개로 최대. 같은 배치에서 k8s-harbor 의 보류 문 `gate → eks-security:ingress` 를 `meta.doors` 에 복원, 문 넷(두 쌍) 양방향을 브라우저에서 확인(문 기능 첫 실사용). `shop.example.com` → `SHOP.domain`, 정문 공인 주소 `203.0.113.10` → `publicIps["ops-ingress"]`, 손님 이름·real → `guest-browser`(정문 둘째 AZ 주소 `203.0.113.24`, 손님 IP `198.51.100.7` 은 세계 고유 값으로 유지). 디자인: 바탕 `#d9e8ef` → `--world-bg #cfdde3`·`--world-bg-deep #b8c9d0` 콘크리트, `#bg` 덮어쓰기 삭제, `--world-texture:url(#tex-waves)`, `.lbl` 크기 삭제, `.iptag` → 엔진 `g.tag-dark`(world.js 는 text 에 가운데 정렬 속성만 줌). 콘크리트만으로는 항만으로 읽히지 않아 world.js `L.base` 에 앞쪽 두 가장자리 바다 띠 `#7cc6d8` 와 잔물결 추가. 사건 유형 normal·attack 둘(셋 미만, D27 경고만). 등록부 pos `[900,300]`(new_world 가 고른 `[800,345]` 는 허브에서 k8s-harbor 와 겹침) |
| 5 | `http-https` | network | `browser` | `shop-web` · `guest-browser` | `shop` → `network-layers:server` | **verified (2026-10-12)**. 원본 엔진이 한 버전 뒤였으나 차이는 UI 문구(`ui`·`lang`)뿐이고 엔진이 없으면 기본값을 쓰므로 content.js 에 넣지 않음. world.js 는 계약 안 API 만 씀. 도메인·공인 IP·가게 이름 → `SHOP.domain` · `publicIps["shop-web"]` · `SHOP.name`/`shortName`, `names.custom` 도메인 키는 계산된 키로. 브라우저 actor 이름은 "내 브라우저" 유지(비유의 주어), real 만 `GUEST.real`. DNS 37·53, http 요청 69, TLS 레코드 91, IP 143바이트는 도메인 길이에 묶여 content.js 실행 단언(다르면 throw)으로 막음. 디자인: `#bg` 리터럴 삭제, `--world-bg #a9d6a0`·`--world-bg-deep #8dbd6f`, `--world-texture:url(#tex-dots)`, `.idx .warnt .certx` → `--danger`, `.lbl` 크기 삭제, 봉인 금색·메모 주황 유지. 엔진 선택자 경고를 없애려고 클래스 이름 변경: `.bub .ok/.bad` → `.chk.ok/.chk.bad`, `.conn.open` → `.conn.bare`, `.memol.on` → `.memol.lit`. 글꼴 굵기는 design §6 대로 정규화(고정폭 800·900→700, 600→400, 본문 900→800). 작은 화면(1280×640 · 1024×768)에서 화면 밖으로 나가던 말풍선 6곳은 원본부터 있던 문제라 위치를 안쪽으로 옮김. 사건 유형 normal·attack·failure·revisit 넷. 등록부 pos `[410,425]`(`[190,465]` 은 허브에서 긴 제목이 network-layers 이름표와 겹침), `hubColor #4f7aa6`(가게 지붕 `roofB`, design §5 표). 제목은 허브 이름표용으로 "우편 도시" 로 줄이고 나머지는 subtitle 로. 문은 `network-layers:server@request` + `whyBack` |
| 6 | `k8s-cluster-architecture` | ops | - | - | - | 들여오지 않음(D21). "권한 없는 사용자" "이미지 이름 틀리기" "노드 전원 끄기" 를 k8s-harbor 의 `failure`·`recovery` 사건으로 흡수. 완료 후 SKALA 에서 보관만 |

## 현재 상태 측정값 (2026-10-12)

인물은 `CONTENT.actors` 키 수, 사건은 원본 `content.js` 의 `CONTENT.events` 길이다(모두 `ready` 사건).

| 세계 | 인물 | 사건 | 오늘 엔진 갱신 | 비고 |
|---|---|---|---|---|
| http-https | 11 | 4 | 아니오 | engine.js 58줄 차이 |
| network-layers | 10 | 5 | 예 | |
| k8s-harbor | 19 | 4 | 예 | |
| eks-security | 23 | 4 | 예 | |
| db-library | 13 | 4 | 예 | |
| k8s-cluster-architecture | - | 9 | - | 단일 HTML 89KB, GSAP·ISO 미사용 |

## 통일할 것

- 도메인: `my-shop.example.com` / `my-shop.example` / `shop.example.com` → 대표 하나 + network-layers 예외.
- Ingress 비유: "항구 정문"과 "안내 데스크". 바꾸지 않고 용어 사전에서 같은 개념으로 묶는다(두 real 이 모두 Ingress Controller 라 자동 대응, `glossary.overrides.json` `notes.ingress` 에 대응 설명).
- 손님 actor 키가 세계마다 다름(browser · client · guest · user). 키는 두고 `meta.guest` 로 가리킨다.

## 이관 후 SKALA 정리 (승인 필요)

- `SKALA/explainers/` 삭제 또는 `.gitignore`.
- `SKALA/CLAUDE.md` 에 "세계(explorable world)는 `~/Project/horang-universe` 에서 만든다" 한 줄.
