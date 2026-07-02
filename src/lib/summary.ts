import { getAttendanceEvents, getClassSessions, getDataSourceInfo, getStudents } from "@/lib/data";
import { assessRisk, runAttendanceHarness, runClassHarness, runStudentHarness } from "@/lib/harness";
import type { AttendanceEvent, Student } from "@/lib/types";

function countBy<T>(items: T[], getKey: (item: T) => string | number | null | undefined) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = String(getKey(item) || "미상");
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "ko-KR"));
}

function isWithin(date: string | null, days: number) {
  if (!date) return false;
  const target = new Date(`${date}T00:00:00+09:00`).getTime();
  const diff = target - Date.now();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function attendanceFor(student: Student, attendance: AttendanceEvent[]) {
  return attendance.filter((event) => event.studentNo === student.studentNo);
}

export function buildDashboardSummary() {
  const students = getStudents();
  const classes = getClassSessions();
  const attendance = getAttendanceEvents();
  const risks = students.map((student) => assessRisk(student, attendanceFor(student, attendance)));
  const todayAbsent = attendance.filter((event) => event.status === "absent").length;
  const todayLate = attendance.filter((event) => event.status === "late").length;
  const todayPresent = attendance.filter((event) => event.status === "present").length;
  const activeStudents = students.filter((student) => student.academicStatus === "재학");
  const insuranceDue = students.filter((student) => isWithin(student.insuranceEndDate, 30)).length;
  const languageDue = students.filter((student) => isWithin(student.languageCertificateValidUntil, 60)).length;
  const highRisk = risks.filter((risk) => risk.overallGrade === "high").length;
  const mediumRisk = risks.filter((risk) => risk.overallGrade === "medium").length;
  const harnessRuns = [
    runStudentHarness(students),
    runClassHarness(classes),
    runAttendanceHarness(attendance, students, classes),
  ];

  return {
    generatedAt: new Date().toISOString(),
    dataSource: getDataSourceInfo(),
    metrics: {
      totalStudents: students.length,
      activeStudents: activeStudents.length,
      todayClasses: classes.length,
      todayAbsent,
      todayLate,
      todayPresent,
      attendanceRate:
        attendance.length === 0 ? 0 : Math.round(((todayPresent + todayLate) / attendance.length) * 1000) / 10,
      highRisk,
      mediumRisk,
      insuranceDue,
      languageDue,
    },
    distributions: {
      academicStatus: countBy(students, (student) => student.academicStatus),
      nationality: countBy(students, (student) => student.nationality).slice(0, 10),
      college: countBy(students, (student) => student.college).slice(0, 10),
      department: countBy(students, (student) => student.department).slice(0, 12),
      grade: countBy(students, (student) => (student.grade ? `${student.grade}학년` : "미상")),
      scholarship: countBy(students, (student) => student.scholarshipName).slice(0, 10),
      risk: countBy(risks, (risk) => risk.overallGrade),
    },
    recentClasses: classes,
    attentionStudents: students
      .map((student) => ({
        student,
        risk: risks.find((risk) => risk.studentNo === student.studentNo)!,
        attendance: attendanceFor(student, attendance),
      }))
      .filter((item) => item.risk.overallGrade !== "low")
      .slice(0, 12),
    harnessRuns,
  };
}
