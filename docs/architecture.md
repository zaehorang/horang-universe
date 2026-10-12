# Architecture

## 저장소 구조

```
horang-universe/
  index.html              worlds/hub/ 로 보내는 리다이렉트
  worlds.json             등록부 — 운영자가 관리하고 new_world 가 새 항목을 추가한다. `site`(공개 주소)는 공유 이미지 절대 주소의 유일한 출처
  atlas.json · atlas.js   색인 두 형식 — build_atlas 가 함께 만든다. 직접 편집 금지
  404.html                허브로 되돌려 보내는 페이지. archived 옛 주소면 atlas `archived[]` 로 합쳐진 세계로 보낸다
  assets/                 favicon.svg(지도책 ◆) · og.png(공유 미리보기 1200×630, 허브 화면) — 엔진 index head 가 참조
  worlds/hub/             엔진 기반 허브 본체 (index.html · content.js · world.js · world.css)
  worlds/<id>/
    index.html            얇은 파일: ../../tooling/engine 과 vendor 를 참조
    content.js            인물·사건·3겹 설명 + meta
    world.js              지도 배치·장면 애니메이션
    world.css             이 세계만의 스타일 (엔진 CSS 변수 덮어쓰기)
  shared/
    values.js             공용 인물·가게·주소 벌 (전역 상수)
    glossary.json         용어 사전 — build_glossary 생성물. 직접 편집 금지
    glossary.overrides.json  사전 손 보강(표시명·검색어·비유 대응·자동 대응 추가/제외)
  tooling/
    engine/               engine.js · iso.js · style.css · index.html(템플릿 원본) · CHANGELOG · PROVENANCE · ORIGIN.diff
    vendor/               gsap.min.js · MotionPathPlugin.min.js · Pretendard · JetBrains Mono
    templates/            세계 index.html 템플릿, content/world 템플릿
    schemas/              등록부 참고용 JSON Schema
    scripts/              lib.mjs · new_world · check_world · check_registry · build_atlas · build_glossary · build_world_index · build_hub_index · check_all · verify_browser
  .claude/skills/universe/  저장소 전용 운영 스킬
  .github/workflows/      check → deploy pages
  docs/
```

## 네 가지 정보와 주인

| 정보 | 주인 | 파일 | 예 |
|---|---|---|---|
| 세계가 아는 것 | 세계 | `worlds/<id>/content.js` 의 `meta` | 개념 목록, 문, 손님 actor, 예시 값 벌 |
| 세계관만 아는 것 | 등록부 | `worlds.json` | 지역, 허브 좌표, 상태 |
| 허브가 읽는 것 | 생성물 | `atlas.json` fetch | 위 둘을 합친 색인 |
| 세계가 선택적으로 읽는 것 | 생성물 | `atlas.js` 스크립트 | 같은 색인을 동기 로드해 문·허브 길에 사용 |

세계를 고치면 meta 가 바뀌고, 색인은 스크립트가 다시 만든다. 사람이 두 곳을 맞출 일이 없다.
Actions 의 `check_all` 이 현재 등록부·내용에서 기대 색인을 계산해 커밋된 색인과 비교한다(stale 검사).

## 데이터 흐름

`build_atlas` 는 `worlds.json` 과 각 `content.js` 의 meta 를 합쳐 `atlas.json` 과 `atlas.js` 를 함께 만든다. 허브는 JSON 을 fetch 하고, 세계 페이지는 JS 스크립트를 동기 로드한다. `check_all` 이 두 형식의 stale 여부, 세계 index 템플릿 동기, 허브 index 의 엔진 파생 여부를 검사한다. `build_glossary` 는 각 세계 `meta.concepts` 와 `actors[].real` 을 맞춰 개념마다 세계·actor·비유 이름·장면 앵커를 모으고, `shared/glossary.overrides.json` 의 손 보강을 얹어 `shared/glossary.json` 을 만든다. 개념에 묶이지 않은 actor 는 `loose` 로 남겨 이름 검색에 쓴다. `check_all` 이 사전 stale 과 손 보강의 대상 존재를 검사한다. 세계 페이지는 `atlas.js` 가 없어도 자체 내용으로 동작한다.

## 엔진과 세계의 경계

- 엔진이 고정하는 것 = **읽는 법**: 자막 칸, 패널 구조, 3겹 순서, 다음/다시 보기, 이름 색 규칙, 범례.
- 세계가 정하는 것 = **보이는 것**: 지도의 모양·색·배경, 요청이 움직이는 길, 애니메이션, CSS 변수 값.
- `iso.js` 는 그리기 도우미일 뿐 필수가 아니다. 평면·단면 지도도 가능하다.

## 허브

허브는 등록부 `hub` 항목으로 관리하는 특수 세계다. 엔진으로 만들되 index 로더가 `atlas.json` 을 fetch 하고, world.js 가 전달된 색인에서 지역(섬/대지)과 건물을 좌표대로 그린다. `worlds/hub/index.html` 은 `build_hub_index.mjs` 가 엔진 index 에 허브 치환을 적용해 생성한다.
건물 클릭 → 말풍선 → "더 알아보기" 패널에서 개념 목록·사건 목록·들어가기. 상단 검색칸은 허브 world.js 가 `shared/glossary.json` 을 fetch 해 개념 → 세계·장면 목록을 보여 준다. 개념 줄은 해당 건물을 강조하고, 자리 줄을 고르면 그 건물을 강조한 뒤 `worlds/<id>/#ev=&b=` 앵커로 이동한다. 사전을 못 읽으면 검색칸만 꺼지고 지도는 그대로 동작한다.
Phase 4 에서 대륙 간 사건이 허브의 장면으로 들어간다.

## 문 (door)

한쪽 세계의 meta 에만 적는다. `{ from: "<actor>", to: "<world>:<actor>[@<event>]", why: "...", whyBack: "..." }`. `whyBack` 은 자동 생성되는 역방향 문의 버튼 문구이고 없으면 `why` 를 재사용한다.
build_atlas 가 반대 방향을 자동 생성한다. 엔진은 두 방향 모두 패널 아래 버튼으로 그린다.

## 앵커

`worlds/<id>/#ev=<event-id>&b=<n>` — 사건 id 와 장면 번호. 문 버튼과 검색 결과가 이 형태로 연결한다.
사건 배열의 위치가 아니라 id 를 쓰므로 사건을 끼워 넣어도 링크가 유지된다.

## 배포

main push → Actions: `check_all`(check_registry + 전 세계 check_world + 세계·허브 index 동기 + atlas · glossary stale) → 통과 시 Pages 업로드.
실패하면 마지막 성공 배포가 남는다. 외부 의존은 vendor 에 있어 배포물이 자족적이다.
