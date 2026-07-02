# KMUST 외국인학생 현황 대시보드

외국인학생목록 엑셀 자료를 SQLite DB로 적재한 뒤, Next.js App Router 대시보드와 API에서 실제 학생 현황을 조회하는 운영자 화면입니다.

## 실행

```bash
npm install
npm run db:import
npm run dev
```

- 대시보드: `http://localhost:3000`
- 현황 분석: `http://localhost:3000/analytics`
- 주의 학생: `http://localhost:3000/attention`
- 요약 API: `GET /api/dashboard/summary`
- 학생 상세 API: `GET /api/students/:studentNo`

## 엑셀 DB 적재

루트의 `외국인학생목록.xlsx`를 기준으로 아래 명령을 실행하면 `data/kmust.sqlite`가 생성됩니다.

```bash
npm run db:import
```

적재 컬럼은 순번, 학번, 국적, 신편입 구분, 전형유형, 입학일자, 학년, 인정학기, 성별, 과정, 소속대학, 학과, 평균평점, 장학명, 학적상태, 보험기간, 어학자격, 어학연수 이수입니다. 엑셀 serial 날짜는 `YYYY-MM-DD`로 정규화합니다.

`data/kmust.sqlite`와 원본 엑셀은 개인정보 자료이므로 Git에 포함하지 않습니다. DB 파일이 없으면 앱은 익명 seed 데이터로 fallback됩니다.

## 검증

```bash
npm run lint
npm run build
```

대시보드, 현황 분석, 주의 학생 페이지는 동적 렌더링으로 설정되어 요청 시점의 SQLite DB를 조회합니다.
