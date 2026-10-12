# Horang Universe

기술 개념을 **장소·인물·사건이 있는 세계**로 바꿔 탐험하며 배우는 공개 학습 사이트다.
네트워크는 우편 도시, 쿠버네티스는 항구, 데이터베이스는 도서관처럼 각 주제가 하나의 세계이고,
세계들은 지역으로 묶여 허브 지도 위에 놓인다. 세계 사이에는 문이 있어 한 요청의 여정을 끝까지 따라갈 수 있다.

- 공개 주소: `https://zaehorang.github.io/horang-universe/` (Phase 1 완료 시 활성화)
- 데스크톱 브라우저 전용

## 로컬에서 열기

```bash
python3 -m http.server 8000      # 저장소 루트에서
# → http://127.0.0.1:8000/            허브
# → http://127.0.0.1:8000/worlds/<id>/ 세계 하나
```

허브는 `atlas.json`을 fetch 로 읽으므로 파일을 더블클릭해 열면 동작하지 않는다.

## 구조

| 경로 | 역할 |
|---|---|
| `index.html` | `worlds/hub/` 로 보내는 리다이렉트. 허브 본체는 `worlds/hub/index.html` |
| `worlds.json` | 등록부. 세계관만 아는 정보(지역·좌표·상태) |
| `atlas.json` | 생성물. 등록부 + 각 세계 `meta` 를 합친 허브용 색인 |
| `worlds/<id>/` | 세계 하나. `content.js` · `world.js` · `world.css` · 얇은 `index.html` |
| `shared/` | 공용 인물·예시 값 상수. 용어 사전은 Phase 2 예정 |
| `tooling/engine/` | 공용 엔진 정본. 모든 세계가 참조 |
| `tooling/vendor/` | GSAP · Pretendard · JetBrains Mono 로컬 복사본 |
| `tooling/scripts/` | 세계 생성 · 검사 · 색인 생성 |
| `docs/` | 설계·규칙·운영 문서. 작업 전 `docs/README.md` 부터 |

## 문서

설계와 규칙은 `docs/` 에, 진행 계획은 `docs/PLAN.md` 에 있다.
