# Backlog

미룬 것. 잊지 않기 위한 목록이며 우선순위 순이 아니다.

## Phase 4 이후

- 진도 · SKALA Knowledge · learning-state 연결 (D25 재검토 조건: 세계 10개 이상, 흐름이 굳은 뒤)
- 두 번째 세계관을 위한 `universe` 스킬 범용화 (사례가 둘 생기면)
- 모바일 대응
- 방문 통계
- 허브 자동 배치 (세계 20개 초과 시)
- 자동 시각 회귀 테스트
- 콘텐츠 다국어 (엔진 UI 교체 기능은 이미 있음)

## 원본 스킬 역반영 후보 (사용자 요청 시에만)

- 엔진 경로 참조 옵션 (`new_world --engine <path>`)
- style.css CSS 변수화
- 사건 `id` · `kind` 와 앵커 `#ev=&b=`
- `document.title` 자동화

## 콘텐츠

- CS 기초 지역(운영체제 · 프로세스 · 메모리). 비유 후보: 공장 · 공방
- 데이터 구역 확장 후보: 캐시(빠른 참고 열람실) · 메시지 큐(우체통 벨트) · Vector DB
- 사건 유형 빈칸 (2-8 측정, 2026-10-12, 세계 다섯 · 사건 21). 셋 미만 세계 셋(`db-library` · `network-layers` · `eks-security`)은 D27 에 따라 verified 유지, 보강은 Phase 4

  | 세계 | 사건 | normal | failure | scale | attack | recovery | revisit | tour | 유형 수 |
  |---|---|---|---|---|---|---|---|---|---|
  | `db-library` | 4 | 3 | · | · | · | 1 | · | · | 2 |
  | `network-layers` | 5 | 4 | · | · | · | · | · | 1 | 2 |
  | `k8s-harbor` | 4 | 2 | · | 1 | · | 1 | · | · | 3 |
  | `eks-security` | 4 | 3 | · | · | 1 | · | · | · | 2 |
  | `http-https` | 4 | 1 | 1 | · | 1 | · | 1 | · | 4 |
  | 합계 | 21 | 13 | 1 | 1 | 2 | 2 | 1 | 1 | |

  - 전체 21 중 normal 13(62%). failure · scale · revisit · tour 는 세계 하나씩뿐
  - 공격은 공항 · 우편 도시 둘, 복구는 도서관 · 항구 둘(이전 메모 "공격은 공항에만, 복구는 도서관에만"은 틀림)
  - 보강 후보: `db-library` 에 failure(잠금 대기 시간 초과·교착) 또는 scale, `network-layers` 에 failure(패킷 유실·재전송), `eks-security` 에 recovery 또는 failure(인증서 만료·IAM 거부)
  - 다시 재기: `node --input-type=module` 로 `lib.mjs` 의 `content()` · `kinds` 를 써서 세계별 `events[].kind` 를 센다

## 열어 둔 질문

- SKALA 세션에서 이 저장소 경로를 지정해 세계를 만드는 방식이 실제로 편한지
- network-layers 도메인 예외를 유지할지, 바이트 수를 다시 계산해 통일할지
