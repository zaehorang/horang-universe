# PLAN

진행 상태의 정본. 단계 상태는 완료 기준을 실제로 확인한 뒤에만 바꾼다.
상태 표기: `todo` · `doing` · `done` · `blocked`

## 개요

| Phase | 이름 | 목표 | 상태 |
|---|---|---|---|
| 0 | 스캐폴딩 | 폴더·문서·규칙·등록부 스키마 | done |
| 1 | 뼈대 | 엔진 손질 · 도구 · 허브 초안 · Pages 첫 배포 | done |
| 2 | 이관 | 기존 세계 다섯을 하나씩 들여오고 문·사전·검색 켜기 | doing |
| 3 | 흡수와 정리 | 구형 세계 흡수 · SKALA 정리 | todo |
| 4 | 확장 | 대륙 간 사건 · 만약에 토글 · 역반영 | todo |

---

## Phase 0 · 스캐폴딩 — done

**완료 기준**: 새 세션이 `docs/README.md` 부터 읽어 Phase 1 을 재논의 없이 시작할 수 있다.

- [x] `~/Project/horang-universe` 폴더 구조
- [x] README · CLAUDE.md · .gitignore
- [x] docs: vision · architecture · decisions · conventions · engine-contract · migration · PLAN · operations · backlog
- [x] 엔진 원본 복사(수정 없음) + PROVENANCE + CHANGELOG
- [x] `worlds.json` 초기(지역 셋, 세계 없음)
- [x] `shared/values.js` 초안(벌 네 개)
- [x] `.claude/skills/universe/SKILL.md` 초안
- [x] 디자인 자문 → `docs/design.md`, 등록부 톤 반영
- [x] 규칙 정본 `AGENTS.md` 하나로 통일, `CLAUDE.md` 는 `@AGENTS.md` 한 줄
- [x] LICENSE
- [x] `git init` 과 첫 커밋 (f575663)

## Phase 1 · 뼈대 — done

**완료 기준**: 공개 주소에 지역 셋만 보이는 허브가 뜬다. Actions 검사가 통과한다. universe 스킬로 빈 세계 하나를 등록·검사·삭제하는 연습이 된다. 임시 세계(서로 다른 kind 사건 3개)를 만들어 헤드리스 Chrome 에서 `EXPLORER.startEvent` 로 전 사건·전 장면, 유효·무효 `#ev=&b=` 앵커, ATLAS 없는 index 를 확인하고 삭제한다.

로컬 완료 기준 확인: 빈 등록부에서 허브 지역 셋, Node 20.20.2 `check_all`, `new_world` 왕복, 임시 세계 사건 3개·장면 4개 헤드리스 재생, 유효·무효 앵커, ATLAS 없는 index, 데스크톱 `EWV.all()` 통과. 공개 주소·Actions 실주행은 배포 미요청으로 대기. 그 뒤 렌더 검증·`check_world` act 인식·`build_world_index` 재작성·엔진 `in-event` 를 더한 최종 상태는 2026-10-12 에 로컬 Node 26.9.0 으로 `check_all` 통과, 헤드리스 Chrome 허브 페이지에서 `in-event` 동안 길 표시 칩이 포커스를 받지 않음까지 확인했다. Node 20 재주행과 `verify_browser` 전 사건 재생은 이 최종 상태에서 다시 하지 않았다. 따라서 Phase 상태는 `doing`.

### 1-A 엔진 선행 손질 (`tooling/engine/`)
- [x] `document.title` ← `CONTENT.title`
- [x] 세계용 index 템플릿 `tooling/templates/world-index.html`: `../../tooling/engine/` · `../../tooling/vendor/` 참조
- [x] style.css 색 리터럴 81개 → CSS 변수 (`design.md` 끝 `:root` 블록 적용) + 대비 미달 네 곳 수정
- [x] 세계 공통 덮어쓰기를 엔진 기본으로 승격: 라벨 16.5/18px · `.tag-dark` · 사건 5개 이상 2열
- [x] 질감 패턴 `#tex-dots` `#tex-waves` `#tex-paper` `#tex-hatch` 를 엔진 defs 에
- [x] 사건 `id` 지원: `scenes` 키 매칭, `EXPLORER.startEvent(id)`, 앵커 `#ev=&b=` 읽기·쓰기
- [x] `window.ATLAS` 선택 입력: 문 버튼 · 허브 복귀 길 (없으면 꺼짐)
- [x] CHANGELOG 기록, 원본 스킬 엔진과 diff 보존
- [x] 임시 세계(서로 다른 kind 사건 3개) 헤드리스 검증: 전 사건·장면, 유효·무효 `#ev=&b=`, ATLAS 없는 index 확인 후 삭제

