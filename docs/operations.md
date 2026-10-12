# Operations

틀이 올라간 뒤(Phase 1 완료 후) 반복되는 절차.

## 새 세계 추가

1. 이 저장소에서 `universe` 스킬로 자리 찾기(지역 · 문 · 값 벌).
2. `node tooling/scripts/new_world.mjs <id> --region <region-id>` → 세계 폴더 + 등록부 항목(`draft`). 지역 톤과 질감은 생성 시 `world.css` 에 한 번 복사된다.
3. 범용 `explorable-world` 로 비유 설계와 내용 작성. meta 와 사건 id · kind 를 채운다.
4. `node tooling/scripts/check_registry.mjs` → `node tooling/scripts/check_world.mjs <id> --draft` → `node tooling/scripts/build_atlas.mjs` → `node tooling/scripts/build_glossary.mjs` → `node tooling/scripts/check_all.mjs`. build_glossary 가 표시명을 찾지 못한 개념을 알리면 `shared/glossary.overrides.json` 의 `labels` 에 더한다. draft 의 `content.js` · `world.js` 내용 오류는 경고로 기록되며, 등록부 구조·템플릿 동기·허브 필수 파일·세계 폴더 금지 파일 오류는 실패한다. verified 는 내용 오류도 실패한다. 사건 kind 셋 미만과 `world.css` 의 허용 변수·엔진 선택자 범위 밖 선언은 verified 에서도 경고다.
5. 로컬 서버로 허브 → 세계 진입·전 사건 확인. `verify_browser` 를 로컬에서 실행하고 통과한 뒤 status 를 `verified` 로 바꾸어 `build_atlas` → `build_glossary` → `check_all` 재실행.
6. 사용자 요청 시 커밋 · push. Actions 는 `check_all` 정적 검사를 돌리고 배포한다. `verify_browser` 는 로컬 전용이다.

SKALA 학습 중 "세계로 만들자" 가 나오면 이 저장소로 옮겨 작업한다. 세션을 나누는 게 번거로우면 SKALA 세션에서 이 저장소 경로를 지정해 만드는 것도 가능하다(써 보고 정한다).

## 엔진 변경

1. `tooling/engine/` 수정.
2. `node tooling/scripts/build_world_index.mjs --dry-run` 으로 대상을 확인한 뒤 `node tooling/scripts/build_world_index.mjs` 를 실행한다. 엔진 index 에서 `tooling/templates/world-index.html` 을 다시 만들고, 등록된 archived 아닌 세계의 index 를 그 템플릿으로 교체한다. 다른 작업이 진행 중인 세계를 빼려면 대상 id 를 인자로 준다(`build_world_index.mjs <id>...`). `node tooling/scripts/build_hub_index.mjs` 로 엔진 index 에서 허브 index 를 다시 만든다.
3. `build_atlas` → `build_glossary` → `check_all` 로 전 세계 검사. 깨진 세계는 같은 커밋에서 수정.
4. `CHANGELOG.md` 한 줄(`breaking` 이면 영향 세계 명시), `ORIGIN.diff` 재생성.
5. 계약이 바뀌었으면 `docs/engine-contract.md` 갱신.
6. 세계 둘 이상을 브라우저로 열어 눈으로 확인.

`ORIGIN.diff` 는 원본 스킬의 `engine/` 네 파일과 저장소 엔진 네 파일(`index.html` · `style.css` · `iso.js` · `engine.js`)을 같은 순서로 `diff -u` 비교한 패치다. 원본 파일은 읽기만 하고, 변경 뒤 다음 명령으로 재생성한다.

```bash
python3 - <<'PY'
from pathlib import Path
import difflib
original = Path.home() / '.claude/plugins/marketplaces/horang-skills/explorable-world/engine'
parts = []
for name in ('index.html', 'style.css', 'iso.js', 'engine.js'):
    before = (original / name).read_text().splitlines(keepends=True)
    after = (Path('tooling/engine') / name).read_text().splitlines(keepends=True)
    parts.extend(difflib.unified_diff(before, after, fromfile='original/'+name, tofile='universe/'+name))
Path('tooling/engine/ORIGIN.diff').write_text(''.join(parts))
PY
```

