# Engine Contract

세계(`world.js` · `content.js` · `world.css`)가 엔진에 의존할 수 있는 범위다. 여기 없는 엔진 내부 함수·변수·DOM id 에 의존하면 엔진 변경 때 깨지고, 그 책임은 세계 쪽이다.
상세 API 는 원본 스킬의 `references/engine-api.md` 가 정본이고, 이 문서는 **계약의 범위와 저장소 전용 확장**만 적는다.

## 전역 계약 (원본 스킬과 공통)

| 전역 | 쓰는 쪽 | 내용 |
|---|---|---|
| `window.CONTENT` | content.js 가 정의 | `title` `subtitle` `logo` `intro` `actors` `events` `names` `lang` `ui` |
| `window.WORLD` | world.js 가 정의 | `home` `build(api)` `ambient` `reset` `afterEvent` `scenes` |
| `ISO.*` | world.js 가 호출 | 좌표(`iso` `isoL` `pts` `setOrigin`), 도우미(`el` `box` `flat` `faceR` `faceL` `act` `actLabel` `person` `robot` `bang` `paper` `label` `text` `bubble` `mover` `place` `curve` `addHitAreas`), 색 `C.*` |
| `api.*` (장면 함수 인자) | world.js | `ISO` `el` `iso` `isoL` `L` `defs` `bg` `RM` `state` `camTo` `camHome` `clearBubbles` `fly` `showLink` `hideLinks` `bubble` `text` `pop` `label` `link` |
| `EXPLORER.*` | 검사·디버그 | `api` `R` `startEvent(id)` `goBeat(n)` `next()` `prev()` `closeEvent()` `finish()` `events()` `state()` `openPanel()` `closePanel()` `openTip()` `closeTip()` `tagNames()` |
| `gsap`, `MotionPathPlugin` | 엔진·world.js | vendor 3.12.5 |

규칙: `build` 안에서만 그리기, 장면 함수는 같은 입력에 같은 결과, 상태 변경은 타임라인 안에서.

## 저장소 전용 확장 (Phase 1 에서 엔진에 추가)

| 확장 | 종류 | 내용 |
|---|---|---|
| `CONTENT.meta` | content 필드 | `concepts` `guest` `values` `doors` 와 선택 `hubColor`(허브 지붕색). 엔진은 읽지 않아도 동작. build_atlas 가 읽는다 |
| `CONTENT.events[].id` `.kind` | content 필드 | 사건 안정 id 와 유형. 엔진은 `id` 로 앵커·`EXPLORER.startEvent` 를 받는다 |
| `document.title` | 엔진 동작 | `CONTENT.title` 을 자동으로 넣는다 |
| 앵커 `#ev=<id>&b=<n>` | 엔진 동작 | 로드 시 해당 사건·장면으로 바로 간다. 장면 이동 시 해시를 갱신한다 |
| `window.ATLAS` (선택) | 엔진 입력 | 생성된 `atlas.js` 스크립트가 `window.ATLAS` 를 정의하면 패널 아래 문 버튼과 상단 허브 복귀 길을 켠다. `{ name, hub, regions, worlds, doors }` 형태다. `hub` 에는 `sea`·`seaDeep`·`shore`, `regions[]` 에는 `id`·`name`·`pos`·`tone`·`toneDeep`·`texture`·`hint`, `worlds[]` 에는 `id`·`region`·`pos`·`status`·`title`·`subtitle`·`roof`·`regionName`·`concepts`·`events[]`(각 `title` 포함)가 있다. `doors[].from` 은 `world`·`actor`, `doors[].to` 는 `world`·`actor`·`event`·`name`, 각 문은 `why`·`tone` 을 가진다. 엔진은 `location.pathname` 이 `/worlds/<id>/` 인 페이지에서 id 를 얻으며 `hub` 에서는 복귀 칩을 숨긴다. ATLAS 가 없으면 조용히 꺼진다 |
| `body.in-event` | 엔진 예약 클래스 | 사건 재생 중(`startEvent` 부터 `endEvent`·`closeEvent` 까지) 엔진이 `body` 에 붙인다. 세계는 읽기만 하고 직접 붙이거나 떼지 않는다. 엔진은 이 동안 `.route-chip` 을 `visibility:hidden` 으로 숨긴다 |
| head 아이콘 · 공유 메타 | 엔진 index | `<link rel=icon href="../../assets/favicon.svg">` 와 `og:*` · `twitter:card`(이미지는 공개 주소의 `assets/og.png` 절대 경로). 세계·허브 index 가 그대로 물려받는다. 독립 사용 때는 경로가 없어도 페이지 동작에 영향 없음 |
| `routeChip` · `doorList` | 선택 DOM id | 허브 길·문 버튼 자리. 독립 index 에 없으면 엔진은 건너뛴다 |
| `atlas.json` · `atlas.js` | 생성물 | 허브는 JSON fetch, 세계는 JS 스크립트로 동기 로드. 둘 다 `build_atlas` 생성·`check_all` 검사 |
| CSS 변수 | style.css | 아래 목록. 세계 world.css 의 `:root` 에서 덮어쓴다 |

### CSS 변수 (확정: `design.md` §3 과 문서 끝 `:root` 블록이 정본)

- 기존 이름(`--ink` `--ink2` `--card` `--card2` `--line` `--acc` `--acc-w` `--ok` `--warn` `--coral` `--sans` `--mono` `--world-bg`)은 유지하고 `--acc-ink` `--danger` `--dark*` `--name-*(-dark)` `--radius-*` `--shadow-*` 를 더한다.
- 세계가 덮어쓸 수 있는 것: `--world-bg` `--world-bg-deep` `--world-ground` `--world-texture` `--acc`(색상 200–230° 안). `--world-bg` 와 `--world-bg-deep` 은 엔진 기본 SVG 그라디언트, `--world-texture` 는 그 위 `#bgTexture` 에 적용한다. 질감 패턴은 `#tex-dots` `#tex-waves` `#tex-paper` `#tex-hatch` 넷이다. `check_world` 는 세계 `world.css` 의 모든 규칙 블록에서 다섯 변수 밖의 키와 범위 밖 `--acc` 색상을 경고하고, 엔진 `style.css` 에서 추출한 클래스·id 선택자 및 `body`·`html` 을 덮는 규칙도 경고한다. 허브 `worlds/hub/world.css` 는 지역·바다 표시를 맡는 특수 세계이므로 이 검사에서 제외한다.
- 이름 색 셋(파랑 공식·노랑 직접·회색 자동)은 종이용·짙은 층용 두 벌로 값까지 고정. 세계가 바꾸지 않는다.
- 변수화와 함께 대비 미달 네 곳 수정: `.btn #3b82f6→#2563eb`, `.now/.ok #16a34a→#15803d`, `.myth #d97706→#b45309`, `.xr .c #64748b→#8b9bb0`.
- 세계들이 공통으로 덮어쓰던 것을 엔진 기본으로 승격: SVG 라벨 16.5px/18px, 짙은 IP 표(`.tag-dark`), 사건 5개 이상이면 사건 패널 2열.

## 변경 규칙

- **추가**는 자유. CHANGELOG 에 `feature`.
- **계약 변경·삭제**는 `breaking`. 영향받는 모든 세계 수정을 같은 커밋에 넣고 `check_all` 통과.
- 엔진 내부 함수는 이름을 `_` 로 시작하거나 클로저 안에 둔다. 전역으로 새는 것은 계약으로 간주되니 피한다.
- 원본 스킬 엔진과의 차이는 분기마다 `diff` 로 확인하고, 범용 개선은 `docs/operations.md` 의 역반영 절차로.
