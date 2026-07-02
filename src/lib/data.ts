import studentsSeed from "@/data/seed-students.json";
import type { AttendanceEvent, ClassSession, Student } from "@/lib/types";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const seedStudents = studentsSeed as Student[];
const dbPath = path.join(process.cwd(), "data", "kmust.sqlite");

type StudentRow = {
  sequence: number | null;
  student_no: string;
  nationality: string;
  admission_type: string;
  screening_type: string;
  admission_date: string | null;
  admission_grade: number | null;
  grade: number | null;
  recognized_semester: number | null;
  gender: string;
  program: string;
  college: string;
  department: string;
  gpa: number | null;
  scholarship_name: string;
  academic_status: string;
  insurance_company: string;
  insurance_start_date: string | null;
  insurance_end_date: string | null;
  language_certificate: string;
  language_certificate_level: string;
  language_certificate_score: number | null;
  language_certificate_valid_until: string | null;
  language_training_completed: number;
};

type ImportRunRow = {
  imported_at: string;
  row_count: number;
};

const classNames = [
  ["KOR101", "한국어와 대학생활"],
  ["BUS204", "글로벌 경영의 이해"],
  ["ENG110", "기초 학술영어"],
  ["CSE201", "컴퓨팅 사고"],
  ["CUL330", "한국문화 탐구"],
  ["INT250", "국제학생 전공탐색"],
] as const;

function mapStudentRow(row: StudentRow): Student {
  return {
    sequence: row.sequence,
    studentNo: row.student_no,
    nationality: row.nationality,
    admissionType: row.admission_type,
    screeningType: row.screening_type,
    admissionDate: row.admission_date,
    admissionGrade: row.admission_grade,
    grade: row.grade,
    recognizedSemester: row.recognized_semester,
    gender: row.gender,
    program: row.program,
    college: row.college,
    department: row.department,
    gpa: row.gpa,
    scholarshipName: row.scholarship_name,
    academicStatus: row.academic_status,
    insuranceCompany: row.insurance_company,
    insuranceStartDate: row.insurance_start_date,
    insuranceEndDate: row.insurance_end_date,
    languageCertificate: row.language_certificate,
    languageCertificateLevel: row.language_certificate_level,
    languageCertificateScore: row.language_certificate_score,
    languageCertificateValidUntil: row.language_certificate_valid_until,
    languageTrainingCompleted: row.language_training_completed === 1,
  };
}

function readStudentsFromDatabase(): Student[] | null {
  if (!fs.existsSync(dbPath)) {
    return null;
  }

  const database = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const rows = database
      .prepare(
        `select
          sequence,
          student_no,
          nationality,
          admission_type,
          screening_type,
          admission_date,
          admission_grade,
          grade,
          recognized_semester,
          gender,
          program,
          college,
          department,
          gpa,
          scholarship_name,
          academic_status,
          insurance_company,
          insurance_start_date,
          insurance_end_date,
          language_certificate,
          language_certificate_level,
          language_certificate_score,
          language_certificate_valid_until,
          language_training_completed
        from students
        order by sequence, student_no`,
      )
      .all() as StudentRow[];

    return rows.map(mapStudentRow);
  } finally {
    database.close();
  }
}

export function getDataSourceInfo() {
  if (!fs.existsSync(dbPath)) {
    return {
      type: "seed",
      label: "익명 seed 데이터",
      recordCount: seedStudents.length,
      importedAt: null,
    };
  }

  const database = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const latest = database
      .prepare("select imported_at, row_count from import_runs order by id desc limit 1")
      .get() as ImportRunRow | undefined;

    return {
      type: "sqlite",
      label: "엑셀 적재 SQLite DB",
      recordCount: latest?.row_count ?? readStudentsFromDatabase()?.length ?? 0,
      importedAt: latest?.imported_at ?? null,
    };
  } finally {
    database.close();
  }
}

function todayAt(hour: number, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function getStudents() {
  return readStudentsFromDatabase() ?? seedStudents;
}

export function getClassSessions(): ClassSession[] {
  return classNames.map(([courseCode, courseName], index) => ({
    id: `CLS-${String(index + 1).padStart(3, "0")}`,
    courseCode,
    courseName,
    section: `${(index % 3) + 1}분반`,
    scheduledAt: todayAt(9 + index, index % 2 === 0 ? 0 : 30),
    room: `국제관 ${301 + index}`,
    sourceSystemId: `LMS-${courseCode}-${index + 1}`,
  }));
}

export function getAttendanceEvents(): AttendanceEvent[] {
  const now = new Date().toISOString();
  const classes = getClassSessions();
  const activeStudents = getStudents()
    .filter((student) => student.academicStatus === "재학")
    .slice(0, 480);

  return activeStudents.flatMap((student, studentIndex) =>
    classes.slice(0, 3).map((session, classIndex) => {
      const marker = (studentIndex * 7 + classIndex * 11) % 100;
      const status =
        marker < 8 ? "absent" : marker < 18 ? "late" : marker < 21 ? "excused" : "present";
      const checkedAt =
        status === "absent"
          ? null
          : new Date(
              new Date(session.scheduledAt).getTime() + (status === "late" ? 14 : 1) * 60_000,
            ).toISOString();

      return {
        id: `ATT-${student.studentNo}-${session.id}`,
        studentNo: student.studentNo,
        classId: session.id,
        status,
        checkedAt,
        reason: status === "excused" ? "공결" : status === "absent" ? "미확인" : null,
        sourceSystem: "fixture",
        syncedAt: now,
      } satisfies AttendanceEvent;
    }),
  );
}

export async function fetchExternalJson<T>(url: string | undefined, fallback: T): Promise<T> {
  if (!url) {
    return fallback;
  }

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`External API failed with ${response.status}`);
  }

  return (await response.json()) as T;
}