## 원본 스킬과의 거리 점검 (분기마다)

```bash
diff -r tooling/engine ~/.claude/plugins/marketplaces/horang-skills/explorable-world/engine
```

- 범용 개선(세계 하나뿐이어도 말이 되는 것): 역반영 후보로 `backlog.md` 에 적는다. 실제 반영은 사용자 요청 시.
- 저장소 전용(등록부 · 문 · 허브): 그대로 둔다.
- 원본 쪽에만 생긴 개선: 가져올지 판단.

## 깨진 것 찾기

`check_registry` 는 루트·허브 필수 파일, 지역·세계의 허용 키와 필수 필드, 색(`hubColor` 포함), 지역 질감, 폴더·지역·전역 좌표·상태, `since`, archived `redirect` 의 verified 대상, 문 상대 actor·사건과 양쪽 중복 선언 경고, guest actor, 사건 id·kind, `shared/values.js` 벌을 확인한다. draft 의 content 기반 오류는 경고, kind 셋 미만과 30일 초과, `hub` 도 등록 id 도 아닌 `worlds/*` 폴더(Pages 에는 그대로 공개됨)도 경고다. `check_world` 는 세계 폴더 금지 파일·내용·장면과 `world.css` 전체 규칙의 변수·엔진 클래스 선택자를 확인한다. `check_all` 은 엔진 index 에서 두 index 를 렌더해(치환이 하나라도 안 맞거나 원형 상대경로·없는 파일 참조가 남으면 렌더 실패 ✗) 세계·허브 index 템플릿 동기와 두 atlas 생성물·`shared/glossary.json` 의 stale 여부를 보며(사전은 손 보강 `shared/glossary.overrides.json` 이 없는 세계·actor·사건·개념을 가리키거나 이미 자동 대응된 것을 다시 적으면 ✗, real 에서 표시명을 못 찾고 `labels` 에도 없는 개념은 경고), `invalidDrafts` 로 표시된 내용 오류 draft 와 그 세계가 걸린 문만 stale 비교에서 제외한다.

## 되돌리기

- 세계 하나: 폴더 단위라 `git revert` 로 끝.
- 엔진: revert 뒤 `check_all` 재실행.
- Pages: 검사 실패 시 마지막 성공 배포가 남는다. 배포된 것을 되돌리려면 revert 커밋을 push.

## id 변경 · 세계 흡수

`conventions.md` 의 리다이렉트 절차.

## 버전 표기

허브 상단 `hubCount` 에 지역 수와 세계 수를 표시한다. 마지막 배포 날짜 표시는 아직 구현하지 않았다. 릴리스 태그는 대륙 간 사건 같은 큰 변화에만.

## 정본과 백업

정본은 이 저장소 하나. SKALA 나 다른 곳에 복사본을 남기지 않는다. 공개 전 자료는 `draft` 로 저장소 안에.

## 용어 사전 보강

`shared/glossary.json` 은 `build_glossary.mjs` 생성물이다. 자동 대응은 세계 `meta.concepts` 의 개념 id 를 그 세계 `actors[].real` 의 영문 토큰과 맞춘다(`btree` ↔ "B-tree index", `route53` ↔ "Route 53"). 사람이 고칠 것은 `shared/glossary.overrides.json` 에만 적는다.

- 비유가 real 에 영문으로 드러나지 않으면 `links` 에 `{concept, world, actor, event?}` 를 더한다. `event` 는 검색 결과에서 먼저 열 사건이다. 그 세계 meta 에 없는 개념도 이렇게 걸 수 있다(예: 항구의 CoreDNS 안내소 → `dns`).
- 잘못 잡힌 자동 대응은 `unlinks`, 세계마다 다르게 적은 같은 개념 id 는 `merge`, 표시명은 `labels`, 한글 검색어는 `aliases`, 세계 간 비유 대응 설명은 `notes`.
- 세계 내용(actor real·사건)을 고친 뒤에는 `build_glossary` 를 다시 돌린다. 안 돌리면 `check_all` 이 stale 로 실패한다.

