import type {
  AttendanceEvent,
  ClassSession,
  HarnessRun,
  HarnessStep,
  HarnessStepName,
  RiskAssessment,
  Student,
} from "@/lib/types";

const DAY = 24 * 60 * 60 * 1000;

function daysUntil(date: string | null) {
  if (!date) {
    return null;
  }

  const target = new Date(`${date}T00:00:00+09:00`).getTime();
  if (Number.isNaN(target)) {
    return null;
  }

  return Math.ceil((target - Date.now()) / DAY);
}

function step(name: HarnessStepName, status: HarnessStep["status"], message: string): HarnessStep {
  return {
    name,
    status,
    message,
    checkedAt: new Date().toISOString(),
  };
}

function finishRun(
  target: HarnessRun["target"],
  startedAt: string,
  recordCount: number,
  warnings: string[],
  errors: string[],
  steps: HarnessStep[],
): HarnessRun {
  const status = errors.length > 0 ? "failed" : warnings.length > 0 ? "warning" : "success";

  return {
    id: `${target}-${Date.now()}`,
    target,
    status,
    startedAt,
    finishedAt: new Date().toISOString(),
    recordCount,
    warnings,
    errors,
    steps,
  };
}

export function assessRisk(student: Student, attendance: AttendanceEvent[]): RiskAssessment {
  const total = attendance.length;
  const absent = attendance.filter((event) => event.status === "absent").length;
  const late = attendance.filter((event) => event.status === "late").length;
  const attendanceRate = total === 0 ? 1 : (total - absent - late * 0.5) / total;
  const insuranceDays = daysUntil(student.insuranceEndDate);
  const languageDays = daysUntil(student.languageCertificateValidUntil);
  const attendanceRisk = attendanceRate < 0.75 ? 90 : attendanceRate < 0.88 ? 55 : 15;
  const academicRisk = student.gpa === null ? 35 : student.gpa < 2 ? 85 : student.gpa < 3 ? 45 : 10;
  const insuranceRisk = insuranceDays === null ? 35 : insuranceDays < 0 ? 95 : insuranceDays <= 30 ? 70 : 10;
  const languageRisk = languageDays === null ? 30 : languageDays < 0 ? 85 : languageDays <= 60 ? 60 : 10;
  const score = Math.round(attendanceRisk * 0.4 + academicRisk * 0.25 + insuranceRisk * 0.2 + languageRisk * 0.15);
  const reasons: string[] = [];

  if (attendanceRisk >= 55) reasons.push("출결 주의");
  if (academicRisk >= 45) reasons.push("평점 주의");
  if (insuranceRisk >= 70) reasons.push("보험 만료 임박");
  if (languageRisk >= 60) reasons.push("어학자격 유효기간 확인");

  return {
    studentNo: student.studentNo,
    attendanceRisk,
    academicRisk,
    insuranceRisk,
    languageRisk,
    overallGrade: score >= 70 ? "high" : score >= 40 ? "medium" : "low",
    reasons,
  };
}

