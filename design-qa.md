# Design QA

## Source Visual Truth

- Reference: `/public/visuals-reference-sep2018-A3.pdf` (따뜻한 빈티지 성소 / 촛불 / 엽서·사진 콜라주, A3 단면)
- 이전 기준(reference): `/Volumes/halan/.../source-insurance-dashboard-reference.png` (electric/dark navy) — 더 이상 시각 기준 아님. design-qa 산출물은 보존용.
- Target implementation: KMUST 운영자 대시보드 전체 페이지 (대시보드·주의 학생·현황 분석)
- Viewport: 1540 x 1024
- State: dashboard monitor, `총괄보기`

## Checks

- The dashboard root exposes `data-visual-reference="votive-sanctuary-vintage"` (electric/insurance 기준값 제거).
- 배경은 따뜻한 베이지 한지 그라디언트 + 얇은 갈색 격자 + 종이 결·인쇄 스캔 결 + 하단 촛불 온기 글로우로 reference의 성소/콜라주 톤을 반영.
- 헤더·패널 타이틀은 세리프(KoSerif/Nanum Myeongjo 등 로컬 폴백), 본문은 한국어 가독성 sans. 다크/네이비·시안 글로우 일체 제거.
- 카드/패널은 얇은 종이 테두리(`#c9b187`계) + 아이보리 한지 표면 + inset 하이라이트로 엽서 표현. 도장/스탬프(`.status-stamp`)는 인증 상태·위험 등급에 사용.
- 인증 카드·차트 바는 적갈(`#a23a2e`)→촛불 황갈(`#d98a3a`)→밀짚(`#e8c46a`) 그라디언트로 electric 그라디언트를 대체.
- 데이터/상태/API/폴링 로직은 미변경. 색·텍스처·타이포그래피 레이어만 교체.

## Evidence

- 다크/시안 색 잔류 스캔(grep)으로 dashboard-monitor·attention·analytics에서 electric 톤 잔류 없음 확인.

## Findings

- No blocking visual issues found.
- The implementation intentionally preserves the KMUST operational layout and Korean dashboard content instead of copying the reference collage composition directly.

## Final Result

passed
