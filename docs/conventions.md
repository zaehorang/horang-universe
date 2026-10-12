# Conventions

## ID 문법

모든 id 는 `^[a-z0-9]+(-[a-z0-9]+)*$`. 한 번 공개되면 바꾸지 않는다.

| 대상 | 예 | 비고 |
|---|---|---|
| 세계 id | `db-library`, `k8s-harbor` | 폴더명 = URL |
| 지역 id | `network`, `ops`, `data` | 표시 이름은 등록부에서 따로 |
| actor 키 | `gate`, `rds`, `client` | 세계 안에서 고유. 기존 세계의 짧은 단어 그대로 |
| 사건 id | `deploy`, `request`, `scale-out`, `node-down` | 세계 안에서 고유 |
| 개념 id | `tls`, `kube-apiserver`, `dns` | 공식 용어 소문자형. 표시명은 사전이 가진다 |
| 예시 값 벌 | `shop-web`, `pay-app`, `guest-browser`, `guest-app` | `shared/values.js` 키 |
| 공인 IP 배정 | `publicIps["ops-ingress"]` | `shared/values.js` 의 배정표. 값 벌이 아니라 `meta.values` 에 선언하지 않는다. 세계가 어느 키를 쓰는지는 content.js 상단 상수 이름으로 드러낸다 |

문 참조: `<world>:<actor>` 또는 `<world>:<actor>@<event>`.
앵커: `worlds/<id>/#ev=<event-id>&b=<n>` (n 은 1부터).

## 사건 유형

세계마다 다음 중 **셋 이상을 목표**로 한다. 각 `events[].kind` 로 표시한다. 셋 미만은 `verified` 에서도 경고만 남기고 Phase 2 이관을 막지 않는다(D27). 2-8 에서 빈칸을 측정하고 Phase 4 에서 보강한다.

`normal`(정상 흐름) · `failure`(실패·에러) · `scale`(규모 변화) · `attack`(공격·방어) · `recovery`(복구) · `revisit`(두 번째 방문처럼 반복 시 달라지는 것) · `tour`(둘러보기)

## content.js `meta` (Phase 1 에서 확정, 이 형태를 바꾸지 않는다)

```js
meta: {
  concepts: ["dns", "tcp", "tls", "http"],            // 개념 id
  guest: "browser",                                   // 손님 역할 actor 키 (대륙 간 사건의 연결점)
  values: ["shop-web", "guest-browser"],             // 쓰는 예시 값 벌
  hubColor: "#4f7aa6",                         // 선택: 허브 지붕 상징색. 없으면 지역 toneDeep
  doors: [
    { from: "shop", to: "network-layers:server", why: "가게 안의 7층 빌딩을 보러 간다",
      whyBack: "이 빌딩이 서 있는 우편 도시로 나간다" }   // whyBack: 상대 세계 안에서 보이는 역방향 문구(선택, 없으면 why 재사용)
  ]
}
```

`events[]` 각 항목에 `id` 와 `kind` 가 있어야 한다.

## worlds.json

```json
{
  "name": "Horang Universe",
  "regions": [
    { "id": "network", "name": "네트워크 해안", "pos": [300, 420], "tone": "#a9d6a0", "hint": "이름이 주소가 되는 곳", "toneDeep": "#8dbd6f", "texture": "dots" }
  ],
  "worlds": [
    { "id": "network-layers", "region": "network", "pos": [240, 465], "status": "verified" },
    { "id": "next-world", "region": "network", "pos": [360, 465], "status": "draft", "since": "2026-10-12" },
    { "id": "old-world", "region": "network", "pos": [450, 465], "status": "archived", "redirect": "network-layers" }
  ],
  "hub": { "id": "hub", "status": "draft", "sea": "#5fb0c8", "seaDeep": "#3f8fab", "shore": "#efe2c0" }
}
```

지역의 `texture`(`dots` · `waves` · `paper` · `hatch`)는 허브 질감의 정본이다. `new_world` 는 생성 시 지역 톤과 질감을 세계 `world.css` 에 한 번 복사하며, 이후 세계가 직접 관리한다. 세계 이름·비유·개념은 등록부에 없다. 세계 meta 에서 온다. `tooling/schemas/worlds.schema.json` 은 형식 참고용이며 런타임에 읽지 않는다. 폴더·지역 참조·문 상대·redirect 대상·전역 좌표 중복 등 교차 검사의 정본은 `check_registry` 다.

## 상태 전이

`draft` → `verified` → `archived`. 역행 없음.

- `draft`: 허브에 공사 중 표시. `content.js` · `world.js` 내용 오류는 경고로 기록한다. 등록부 구조 오류·템플릿 동기 오류·허브 필수 파일 누락·세계 폴더의 금지 파일은 실패한다.
- `verified`: 내용 오류를 포함한 `check_all` 실패 항목이 모두 없어야 한다. 허브에 건물로. 전환 시 `since` 는 지운다(draft 기간 추적용 필드).
- `archived`: 허브 숨김. 공개된 `worlds/<id>/index.html` 을 리다이렉트 파일로 교체하고 `redirect` 필드에 목적지. 현재 검사는 리다이렉트 파일의 존재·내용을 보지 않으므로 수동 확인한다.

`hub.status` 는 허브 자체의 상태다. 형식상 필수이며 허브 렌더나 배포 동작에는 영향을 주지 않는다. 허브가 공개 배포된 뒤에는 `verified` 로 둔다.

## 리다이렉트 절차 (id 변경·흡수)

1. 새 id 세계가 `verified` 인지 확인.
2. 옛 폴더가 있으면 index.html 을 `<meta http-equiv="refresh">` + 안내 한 줄로 교체. 앵커가 있으면 JS 로 전달. 파일 존재와 동작을 브라우저에서 수동 확인.
3. 등록부 옛 항목을 `archived` + `redirect` 로.
4. 다른 세계 문 중 옛 id 를 가리키는 것이 있으면 check_registry 가 잡는다. 전부 새 id 로.

## 파일 규칙

- 세계 폴더에는 `index.html` · `content.js` · `world.js` · `world.css` · 선택적 `NOTES.md` 만. macOS·Git 메타 파일 `.DS_Store` · `.gitkeep` 은 예외로 허용하며 `.env` 를 포함한 다른 점 파일과 엔진 파일은 금지한다.
- 일반 세계 `index.html` 은 `tooling/templates/world-index.html` 복사본. `new_world` 가 만들고 엔진 변경 후 `build_world_index.mjs` 가 갱신하므로 손으로 고치지 않는다.
- `atlas.json` · `atlas.js` · `worlds/hub/index.html` · `shared/glossary.json` 생성 부분은 스크립트만 쓴다. 허브 index 는 엔진 index 에서 `build_hub_index.mjs` 가 만든다.

## 글 분량 (범용 스킬 규칙 승계)

tip 한 문장(≤80자) · 장면 자막 두 문장(≤150자) · what 2~3문장 · steps 3~7개 · xray 1~3블록.

## 콘텍스트 위생

과정 정보(수업·날짜·자료명·강사)와 제작 표현(슬라이드·PDF·스크립트)을 세계 안에 남기지 않는다. 비밀값·개인정보 금지. 실존 인증기관·버전은 확인한 것만.
