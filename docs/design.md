# Design

2026-10-12 시각 디자인 자문을 바탕으로 Phase 1-A(엔진 변수)·1-B(vendor)·1-D(허브)에 적용한 기록이다. 아래 이관 세계별 제안 중 화면으로 검증하지 않은 판단은 **확인 필요** 로 표시했다.

근거로 읽은 것: `docs/vision.md` `architecture.md` `decisions.md`(D2·D5·D6·D15) `engine-contract.md`, `tooling/engine/style.css`(색 리터럴 81개) · `index.html`, 다섯 세계의 `world.css` · `world.js` 색 사용, `iso.js` 의 `ISO.C` 18묶음, `worlds.json` 의 `regions[].tone`. 대비 값은 WCAG 2.x 상대 휘도 공식으로 계산했다.

---

## 1. 현재 진단

### 1.1 다섯 세계가 이미 공유하는 시각 언어

| 층 | 현재 모습 | 출처 |
|---|---|---|
| 지도(SVG) | 아이소메트릭 블록 일러스트. 상자 3면 음영(`ISO.C` 각 색 `[윗면, 왼면, 오른면]`), 장난감 디오라마 톤. 인물은 둥근 머리·사각 몸, 그림자 타원 | `iso.js` |
| 지도 팔레트 | 흙·풀·나무·벽·지붕 18묶음. 중채도 파스텔(`grass #b4dd93`, `sand #f3e4c2`, `wall #eef2f6`, `roofB #4f7aa6`, `roofR #e07a5f`) | `ISO.C` |
| 상태 색 | 세계마다 Tailwind 계열 리터럴을 직접 씀. 성공 `#16a34a`, 실패 `#dc2626`, 경고 `#a16207`/`#b45309`, 하늘색 창 `#8cc0ee`, 짙은 표 `#0f172a`+`#a5f3fc` | 다섯 `world.js` 공통 상위 10색 |
| 라벨 | 흰 반투명 바탕(`rgba(255,255,255,.92)`) 위 잉크 `#1d2b3a` 700 굵기. 큰 라벨은 네이비 바탕에 흰 글자 | `style.css .lbl` |
| 패널·버튼(겹 2·3) | 순백 `#fff` 카드, 연회색 `#f4f7fa`, 선 `#dde5ee`, 강조 `#2563eb`. 모서리 10–22px, 부드러운 그림자. 전형적인 SaaS 대시보드 분위기 | `style.css .panel .tip .events` |
| 자막(겹 1) | 짙은 네이비 `rgba(17,28,40,.94)` 위 흰 글자 17px/1.6. 점 진행표시 `#93c5fd` | `style.css .caption` |
| "실제로는?" | `#0f172a` 터미널 블록, 고정폭 12.5px, 녹색 `#86efac`, 주석 `#64748b` | `style.css .xr` |
| 글꼴 | Pretendard(CDN) + 시스템 고정폭. 굵기 500·600·700·800·900 다섯 단계 사용 | `style.css` |
| 바탕 | 세계마다 `--world-bg` 하나: 풀밭 `#a9d6a0` · 하늘 `#dcebf5` · 바다 `#7cc6d8` · 활주로 `#d9e8ef` · 종이 `#dfe9e4` | 각 `world.css` |

요약하면 **"장난감 블록 지도 + 깨끗한 흰 패널 + 네이비 자막"** 세 층이 이미 일관되고, 잉크 `#1d2b3a` 와 파랑 `#2563eb` 가 전체를 꿰고 있다. 이것은 자산이다. 바꿀 것은 톤이 아니라 **빈 곳과 어긋난 곳**이다.

### 1.2 세계관으로 묶였을 때 어색해질 지점

