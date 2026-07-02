# KMUST 외국인학생 현황·출결 대시보드

외국인학생목록 엑셀 자료를 로컬 초기 매핑 검증에 사용하고, 학사 DB/API와 LMS/전자출결 API를 읽기 전용으로 연동할 수 있는 Next.js App Router 대시보드입니다. 저장소와 Vercel 배포에는 원본 엑셀을 포함하지 않습니다.

## 구현 범위

- 학생 현황: 국적, 학적상태, 소속, 학년, 장학, 보험, 어학자격 지표
- 수업·출결 현황: 오늘 수업, 출석, 지각, 결석, 학생별 출결 위험도
- 하네스 엔진: 수집, 스키마 검증, 정규화, 중복 검사, 품질 검사, 지표 생성, 위험도 산출, 게시 단계 기록
- 개인정보 최소화: 수업 담당자 정보는 저장·반환·화면 표시 대상에서 제외

## 실행

```bash
npm install
npm run dev
```

로컬 확인:

- 대시보드: `http://localhost:3000`
- 요약 API: `GET /api/dashboard/summary`
- 학생 상세: `GET /api/students/:studentNo`
- 학생 동기화: `GET|POST /api/integrations/students/sync`
- 수업 동기화: `GET|POST /api/integrations/classes/sync`
- 출결 동기화: `GET|POST /api/integrations/attendance/sync`

## 운영 환경변수

- `ACADEMIC_API_URL`: 학사 학생정보 API URL
- `LMS_CLASSES_API_URL`: LMS/전자출결 수업 API URL
- `LMS_ATTENDANCE_API_URL`: LMS/전자출결 출결 API URL
- `DATABASE_URL`: Neon Postgres 연결 문자열
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`: 세션·캐시용 Upstash Redis

API URL이 없으면 익명화된 `src/data/seed-students.json`과 샘플 수업·출결 데이터로 동작합니다. 실제 학생 데이터는 GitHub/Vercel에 커밋하지 말고 서버 환경변수 기반 API 연동으로만 사용합니다.

## 검증

```bash
npm run lint
npm run build
```

Vercel 배포 시 `vercel.json`의 Cron 설정이 학생 정보는 6시간마다, 수업 정보는 15분마다, 출결 정보는 5분마다 읽기 전용 동기화 검증 API를 호출합니다.