### 1-B vendor

Pretendard 1.3.9 dynamic-subset 500·700·800 굵기와 WOFF2 276개는 사용자 제공 파일로 확인했다.
- [x] GSAP 3.12.5 core · MotionPathPlugin 을 `tooling/vendor/` 에
- [x] Pretendard 1.3.9 dynamic-subset, 굵기 500·700·800 만 — 276 woff2(3.9MB) `tooling/vendor/pretendard/`, CSS 생성 완료
- [x] JetBrains Mono 400·700 (OFL) — `--mono` 스택 교체
- [x] 라이선스 파일 동봉

### 1-C 데이터와 도구 (`tooling/scripts/`, Node 20, 의존성 없음)
- [x] `worlds.json` 스키마 검증 (`check_registry`): 폴더 존재 · region 존재 · pos 동일 좌표 중복 · status 값 · 문 상대 actor 존재 · values 벌 존재. 사건 kind 셋 미만은 경고(D27)
- [x] `build_atlas`: worlds.json + 각 `content.js` meta → `atlas.json` · `atlas.js` (문 양방향 생성 포함). DOM 없이 content.js 를 로드하는 방식은 범용 스킬 `check_world` 와 동일하게
- [x] `check_world`: 범용 스킬 것을 참조 엔진 구조에 맞게 가져옴
- [x] `check_all`: registry → 전 세계 check_world → 세계·허브 index 템플릿 동기 → 두 색인 stale
- [x] `new_world`: 템플릿에서 세계 생성 + 등록부 항목 추가 (엔진 복사 없음)
- [x] `verify_browser`: 로컬 브라우저 스모크 (범용 스킬 것 가져옴)

### 1-D 허브 (`index.html` + `worlds/hub/`)
- [x] 허브를 등록부 `hub` 항목으로. index 로더가 `atlas.json` 을 fetch 해 `window.ATLAS` 에 넣고, 엔진 위의 `CONTENT` · `WORLD.build(api)` 가 지역 셋을 섬/대지로 그림
- [x] 바다 그라디언트 `--sea→--sea-deep` · 섬(모래 테 + 지역 톤 윗면 + 측면 toneDeep) · 지역 이름 라벨
- [x] 건물 배치(등록부 pos) · 지붕색 = 세계 상징색 · 패널(개념 · 사건 · 들어가기) · draft 는 해치 기초 블록 + 안전모 인물 + 표지판
- [x] 길: 지역 안 점선 도로, 지역 사이 항로 점선 + 부표
- [x] 현재 위치: 허브는 코랄 인물 + 핀, 세계 안은 상단 길 표시 칩
- [x] 상단 검색칸 자리(사전은 Phase 2 에서 연결)
- [x] 루트 `index.html` 은 `worlds/hub/` 로 리다이렉트
- [x] `404.html`
- [x] `build_hub_index.mjs` 가 엔진 index 를 변환해 허브 index 생성, `check_all` 이 같은 함수로 동기 검사
- [x] `build_world_index.mjs` 가 엔진 index 에서 세계 index 템플릿을 만들고 등록된 세계 index 를 교체, `check_all` 이 같은 함수로 템플릿 동기 검사

### 1-E 로컬 스킬 `universe`
- [x] 자리 찾기 절차(등록부 · shared 읽기 → 지역 · 문 · 값 벌 제안)
- [x] 생성 → 등록 → 검사 → 색인 → 확인 명령 순서
- [x] 범용 스킬 호출 지점 명시(비유 설계와 내용 작성은 explorable-world 가 맡는다)

### 1-F 배포
- [x] `.github/workflows/pages.yml`: main push → check_all → upload-pages-artifact → deploy-pages
- [x] `gh repo create zaehorang/horang-universe --public` (2026-10-12, 커밋 f575663)
- [x] Pages 소스를 Actions 로 설정
- [x] 첫 배포 확인 (Actions run 38224580300 success, 공개 주소 200, atlas 지역 3 · 세계 0), README 의 주소 활성화

## Phase 2 · 이관 — doing

**완료 기준**: 세계 다섯이 `verified` 로 허브에 보이고, 선언된 문 셋이 양방향(여섯 방향)으로 동작하고, 검색이 사전을 읽는다.