| # | 지점 | 왜 문제인가 | 근거 |
|---|---|---|---|
| P1 | **바탕색이 지역을 말하지 않는다** | `network-layers #dcebf5` 와 `eks-security #d9e8ef` 는 거의 같은 연하늘인데 지역이 다르다(네트워크 vs 운영). 허브에서 들어갔을 때 "지금 어느 지역인가"가 바탕으로 안 읽힌다 | 두 `world.css` |
| P2 | **허브 바다와 항구 바다가 같다** | `worlds.json` ops tone `#7cc6d8` = k8s-harbor 바탕. 허브(바다 위 섬들)와 항구 세계(바다 위 부두)가 같은 물색이면 층위가 뭉개진다 | `worlds.json`, `k8s-harbor/world.css` |
| P3 | 상태 색이 세계마다 리터럴 | 성공·실패·경고·"IP 표" 색이 다섯 세계에 흩어져 각자 적혀 있다. 한 세계가 `#15803d`, 다른 세계가 `#16a34a` 를 쓰는 식의 미세 편차가 이미 있다 | `world.js` 상위 색 집계 |
| P4 | 패널이 "지도책"이 아니라 "관리자 화면" | 순백 + Tailwind 회청색은 중립적이지만 탐험·지도 분위기가 없다. 지도는 따뜻한 장난감, 패널은 차가운 도구라 두 층이 서로 다른 제품처럼 보인다 | `style.css .panel` |
| P5 | **대비 미달 네 곳** (엔진 고정 요소) | `.btn` 흰 글자/`#3b82f6` **3.68**, `.now` `#16a34a`/흰 **3.30**, `.myth b` `#d97706`/`#fff7ed` **3.00**, `.xr .c` 주석 `#64748b`/`#0f172a` **3.75**. 본문 기준 4.5 미달 | 계산값 |
| P6 | 다섯 세계가 똑같이 라벨 크기를 덮어쓴다 | `.lbl text{font-size:16.5px}` 가 다섯 `world.css` 모두에 있다. 엔진 기본값이 틀렸다는 뜻 | 각 `world.css` |
| P7 | 사건 패널 폭을 세계가 바꾼다 | `network-layers` 가 `.events{width:470px}` 와 2열 그리드로 "읽는 법"을 건드린다. D5(읽는 법 고정)에 어긋나는 선례 | `network-layers/world.css` |
| P8 | 이름 색 셋이 흰 바탕과 짙은 바탕 두 벌로 하드코딩 | 패널(흰)·자막(짙음) 두 문맥에 각각 3색. 변수가 없어 허브 패널·문 버튼·검색 결과에 같은 규칙을 다시 적어야 한다 | `style.css .n-o .n-c .n-a` |
| P9 | `--coral #ff7a59` 가 선언만 있고 쓰이지 않는다 | 비워진 자리. 허브의 "현재 위치" 색으로 쓰기 좋다 | `style.css :root` |

---

## 2. 디자인 방향: **「탐험가의 지도책」(Explorer's Atlas)**

### 2.1 한 줄

> 세계는 **색 있는 블록 디오라마**로 두고, 그것을 감싸는 모든 읽기 장치(패널·자막·허브 바다·검색칸)는 **한 사람의 지도책**처럼 종이·잉크·나침반 파랑 셋으로 통일한다.

### 2.2 왜 이 방향인가

1. **이미 있는 것을 버리지 않는다.** 아이소메트릭 블록, 잉크 네이비, 파랑 강조는 다섯 세계에 깔려 있다. 방향은 이 셋에 "종이"라는 네 번째 재료를 더해 묶는 것이다. 재그리기 없이 CSS 변수 값만으로 도달한다.
2. **지도책은 "지역 → 세계 → 장면"의 층위를 자연스럽게 설명한다.** 지도책의 한 장(허브)에 섬들이 있고, 섬을 펼치면 도시 지도(세계)가 나오고, 그 안의 한 사건을 손가락으로 따라간다. vision.md 의 학습 흐름 1→5 와 정확히 같다.
3. **D2(지리 계열 지역)·D6(허브도 엔진으로)의 시각 귀결이다.** 지역이 해안·항만·구역이면 허브는 해도(海圖)여야 하고, 그 해도는 세계와 같은 블록 엔진으로 그리되 **물색을 한 단계 깊게** 해 층위를 만든다(P2 해결).
4. **공개 사이트의 완성도는 "절제"에서 온다.** 패널은 순백 대신 아주 옅은 종이색, 강조는 파랑 하나, 상태 색은 성공·경고·위험 셋으로 고정. 세계가 아무리 화려해도 읽는 장치가 조용하면 전체가 하나로 보인다.

### 2.3 규칙 다섯

| 규칙 | 내용 |
|---|---|
| 재료 넷 | **잉크** `#1d2b3a` · **종이** `#fbfaf7` · **나침반 파랑** `#2563eb` · **바다** `#5fb0c8`. 이 넷 밖의 색은 지도(SVG) 안이나 상태 의미(성공·경고·위험)에서만 나온다 |
| 두 층 | 지도 층은 세계가 소유(색·질감 자유). 읽기 층은 엔진이 소유(세계가 바꾸는 변수는 바탕·땅·강조·질감 다섯만) |
| 한 강조 | 세계는 `--acc` 를 바꿀 수 있지만 **파랑 계열 안에서만**(색상 200–230°). 이름 색 "파랑=공식"과 충돌하지 않게 |
| 질감은 선으로 | 그라디언트·사진 대신 **점선·해치·물결선** 같은 선 질감. 종이 지도책 느낌이면서 SVG 로 가볍다 |
| 깊이는 그림자 둘 | 떠 있는 카드 `shadow-1`, 모달·패널 `shadow-2`. 그 외 그림자 없음 |

---

## 3. CSS 변수 체계

### 3.1 소유권

| 구분 | 변수 | 누가 정하나 |
|---|---|---|
| **엔진 고정** (읽는 법) | 잉크·종이 표면·선·강조 파생·상태·짙은 층·이름 색·모양·글꼴 | `style.css :root`. 세계는 바꾸지 않는다. 세계 `world.css` 의 어느 규칙 블록에서든 허용된 다섯 변수 밖을 선언하면 `check_world` 경고 대상(engine-contract.md) |
| **세계 개방** (보이는 것) | `--world-bg` `--world-bg-deep` `--world-ground` `--world-texture` `--acc`(파랑 계열 안) | `world.css :root` 에서 덮어쓴다 |
| 허브 전용 | `--sea` `--sea-deep` `--shore` | `worlds.json` 의 `hub` 값이 정본. 허브 index 로더가 `atlas.json` 을 fetch 해 넣은 `window.ATLAS` 를 `WORLD.build(api)` 가 읽어 CSS 변수로 설정 |

