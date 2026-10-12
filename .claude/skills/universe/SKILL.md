---
name: universe
description: Horang Universe 저장소에서 세계(explorable world)의 자리를 찾고, 등록·검사·색인·허브 반영·배포를 맡는 세계관 운영 스킬. 사용자가 이 저장소에서 "X 를 세계로 만들어 줘", "세계 등록해 줘", "허브에 붙여 줘", "검사해 줘", "배포 준비" 라고 할 때 사용한다. 세계 하나의 비유 설계와 내용 작성은 범용 explorable-world 스킬이 맡으므로 이 스킬은 그 앞뒤만 담당한다.
---

# universe — 세계관 운영

이 스킬은 **세계 하나를 만드는 법**을 알지 않는다. 그것은 범용 `explorable-world` 스킬의 몫이다.
이 스킬은 세계가 **둘 이상일 때 생기는 일**만 한다: 자리 찾기 · 등록 · 검사 · 색인 · 허브 · 배포.

작업 전 `docs/README.md` 와 `docs/PLAN.md` 의 현재 Phase 를 읽는다. `docs/decisions.md` 는 재논의하지 않는다.

## 1. 자리 찾기 (세계를 만들기 전)

읽는 것: `worlds.json`, `shared/values.js`, `shared/glossary.json`(있으면), 이웃 세계의 `content.js` `meta`.

정하는 것:
- **지역** — 기존 셋 중 하나. 마땅하지 않으면 새 지역을 **제안**하고 사용자 확인 뒤 등록부에 추가.
- **문** — 이웃 세계의 어느 actor 와 이어지는가. `conventions.md` 문 참조 문법.
- **값 벌** — `shared/values.js` 의 어느 가게·손님을 쓰는가. 겹치면 새 벌을 제안.
- **비유 계열** — 사전에 같은 개념이 있으면 그 비유 계열을 범용 스킬에 전달한다.
- **사건 유형** — normal·failure·scale·attack·recovery·revisit·tour 중 셋 이상이 되도록 범용 스킬에 요구한다.

결과를 지역·문(상대 actor 와 사건)·값 벌·비유 계열·사건 유형 셋 이상을 담은 한 문단으로 사용자에게 보여 준다. 새 지역이 필요하면 사용자 확인 뒤에만 등록한다.

## 2. 생성

```bash
node tooling/scripts/new_world.mjs <id> --region <region-id>
```

`worlds/<id>/` 에 템플릿 셋 + 얇은 index.html, 등록부에 `draft` 항목. 엔진 복사 없음.
이후 비유 설계와 내용 작성은 원본 `explorable-world` 스킬을 호출해 넘긴다. 이 로컬 스킬에서 비유 설계·3겹 설명을 대신 쓰지 않는다. 넘길 때 1 에서 정한 지역 · 문 · 값 벌 · 비유 계열 · 사건 유형을 전달한다.

## 3. 등록 확인

범용 스킬이 끝나면 `content.js` 에 다음이 있는지 본다. 없으면 채운다.
- `meta.concepts` `meta.guest` `meta.values` `meta.doors`
- 모든 `events[]` 에 `id` 와 `kind`

## 4. 검사와 색인

```bash
node tooling/scripts/check_registry.mjs
node tooling/scripts/check_world.mjs <id> --draft
node tooling/scripts/build_atlas.mjs
node tooling/scripts/check_all.mjs
# tooling/scripts/verify_browser.js 내용을 로컬 브라우저 콘솔에 실행한 뒤 await EWV.all()
```

draft 의 `content.js` · `world.js` 내용 오류는 경고로 보고한다. 등록부 구조 오류·템플릿 동기 오류·허브 필수 파일 누락·세계 폴더 금지 파일은 draft 에서도 실패다. 사건 kind 셋 미만은 `verified` 에서도 경고이며 2-8 에 기록해 Phase 4 에 보강한다. `check_world` 는 일반 세계의 `world.css` 모든 규칙에서 허용 변수 다섯 밖의 키, `--acc` 색상 200–230° 밖, 엔진 클래스 선택자를 경고하고, 허브는 이 검사에서 제외한다.

브라우저 확인까지 통과하고 내용 오류가 없으면 등록부 status 를 `verified` 로 바꾸고 `build_atlas` → `check_all` 을 다시 실행한다. verified 의 내용 오류는 실패다. 실패는 결과 그대로 보고하고 상태를 올리지 않는다.

## 5. 확인

`python3 -m http.server 8000` 로 허브 → 해당 건물 → 들어가기 → 전 사건 재생. 문이 있으면 양방향 눌러 본다.

## 6. 배포

커밋 · push 는 사용자가 요청할 때만. push 하면 Actions 가 `check_all` 정적 검사를 돌리고 Pages 에 올린다. `verify_browser` 는 로컬에서만 실행한다.

## 하지 않는 것

- 원본 explorable-world 스킬 파일 수정.
- `atlas.json` · `atlas.js` · `worlds/hub/index.html` · `shared/glossary.json` 생성 부분 직접 편집.
- 사용자 승인 없는 지역 신설, SKALA 저장소 변경.
- 검사 실패 상태에서 `verified` 로 올리기.
- 사용자 요청 없는 `gh repo create` · Pages 설정 · 외부 게시 · SKALA 저장소 수정.

## 순서

자리 찾기 → `new_world` 생성과 draft 등록 → 원본 스킬로 내용 작성 → `check_registry` · `check_world` → `build_atlas` → `check_all` → 브라우저 확인 → 통과 시 verified 등록 후 색인·전체 검사 재실행. 색인 두 형식(`atlas.json` · `atlas.js`)은 항상 `build_atlas` 로 함께 만든다. 허브는 JSON fetch, 세계는 JS 스크립트로 동기 로드한다.
