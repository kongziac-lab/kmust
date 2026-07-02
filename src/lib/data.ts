import studentsSeed from "@/data/seed-students.json";
import type { AttendanceEvent, ClassSession, Student } from "@/lib/types";

const students = studentsSeed as Student[];

const classNames = [
  ["KOR101", "한국어와 대학생활"],
  ["BUS204", "글로벌 경영의 이해"],
  ["ENG110", "기초 학술영어"],
  ["CSE201", "컴퓨팅 사고"],
  ["CUL330", "한국문화 세미나"],
  ["INT250", "국제학생 전공탐색"],
] as const;

function todayAt(hour: number, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function getStudents() {
  return students;
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
  const activeStudents = students
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
          : new Date(new Date(session.scheduledAt).getTime() + (status === "late" ? 14 : 1) * 60_000).toISOString();

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