### 3.2 변수 표 (확정 제안)

기존 이름 `--ink` `--ink2` `--card` `--card2` `--line` `--acc` `--acc-w` `--ok` `--warn` `--coral` `--sans` `--mono` `--world-bg` 는 **그대로 유지**해 세계 쪽 깨짐이 없게 하고, 부족한 것만 더한다.

**바탕·표면 (엔진 고정)**

| 변수 | 값 | 쓰는 곳 | 대비 |
|---|---|---|---|
| `--ink` | `#1d2b3a` | 본문·라벨·제목, 큰 라벨 바탕(`.lbl.big`) | 종이 위 13.79 |
| `--ink2` | `#4d5e70` | 보조 글(kicker·small·`.talk .what`) | 종이 위 **6.39** (이전 `#5a6b7d` 5.48 → 상향) |
| `--ink3` | `#7a8794` | 예약값. 현재 어느 규칙도 쓰지 않는다 (본문 금지) | 종이 위 3.52 |
| `--card` | `#fbfaf7` | 패널·팁·사건 패널·인트로 카드(현재 `#fff`) | — |
| `--card2` | `#f3f1ea` | 패널 안 칸(`.talk` `.steps li` `.legend`)(현재 `#f4f7fa`) | — |
| `--line` | `#e3dfd3` | 테두리(현재 `#dde5ee`) | — |
| `--glass` | `rgba(251,250,247,.9)` | 브랜드·pill·사건 패널의 반투명 바탕 | — |

**강조·상태 (엔진 고정)**

| 변수 | 값 | 쓰는 곳 | 대비 |
|---|---|---|---|
| `--acc` | `#2563eb` | 링크선·강조·단계 번호 바탕·`.btn` 바탕(현재 `#3b82f6` → 통일) | 흰 글자 5.17 (P5 해결) |
| `--acc-ink` | `#1d4ed8` | 종이 위 **글자**로 쓰는 강조(`.p-real` `.tip-real`) | 6.42 |
| `--acc-w` | `#e6efff` | 강조 옅은 바탕(`.tip-more`) | 위에 `--acc-ink` 5.79 |
| `--ok` | `#15803d` | 성공 글자·`.now`·완료 체크(이전 `#16a34a` → 상향) | 종이 위 4.81 (P5 해결) |
| `--ok-w` | `#e7f6ec` | 성공 옅은 바탕 | — |
| `--warn` | `#b45309` | 경고 글자·`.myth b`(현재 `#d97706` → 상향) | `#fff7ed` 위 4.73 (P5 해결) |
| `--warn-w` | `#fff7ed` | 경고 옅은 바탕 | — |
| `--danger` | `#b91c1c` | 실패·차단 글자. 지도 안의 `#dc2626` 은 세계 몫이지만 패널 글자는 이것 | 종이 위 6.20 |
| `--danger-w` | `#fef2f2` | 실패 옅은 바탕 | 위에 `--danger` 5.91 |
| `--coral` | `#ff7a59` | **허브 "현재 위치" 전용**. 글자로 쓰지 않는다(P9) | — |

**짙은 층: 자막·"실제로는?"·이름 툴팁 (엔진 고정)**

| 변수 | 값 | 쓰는 곳 | 대비 |
|---|---|---|---|
| `--dark` | `#13202c` | 자막 바탕(`.caption`, 불투명) | — |
| `--dark2` | `#0f172a` | 터미널 블록 `.xr`, 열린 `.realbtn`, `.ntip` | — |
| `--dark-ink` | `#f4f6f8` | 짙은 층 본문, `.chip` 글자(`.chip` 테두리는 `--ink2`) | 15.26 |
| `--dark-ink2` | `#c9d3df` | 짙은 층 보조 글(`.auto` `.xr .xl`) | 10.91 |
| `--dark-ink3` | `#8b9bb0` | 짙은 층 흐린 글(`.cap-x`, `.xr .c` 주석; 현재 `#64748b` → 상향) | `#0f172a` 위 6.30 (P5 해결) |
| `--dark-line` | `#3b4a5c` | 점 진행표시 꺼진 점 | — |
| `--dark-ok` | `#86efac` | 터미널 성공 글자 | 11.77 |

**이름 색 셋 (엔진 고정 · 세계 변경 금지)**

의미가 고정이므로 값도 고정한다. 흰 종이용과 짙은 층용 두 벌을 변수로 둬 허브 패널·문 버튼·검색 결과가 같은 규칙을 재사용하게 한다(P8).

