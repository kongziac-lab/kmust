export type Student = {
  sequence: number | null;
  studentNo: string;
  nationality: string;
  admissionType: string;
  screeningType: string;
  admissionDate: string | null;
  admissionGrade: number | null;
  grade: number | null;
  recognizedSemester: number | null;
  gender: string;
  program: string;
  college: string;
  department: string;
  gpa: number | null;
  scholarshipName: string;
  academicStatus: string;
  insuranceCompany: string;
  insuranceStartDate: string | null;
  insuranceEndDate: string | null;
  languageCertificate: string;
  languageCertificateLevel: string;
  languageCertificateScore: number | null;
  languageCertificateValidUntil: string | null;
  languageTrainingCompleted: boolean;
};

export type ClassSession = {
  id: string;
  courseCode: string;
  courseName: string;
  section: string;
  scheduledAt: string;
  room: string;
  sourceSystemId: string;
};

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

export type AttendanceEvent = {
  id: string;
  studentNo: string;
  classId: string;
  status: AttendanceStatus;
  checkedAt: string | null;
  reason: string | null;
  sourceSystem: "fixture" | "lms" | "attendance";
  syncedAt: string;
};

export type RiskAssessment = {
  studentNo: string;
  attendanceRisk: number;
  academicRisk: number;
  insuranceRisk: number;
  languageRisk: number;
  overallGrade: "low" | "medium" | "high";
  reasons: string[];
};

export type HarnessStepName =
  | "source_fetch"
  | "schema_validate"
  | "normalize"
  | "deduplicate"
  | "quality_check"
  | "metric_build"
  | "risk_score"
  | "publish";

export type HarnessStep = {
  name: HarnessStepName;
  status: "success" | "warning" | "failed";
  message: string;
  checkedAt: string;
};

export type HarnessRun = {
  id: string;
  target: "students" | "classes" | "attendance" | "dashboard";
  status: "success" | "warning" | "failed";
  startedAt: string;
  finishedAt: string;
  recordCount: number;
  warnings: string[];
  errors: string[];
  steps: HarnessStep[];
};