순서와 체크리스트는 `migration.md`. 세계 하나가 커밋 하나.

**병렬 구조**: 세계 이관은 서로 독립이라 작업자를 나눠 동시에 한다. 1차 배치 셋(`network-layers` · `db-library` · `k8s-harbor`)을 각각 다른 작업자가 동시에 진행하고, 리뷰어 하나가 끝나는 순서대로 검토. 2차 배치(`eks-security` · `http-https`)는 1차의 문 상대가 생긴 뒤.

**공유 파일 규칙 (병렬 충돌 방지)**
- `worlds.json`: 각 작업자는 자기 세계 항목 한 줄만 추가한다. 파일 전체 재작성 금지. `new_world` 가 아니라 손으로 추가할 때도 같은 규칙.
- `shared/values.js`: `db-library` 작업자만 수정한다(결제 벌 확정). 다른 작업자는 읽기만. 필요한 값이 없으면 보고하고 멈춘다.
- `atlas.json` · `atlas.js`: 각 작업자가 자기 검사 때 `build_atlas` 를 돌리되, 커밋 전에 한 번 더 재생성한다.
- `tooling/engine/` · `tooling/scripts/`: 이관 작업자는 수정 금지. 엔진 버그를 찾으면 보고만 하고, 별도 작업자가 처리한다.
- `docs/migration.md` 세계별 표: 자기 행만 갱신.

- [x] 2-1 `network-layers` — 절차 검증. 막힌 곳은 체크리스트에 반영
- [x] 2-2 `db-library` — `pay-app` · `guest-app` 벌 확정
- [ ] 2-3 `k8s-harbor` — 먼저 `eks-security` 를 draft 로 생성하고 `ingress` actor 를 둔 뒤 `gate → eks-security:ingress` 문을 등록
- [ ] 2-4 `eks-security` — 내용 이관 후 문 둘 활성. **문 기능 첫 실사용 시험**
- [ ] 2-5 `http-https` — 작업 마무리 확인 후. 문 `shop → network-layers:server`
- [ ] 2-6 `build_glossary`: 전 세계 `actors[].real` + `meta.concepts` → `shared/glossary.json` 초안, 비유 대응표 수동 보강(Ingress 둘 묶기 등)
- [ ] 2-7 허브 검색칸 ↔ 사전 연결. 결과 → 건물 강조 → 앵커 이동
- [ ] 2-8 전 세계 사건 유형 점검. 셋 미만인 세계 기록(verified 가능, 보강은 Phase 4; D27)

## Phase 3 · 흡수와 정리 — todo

**완료 기준**: 구형 세계 내용이 항구에 들어가고, SKALA 에 explainers 가 남지 않는다.

- [ ] 3-1 `k8s-cluster-architecture` 의 만약에 사건 3개를 `k8s-harbor` 에 `failure` · `recovery` 사건으로 추가
- [ ] 3-2 등록부에 `k8s-cluster-architecture` 를 `archived` + redirect → `k8s-harbor` 로 기록(폴더는 두지 않음). 공개된 옛 URL 의 리다이렉트 파일이 필요한 경우 수동 확인
- [ ] 3-3 (승인) `SKALA/explainers/` 삭제, `SKALA/CLAUDE.md` 한 줄
- [ ] 3-4 공유용 미리보기 이미지 · 파비콘
- [ ] 3-5 메모리의 Horang Universe 항목을 "설계 결정"에서 "운영 중" 으로 갱신

## Phase 4 · 확장 — todo

**완료 기준**: 허브에서 "주문 버튼 하나" 가 네 세계를 지나며 재생된다.

- [ ] 4-1 대륙 간 사건 스키마(허브 장면 + 구간별 앵커)
- [ ] 4-2 "주문 버튼 하나": 우편 도시 → 공항 → 항구 → 도서관 → 귀환
- [ ] 4-3 만약에 토글을 엔진 공식 기능으로(장면 분기)
- [ ] 4-4 사건 유형 빈칸 보강(2-8 기록 기준)
- [ ] 4-5 원본 스킬 역반영 후보 묶기: 엔진 참조 옵션 · CSS 변수 · 사건 id·kind · 앵커 · `document.title` 자동화. 사용자 요청 시 진행
- [ ] 4-6 CS 기초 지역 신설 검토

## 미룬 것

`backlog.md`.