| 의미 | 종이 위 | 대비(`#fbfaf7`) | 짙은 층 위 | 대비(`#13202c`) | 글자 처리 |
|---|---|---|---|---|---|
| 공식 용어 `--name-official` | `#2563eb` | 4.95 | `--name-official-dark` `#93c5fd` | 9.16 | 700 |
| 직접 지은 이름 `--name-custom` | `#b45309` | 4.81 | `--name-custom-dark` `#fde68a` | 13.27 | 700 |
| 자동 생성 `--name-auto` | `#64748b` | 4.56 | `--name-auto-dark` `#94a3b8` | 6.45 | 400 italic (Pretendard 는 vendor 에 400 면이 없어 500 면으로 그린다) |

접근성 메모: 셋은 색상(파랑·주황노랑·무채색)으로 구분하며, 자동 생성 이름에는 400 굵기(실제로는 vendor 의 500 면)와 기울임을 더한다. 공식 용어와 직접 지은 이름은 모두 700 굵기이므로 이름의 문맥·범례도 함께 읽어야 한다. 이름 색은 **항상 종이 또는 짙은 층 위에서만** 쓰고 세계 바탕(SVG) 위에 직접 올리지 않는다는 규칙이 "어떤 세계 바탕에서도 구분"을 보장한다. 지도 라벨은 이미 흰 라벨 상자 위에 있어 이 규칙을 만족한다.

**모양·그림자·글꼴 (엔진 고정)**

| 변수 | 값 |
|---|---|
| `--radius-s` | `10px` (칩·칸·입력) |
| `--radius-m` | `14px` (팁·사건 버튼·터미널 블록) |
| `--radius-l` | `20px` (패널 카드·인트로·도움말) |
| `--shadow-1` | `0 6px 24px rgba(11,42,58,.12)` (떠 있는 카드·pill·브랜드) |
| `--shadow-2` | `0 24px 60px rgba(11,42,58,.22)` (패널·모달) |
| `--sans` | `"Pretendard",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif` |
| `--mono` | `"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace` (6절 참조) |

**세계 개방 변수**

| 변수 | 기본값 | 뜻 |
|---|---|---|
| `--world-bg` | `#5fb0c8` | 무대 바깥·`#bg` 채움. 기본값은 독립 세계의 무대 대체색. 세계는 반드시 덮어쓴다 |
| `--world-bg-deep` | `#3f8fab` | 엔진 `#worldBgGrad` 의 바탕 그라디언트 아랫단. `#bg` 가 이 그라디언트를 사용한다 |
| `--world-ground` | `#b4dd93` | 땅 윗면 기준색. `ISO.C.grass[0]` 과 같다. iso.js 가 읽지는 않고(그리기 도우미는 JS 색), 문서화와 허브 섬 색 동기용 |
| `--world-texture` | `none` | `#bgTexture` 가 소비하는 바탕 위 질감. 엔진 `index.html` 의 `url(#tex-dots)` `url(#tex-waves)` `url(#tex-paper)` `url(#tex-hatch)` 중 하나 |
| `--acc` | `#2563eb` | 세계가 바꿀 수 있으나 색상 200–230° 파랑 안에서만 |

### 3.3 리터럴 81개의 이동 규칙

| 현재 리터럴 | 갈 곳 |
|---|---|
| `#1d2b3a` `#111c28` `#0f172a` `#1e293b` | `--ink` `--dark` `--dark2` |
| `#fff` `#f4f7fa` `#f8fafc` `#f1f5f9` `#dde5ee` `#cbd5e1` | `--card` `--card2` `--line` |
| `#2563eb` `#3b82f6` `#93c5fd` `#60a5fa` `#bfdbfe` `#e6efff` | `--acc` `--acc-ink` `--acc-w` `--name-official-dark`; 점 진행표시 켜진 점은 `--name-official-dark`, 지나간 점은 `#60a5fa` → `color-mix(in srgb, var(--acc) 70%, white)` 으로 구현했다(`.dots i.past` · `.dots button.past`) |
| `#16a34a` `#86efac` `#dc2626` `#d97706` `#fff7ed` | `--ok` `--dark-ok` `--danger` `--warn` `--warn-w` |
| `#e2e8f0` `#cbd5e1` `#94a3b8` `#64748b` `#475569` `#3b4a5c` `#334155` | `--dark-ink` `--dark-ink2` `--dark-ink3` `--dark-line`; `#334155`(팁 본문)은 `--ink` |
| `rgba(255,255,255,.88~.92)` | `--glass` |
| `rgba(11,42,58,…)` 그림자 다섯 종 | `--shadow-1` `--shadow-2` 둘로 |
| `#fff6b0`(glow) `#0b2a3a`(soft 필터) | defs 안 리터럴 유지. 지도 층 |

---

## 4. 지역 셋의 톤

지역 톤은 **"땅 윗면 색"으로 읽힌다.** 허브에서는 섬의 윗면, 세계 안에서는 `--world-bg` 또는 땅 평면이 이 색 계열이어야 한다. `worlds.json` 의 `tone` 은 아래 `기준` 값으로 바꾼다.