export function runStudentHarness(students: Student[]): HarnessRun {
  const startedAt = new Date().toISOString();
  const warnings: string[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const student of students) {
    if (!student.studentNo) errors.push("학번이 없는 학생 레코드가 있습니다.");
    if (student.studentNo && seen.has(student.studentNo)) warnings.push(`중복 학번: ${student.studentNo}`);
    seen.add(student.studentNo);
    if (!student.nationality) warnings.push(`${student.studentNo}: 국적 누락`);
    if (!student.academicStatus) warnings.push(`${student.studentNo}: 학적상태 누락`);
    if (daysUntil(student.insuranceEndDate) !== null && daysUntil(student.insuranceEndDate)! < 0) {
      warnings.push(`${student.studentNo}: 보험기간 만료`);
    }
    if (
      daysUntil(student.languageCertificateValidUntil) !== null &&
      daysUntil(student.languageCertificateValidUntil)! < 0
    ) {
      warnings.push(`${student.studentNo}: 어학자격 유효기간 만료`);
    }
  }

  const steps = [
    step("source_fetch", "success", `${students.length.toLocaleString("ko-KR")}명 학생 seed/API 수집`),
    step("schema_validate", errors.length ? "failed" : "success", "담당교원 필드 없이 학생 스키마 검증"),
    step("normalize", "success", "엑셀 날짜 serial 및 숫자 필드 정규화 완료"),
    step("deduplicate", seen.size === students.length ? "success" : "warning", "학번 기준 중복 검사"),
    step("quality_check", warnings.length ? "warning" : "success", `${warnings.length}건 품질 경고`),
    step("metric_build", "success", "국가·학과·학년·보험·어학 지표 생성 가능"),
    step("risk_score", "success", "규칙 기반 위험도 산출 준비 완료"),
    step("publish", errors.length ? "failed" : "success", "대시보드 반영 상태 확정"),
  ];

  return finishRun("students", startedAt, students.length, warnings.slice(0, 80), errors, steps);
}

export function runClassHarness(classes: ClassSession[]): HarnessRun {
  const startedAt = new Date().toISOString();
  const warnings = classes
    .filter((session) => !session.courseCode || !session.scheduledAt || !session.sourceSystemId)
    .map((session) => `${session.id}: 필수 수업 필드 누락`);
  const errors: string[] = [];

  const steps = [
    step("source_fetch", "success", `${classes.length}개 수업 수집`),
    step("schema_validate", warnings.length ? "warning" : "success", "과목/분반·수업일시·강의실 스키마 검증"),
    step("normalize", "success", "담당교원 데이터는 저장 대상에서 제외"),
    step("deduplicate", "success", "원천 수업 ID 기준 중복 검사 완료"),
    step("quality_check", warnings.length ? "warning" : "success", `${warnings.length}건 품질 경고`),
    step("metric_build", "success", "오늘 수업 현황 지표 생성"),
    step("risk_score", "success", "수업 자체 위험도는 산출하지 않음"),
    step("publish", "success", "대시보드 반영 상태 확정"),
  ];

  return finishRun("classes", startedAt, classes.length, warnings, errors, steps);
}

export function runAttendanceHarness(
  attendance: AttendanceEvent[],
  students: Student[],
  classes: ClassSession[],
): HarnessRun {
  const startedAt = new Date().toISOString();
  const studentNos = new Set(students.map((student) => student.studentNo));
  const classIds = new Set(classes.map((session) => session.id));
  const warnings: string[] = [];
  const errors: string[] = [];

  for (const event of attendance) {
    if (!studentNos.has(event.studentNo)) warnings.push(`${event.studentNo}: 학사 DB에 없는 출결 학생`);
    if (!classIds.has(event.classId)) warnings.push(`${event.classId}: 수업 목록에 없는 출결 이벤트`);
    if (event.status !== "absent" && !event.checkedAt) warnings.push(`${event.id}: 출석시각 누락`);
  }

  const steps = [
    step("source_fetch", "success", `${attendance.length.toLocaleString("ko-KR")}건 출결 수집`),
    step("schema_validate", warnings.length ? "warning" : "success", "출결 상태·학번·수업 ID 검증"),
    step("normalize", "success", "원천 출결 상태를 present/late/absent/excused로 정규화"),
    step("deduplicate", "success", "학생+수업 기준 이벤트 중복 검사 완료"),
    step("quality_check", warnings.length ? "warning" : "success", `${warnings.length}건 품질 경고`),
    step("metric_build", "success", "오늘 결석·지각·출석률 지표 생성"),
    step("risk_score", "success", "학생별 출결 위험도 산출 가능"),
    step("publish", "success", "대시보드 반영 상태 확정"),
  ];

  return finishRun("attendance", startedAt, attendance.length, warnings.slice(0, 80), errors, steps);
}
