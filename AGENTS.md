# Horang Universe 작업 규칙

이 저장소는 explorable-world 세계들을 하나의 세계관으로 묶어 GitHub Pages 로 공개하는 프로젝트다.
작업 전 `docs/README.md` 를 읽고, 결정된 사항은 `docs/decisions.md` 에서 재논의하지 않는다. 진행 상태는 `docs/PLAN.md` 가 정본이다.

## 역할 분리

- **세계 하나 만들기**: 원본 `explorable-world` 스킬(범용)을 그대로 쓴다. 이 저장소에서 원본 스킬 파일을 수정하지 않는다.
- **세계관 운영**(자리 찾기 · 등록 · 검사 · 허브 반영 · 배포): 이 저장소의 로컬 스킬 `universe` 가 맡는다.
- 엔진은 `tooling/engine/` 하나다. 세계 폴더에 엔진 복사본을 두지 않는다.
- 에이전트 규칙 정본은 이 `AGENTS.md` 하나다. `CLAUDE.md` 는 이 파일을 불러오는 한 줄만 둔다.

## 세계관 운영 절차 (로컬 스킬 `universe` 와 동일, 스킬을 못 읽는 에이전트용 요약)

1. **자리 찾기**: `worlds.json` · `shared/values.js` · 이웃 세계 `content.js` 의 `meta` 를 읽고 지역 · 문 · 값 벌 · 비유 계열 · 사건 유형(셋 이상)을 정해 한 문단으로 보여 준다. 새 지역은 사용자 확인 뒤에만.
2. **생성**: `node tooling/scripts/new_world.mjs <id> --region <region>`. 엔진 복사 없음.
3. **내용 작성**: 범용 explorable-world 스킬 규칙(3겹 설명 · 이름 색 · 글 분량)을 따른다. `meta`(concepts · guest · values · doors)와 모든 `events[]` 의 `id` · `kind` 를 채운다.
4. **검사**: `check_registry` → `check_world <id> --draft` → `build_atlas` → `build_glossary` → `check_all` → 로컬 `verify_browser`. 통과해야 등록부 status 를 `verified` 로. 실패는 결과 그대로 보고.
5. **확인**: `python3 -m http.server 8000` 로 허브 → 건물 → 전 사건 재생, 문 양방향.
6. **배포**: 사용자 요청 시 커밋 · push. Actions 는 `check_all` 정적 검사를 돌리고 Pages 에 올린다. `verify_browser` 는 로컬 전용이다.

상세는 `.claude/skills/universe/SKILL.md`, 규칙은 `docs/conventions.md`, 디자인 값은 `docs/design.md`.

## 행동 경계

- 작업이 길어지면 서브에이전트(Claude 의 Agent 도구, Codex 의 서브에이전트)를 써서 독립적인 조각(스크립트 작성, 검사 재현, 문서 갱신, 세계 하나 이관)을 병렬로 나눠도 된다. 엔진 변경과 등록부 스키마처럼 전체에 영향을 주는 결정은 주 에이전트가 직접 한다. 서브에이전트에게도 사용자 금지 사항(commit·push·`gh repo create`·Pages 설정·외부 게시·원본 스킬 수정·SKALA 저장소 수정)을 그대로 전달한다.

- 엔진을 고치면 같은 커밋에서 전 세계 검사를 돌리고 `tooling/engine/CHANGELOG.md` 에 한 줄 남긴다. 계약(`docs/engine-contract.md`)을 바꾸는 변경은 `breaking` 표기와 영향받는 세계 수정을 같은 커밋에 넣는다.
- `worlds.json` 은 운영자가 관리하며 `new_world` 가 새 항목을 추가한다. `atlas.json` · `atlas.js` · `worlds/hub/index.html` 은 스크립트로만 만든다. 생성물은 직접 편집하지 않는다.
- 세계 id · actor 키 · 사건 id · 지역 id 는 한 번 공개되면 바꾸지 않는다. 바꿔야 하면 `docs/conventions.md` 의 리다이렉트 절차를 따른다.
- 커밋·push 는 사용자가 요청할 때만 한다. 브랜치는 `main` 하나, PR 없음.
- `docs/PLAN.md` 의 단계 상태는 해당 단계의 완료 기준을 실제로 확인한 뒤에만 갱신한다.

## 콘텐츠 원칙

- 설명은 3겹: 자막(늘 보임) → 더 보기 패널 → 실제로는?(실제 명령·출력·형식).
- 이름 색: 파랑 공식 용어 · 노랑 직접 지은 이름 · 회색 자동 생성.
- 공용 손님·가게·주소는 `shared/values.js` 의 벌을 쓰고, 어느 벌을 쓰는지 세계 `meta` 에 적는다.
- 학습 산출물에 과정·출처 정보(수업·날짜·자료명)를 남기지 않는다. 기술 개념에 필요한 실제 도구·연구·모델 이름은 유지한다.