| 지역 | 기준 `tone` | 깊은 색(`-deep`) | 보조색 | 잉크 대비 | 등록부 `texture`·질감 키워드 | 세계가 움직일 수 있는 범위 |
|---|---|---|---|---|---|---|
| `network` 네트워크 해안 | `#a9d6a0` 풀밭 | `#8dbd6f` | 모래 `#f3e4c2`, 연하늘 `#dcebf5`, 우편 노랑 `#f7c948` | 9.5 | 잔디 점무늬(`#tex-dots`), 점선 도로, 우편함 노랑 | 색상 95–125°(연두~풀색), 명도 L 78–92. 연하늘은 **하늘로만**(바탕 그라디언트 윗단) 쓰고 땅은 풀색 |
| `ops` 운영 항만 | `#7cc6d8` 바다 | `#5eb3c9` | 콘크리트 `#d5dbe1`, 크레인 코랄 `#e07a5f`, 컨테이너 네이비 `#2e4a6b` | 7.5 | 잔물결(`#tex-waves`), 컨테이너 줄무늬, 활주로 점선 | 색상 185–205°(청록~하늘), 명도 L 70–88. 바다 위면 `#7cc6d8`, 땅 위면 콘크리트 `#d5dbe1`~`#cfdde3` |
| `data` 데이터 구역 | `#e3e8df` 종이 | `#cdd3c8` | 나무 `#cfa06b`, 책등 `#7f1d1d`, 서가 베이지 `#ece3cf` | 11.6 | 종이결 가로줄(`#tex-paper`), 서가 줄, 나무 결 | 색상 80–110° 저채도 또는 무채 웜그레이, 명도 L 86–93. 채도 S 15% 이하 |

`regions[].texture` 는 허브가 읽는 지역 질감의 정본이다. `network` 는 `dots`, `ops` 는 `waves`, `data` 는 `paper` 를 쓴다. 세계의 `world.css` 질감 선택은 별도로 이관한다.

세 지역을 나란히 놓으면 **풀(초록) · 물(청록) · 종이(회백)** 로 색상·채도가 모두 다르다. 허브에서 섬 셋이 한눈에 갈라지고, 세계 안에서는 바탕이 "지금 어느 지역"을 말한다(P1 해결).

지역 안의 구분은 **바탕 명도와 지붕/구조물 색**으로 한다. 예: 네트워크 해안의 우편 도시(풀 `#a9d6a0`, 지붕 파랑)와 층층 우체국(하늘→풀 그라디언트, 지붕 코랄). 운영 항만의 항구(바다 `#7cc6d8`, 코랄 크레인)와 공항(콘크리트 `#cfdde3`, 네이비 관제탑).

허브 공통(지역 바깥):

| 요소 | 값 |
|---|---|
| 바다 `--sea` | `#5fb0c8` (항구 세계 `#7cc6d8` 보다 한 단계 깊음 → P2 해결). 잉크 대비 5.85 |
| 깊은 바다 `--sea-deep` | `#3f8fab` (화면 아래로 그라디언트) |
| 해안선 `--shore` | `#efe2c0` 모래 테 |
| 현재 위치 `--here` | `#ff7a59` (= `--coral`) |

---

## 5. 허브 지도의 시각 언어

전부 `ISO.box` `ISO.flat` `ISO.person` `ISO.paper` `ISO.label` 로 그릴 수 있는 범위다.

| 요소 | 모양 | 색 |
|---|---|---|
| **바다** | `#bg` 를 `--sea → --sea-deep` 세로 그라디언트. 잔물결은 허브 `world.css` 의 `--world-texture:url(#tex-waves)` 로 엔진 패턴(흰 물결선, 불투명도 .3)을 쓴다 | `#5fb0c8` → `#3f8fab`, 물결 `#ffffff` |
| **섬(지역)** | `ISO.box` 두 겹: 바깥 모래 테(`--shore`), 안쪽 지역 톤. 높이 18의 단면이 "대지"로 보인다. 섬 윗면 질감은 `regions[].texture` 패턴을 불투명도 .5 오버레이로 덮는다 | 모래 `#efe2c0`, 윗면 `tone`, 측면 `tone-deep` |
| **지역 이름** | 섬 위쪽에 `.lbl.big`(`--ink` 바탕 `--card` 글자 18px). 섬을 누르면 `hint` 가 지역 말풍선·패널에 나온다 | 바탕 `#1d2b3a`, 글자 `#fbfaf7` (13.79) |
| **건물(세계)** | `ISO.box` 몸체와 지붕. 몸체는 `ISO.C.wall`, 지붕은 세계 `meta.hubColor` 또는 지역 `toneDeep` 색. 아래에 세계 이름 라벨을 둔다. `logo` 간판은 아직 없다 | 벽 `#eef2f6` 계열, 지붕은 세계·지역 색(아래 세계별 지붕색 표) |
| **건물 hover** | `.hub-building:hover` 에 흰빛 드롭섀도를 준다. 엔진 `ISO.addHitAreas` 의 `.hit` 점선 테두리(`style.css` `.act:hover > .hit`)도 함께 보인다. hover 힌트 글은 아직 없다 | 빛 `#fff6b0` |
| **길** | 지역 안 건물 사이: 점선 도로 `stroke #ffffff` 불투명도 .7, 폭 4. 지역 사이(문): 바다 위 **항로** 점선 `stroke-dasharray 2 10` 불투명도 .8, 양 끝에 작은 부표 원 `--acc` | 길 `#ffffff`, 부표 `#2563eb` |
| **공사 중(draft)** | 건물 대신 `ISO.box` 높이 10의 해치 기초 블록, `ISO.person({hard:true})` 안전모 인물, `ISO.paper` 의 "공사" 표지판을 둔다. 점선 테두리와 별도 "준비 중" 배지는 아직 없다 | 해치 `#c8d0d8`/`#7a8794` |
| **archived** | 그리지 않는다(D17) | — |
| **세계 수 알약** | 검색칸 아래 `top:70px` 가운데 `#hubCount` 알약 "지역 N · 세계 N". `--glass` 바탕, 12px `--ink2` | 위 변수 |
| **검색칸** | 화면 상단 가운데 고정, 폭 `min(520px, 36vw)`, 높이 44, `--glass` 바탕, `--radius-l`, `--shadow-1`, 포커스 시 `--acc` 2px 외곽선. 플레이스홀더 "개념을 치면 그 세계로 (예: Ingress, DNS, 정문)", 사전을 읽는 동안·실패 시 비활성. **결과 목록**은 검색칸 바로 아래 `--card` 바탕 `--radius-m` `--shadow-2`, 최대 높이 `min(420px, 60vh)`, 개념 8개까지. 개념 줄: 파랑 공식 이름(`.n-o`) + 오른쪽 "세계 N곳" 또는 세계 이름 + 있으면 비유 대응 설명(12px `--ink2`). 그 아래 자리 줄: 세계 이름(`--ink2`) + 노랑 비유 이름(`.n-c`) + draft 세계면 "공사 중" 점선 알약(11px `--ink2`, `--card2` 바탕) + 오른쪽 "사건 · n장면"(없으면 "세계 입구"). 고른 줄은 `--card2` 바탕에 `--acc` 왼쪽 띠 3px. **건물 강조**: 결과가 가리키는 건물에 흰빛 드롭섀도, 나머지 건물은 불투명도 .45. 줄에 올라가면(↑↓·마우스) 그 줄의 건물만 강조. 줄을 고르면(클릭·Enter) 건물에 코랄 빛을 준 뒤(0.42초, 움직임 줄이기면 즉시) 세계 앵커로 이동한다 — 개념 줄은 그 개념의 첫 자리로, 아무 줄도 고르지 않은 채 친 Enter 는 첫 개념의 첫 자리로 간다. 키보드 ↑↓ · Enter · Esc(목록 닫기 → 한 번 더 누르면 지우기). **스크린리더**: combobox + listbox(group/option), 활성 줄 `aria-activedescendant` · `aria-selected="true"`, 검색칸 안 시각적으로 숨긴 `role=status` 가 "개념 n개 · 자리 m곳" 또는 "결과 없음"을 알린다 | 위 변수, 강조 빛 `#fff6b0`, 이동 빛 `#ff7a59` |
| **현재 위치** | 허브: 마지막으로 다녀온 세계 건물 앞에 `ISO.person({body:"#ff7a59"})` 한 명 + 건물 위 코랄 핀(반지름 12 호 + 뾰족 끝). 세계 안: 브랜드 아래 `top:82px` 의 **길 표시** 칩 "◂ 허브 · 운영 항만 · 쿠버네티스 항구" — 글자 `--ink`, `--glass` 바탕. 사건 재생 중(`body.in-event`)에는 확대 장면의 라벨을 가리지 않게 `visibility:hidden` 으로 숨겨 마우스·키보드 포커스 모두 받지 않는다. 그동안 허브로 돌아가는 길은 사건을 닫은 뒤에만 보인다 | 핀·인물 `#ff7a59` |
| **문 버튼**(세계 패널 아래) | `--card2` 바탕에 **상대 지역 톤 왼쪽 세로띠 4px**와 둥근 모서리. 글자 "이 금고 안은 → 데이터베이스 도서관" | 띠 = 상대 `tone`, 글자 `--ink` |

**세계별 지붕색** (content.js `meta.hubColor`. 세계 지도 안 대표 건물 지붕이나 상징 구조물 색을 그대로 쓴다)

| 세계 | 지역 | 지붕 | 근거 |
|---|---|---|---|
| `http-https` 우편 도시 | network | `#4f7aa6` 파랑 | 가게 건물 지붕 `ISO.C.roofB` |
| `network-layers` 층층 우체국 | network | `#e07a5f` 코랄 | 빌딩 지붕 `ISO.C.roofR` |
| `k8s-harbor` 쿠버네티스 항구 | ops | `#e07a5f` 코랄 | 크레인 코랄 |
| `eks-security` EKS 보안 공항 | ops | `#2e4a6b` 네이비 | 관제탑·컨테이너 네이비 |
| `db-library` 데이터베이스 도서관 | data | `#7f1d1d` 책등색 | 서가 책등 |

같은 지역 안에서는 지붕색이 겹치지 않는다. 코랄은 network-layers 와 k8s-harbor 가 함께 쓰지만 지역(섬)이 달라 허브에서 구분된다.

좌표: `worlds.json` 의 `pos` 가 섬 중심이다. 현재 섬은 정사각형이며 한 변은 `max(190, 140 + 세계 수 × 45)`이다. 건물 좌표는 등록부에서 수동 지정한다(D18).

---

## 6. 글꼴

| 항목 | 결정 | 이유 |
|---|---|---|
| 본문 | **Pretendard 유지** | 한국어 가독성·굵기 폭·OFL. 다섯 세계가 이미 쓴다 |
| 본문 굵기 | vendor 에 **500 · 700 · 800** 세 굵기 | 600→700, 900→800 로 접었다. Pretendard dynamic-subset WOFF2 276개를 배치했다 |
| 서브셋 | Pretendard 1.3.9 의 **dynamic-subset**(unicode-range 분할 CSS) | 세 굵기 파일을 선별해 `pretendard.css` 로 연결했다. WOFF2 전체 약 3.9MB |
| 고정폭 | **JetBrains Mono 400 · 700** 두 굵기 vendor(OFL) | 플랫폼 간 터미널 글꼴을 통일한다. 두 WOFF2 합계 약 188KB |
| 고정폭 굵기 매핑 | 600→400, 800→700 | `.lbl .real` 600 은 700 으로, `.p-real`·`.tip-real` 600 은 400 으로, `.envt .sgn` 등 세계의 800 은 700 으로 |
| 대안 | D2Coding 은 한글 고정폭이 필요해질 때만 | 지금 고정폭에 한글이 들어가는 곳은 세계 전용 셀렉터 몇 개뿐 |
| 크기 바닥 | 패널 본문 13.5px, 자막 17px, 터미널 12.5px, SVG 라벨 **16.5px 를 엔진 기본으로**(P6) | 1120×700 창에서 라벨 12px 이상 보장 |

---

## 7. 기존 세계 이관 시 영향

| 세계 | 지역 | 현재 `--world-bg` | 바꿀 것 | 지킬 것 |
|---|---|---|---|---|
| `http-https` 우편 도시 | network | `#a9d6a0` | `#bg{fill:#a9d6a0}` 리터럴 → `var(--world-bg)`; `.idx .warnt .certx` 의 `#dc2626 #b91c1c` → `var(--danger)`; `.lbl text` 크기 덮어쓰기 삭제; `--world-texture: url(#tex-dots)` | 바탕값 그대로(지역 기준색과 동일). 봉인 금색 `#eab308`·`#facc15`(TLS 봉인 의미)와 주황 `#b45309` 메모 색은 세계 의미색이라 유지 |
| `network-layers` 층층 우체국 | network | `#dcebf5` | `skyGrad` stop 을 `--world-bg`(윗단 `#dcebf5`)·`--world-bg-deep`(아랫단은 풀색 `#a9d6a0` 으로 바꿔 땅이 지역색으로 읽히게, **확인 필요**: 현재 아랫단 `#eef6fb`); `.events{width:470px}` 2열 그리드는 엔진에 "사건 5개 이상이면 2열" 규칙으로 올리고 세계에서 제거(P7); `.lbl` 크기 삭제 | 층 번호·방 태그의 잉크 네이비, 바이트 수 글자 `#67e8f9`(비트 색) 유지 |
| `k8s-harbor` 쿠버네티스 항구 | ops | `#7cc6d8` | `seaGrad` stop → `--world-bg #7cc6d8` · `--world-bg-deep #5eb3c9`; `.stamp.on` `#dc2626` 글자 → `var(--danger)`; `.iptag` 짙은 표 `#0f172a`/`#a5f3fc` 는 공항과 공유되므로 엔진에 `.tag-dark` 공용 셀렉터로 승격 후 세계에서 제거; `--world-texture: url(#tex-waves)` | 바탕값 그대로(지역 기준색). 허브 바다 `#5fb0c8` 와 한 단계 차이가 생겨 허브→항구 진입이 "가까이 다가온" 느낌으로 읽힌다. 크레인 코랄·케이블 시안 `#22d3ee` 유지 |
| `eks-security` EKS 보안 공항 | ops | `#d9e8ef` | **적용됨**: `--world-bg #cfdde3` · `--world-bg-deep #b8c9d0` 콘크리트 청회색(이전 값은 network-layers 하늘과 거의 같아 지역이 뒤바뀌어 보임, P1), `#bg` 리터럴 삭제, `--world-texture: url(#tex-waves)`. 콘크리트만으로는 "항만"으로 읽히지 않아 world.js `L.base` 에 앞쪽 두 가장자리 바다 띠 `#7cc6d8` 와 잔물결을 추가. `ISO.C.conc` 활주로 확장은 하지 않음(바다 띠로 지역이 읽혀 불필요). `.iptag` → 엔진 `g.tag-dark`; `.lbl` 크기 삭제. 허브 지붕 `hubColor #2e4a6b`(네이비 관제탑) | 보안 상태 색(차단 `#dc2626`, 통과 `#16a34a`, 심사 노랑 `#facc15`)은 지도 안 의미색으로 유지 |
| `db-library` 데이터베이스 도서관 | data | `#dfe9e4` | `api.bg.setAttribute("fill","#dfe9e4")` JS 리터럴 제거 → CSS 변수에 맡김; 기준 `#e3e8df` 로 미세 조정(채도 더 낮게, 종이 느낌); `--world-texture: url(#tex-paper)`; `.lbl` 크기 삭제 | 나무 서가 `ISO.C.wood`, 책등 `#7f1d1d`, 성공 `#16a34a` 15회는 지도 안 상태 표식이라 유지. 단 패널 글자로 나오는 성공색은 엔진 `--ok` 로 |

공통: 다섯 `world.css` 의 `.lbl text{font-size:16.5px}` `.lbl.big text{18px}` 를 전부 지우고 엔진 기본으로 올린다. 다섯 `world.js` 의 `#16a34a` `#dc2626` 는 **지도 안 의미색이므로 손대지 않는다**(변수화 대상은 `style.css` 81개뿐).

---

## Phase 1-A 에서 바로 적용할 변수 표

`tooling/engine/style.css` 맨 위 `:root` 를 아래로 바꾸고, 본문의 리터럴을 3.3 절 규칙대로 치환한다. 세계는 `world.css :root` 에서 "세계 개방" 묶음만 덮어쓴다.

```css
/* ── Horang Universe 엔진 변수 · 「탐험가의 지도책」 ──
   세계는 '세계 개방' 묶음만 world.css :root 에서 덮어쓴다. 나머지는 읽는 법이라 고정. */
:root{
  /* 잉크 · 종이 (엔진 고정) */
  --ink:#1d2b3a;  --ink2:#4d5e70;  --ink3:#7a8794;
  --card:#fbfaf7; --card2:#f3f1ea; --line:#e3dfd3;
  --glass:rgba(251,250,247,.9);

  /* 강조 · 상태 (엔진 고정) */
  --acc:#2563eb;  --acc-ink:#1d4ed8; --acc-w:#e6efff;
  --ok:#15803d;   --ok-w:#e7f6ec;
  --warn:#b45309; --warn-w:#fff7ed;
  --danger:#b91c1c; --danger-w:#fef2f2;
  --coral:#ff7a59;                      /* 허브 '현재 위치' 전용, 글자 금지 */

  /* 짙은 층: 자막 · 실제로는? · 이름 툴팁 (엔진 고정) */
  --dark:#13202c; --dark2:#0f172a;
  --dark-ink:#f4f6f8; --dark-ink2:#c9d3df; --dark-ink3:#8b9bb0;
  --dark-line:#3b4a5c; --dark-ok:#86efac;

  /* 이름 색 셋 (의미 고정 · 세계 변경 금지) */
  --name-official:#2563eb; --name-official-dark:#93c5fd;   /* 파랑 = 공식 용어, 700 */
  --name-custom:#b45309;   --name-custom-dark:#fde68a;     /* 노랑 = 직접 지은 이름, 700 */
  --name-auto:#64748b;     --name-auto-dark:#94a3b8;       /* 회색 = 자동 생성, 400 italic */

  /* 모양 · 그림자 · 글꼴 (엔진 고정) */
  --radius-s:10px; --radius-m:14px; --radius-l:20px;
  --shadow-1:0 6px 24px rgba(11,42,58,.12);
  --shadow-2:0 24px 60px rgba(11,42,58,.22);
  --sans:"Pretendard",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",sans-serif;
  --mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;

  /* 세계 개방 — world.css 가 덮어쓴다. 기본값은 독립 세계의 무대 대체색 */
  --world-bg:#5fb0c8;        /* 무대 바탕 · #bg 채움 */
  --world-bg-deep:#3f8fab;   /* 바탕 그라디언트 아랫단 */
  --world-ground:#b4dd93;    /* 땅 윗면 기준색 (= ISO.C.grass[0]) */
  --world-texture:none;      /* url(#tex-dots) | url(#tex-waves) | url(#tex-paper) | url(#tex-hatch) | none */
}

/* 지역 톤과 바다색은 엔진에 중복 선언하지 않는다.
   허브는 atlas.json 의 regions[].tone/toneDeep, hub.sea/seaDeep/shore 를
   WORLD.build(api) 에서 CSS 변수로 설정한다. 세계 템플릿은 생성 시 지역 값을 기록한다. */
```

`worlds.json` 갱신값: `network.tone #a9d6a0`(유지) · `ops.tone #7cc6d8`(유지) · `data.tone #e3e8df`(`#dfe9e4` 에서 미세 조정). 허브 바다와 지역 톤은 `worlds.json` 이 정본이며, 허브 index 로더가 fetch 한 `atlas.json` 을 `window.ATLAS` 로 넘기면 `WORLD.build(api)` 가 CSS 변수로 설정한다(위 블록의 주석은 엔진 `style.css` 원문 그대로다).
