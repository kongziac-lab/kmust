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

function isActiveInsurance(student: Student) {
  if (!student.insuranceEndDate) return false;
  return new Date(`${student.insuranceEndDate}T23:59:59+09:00`).getTime() >= Date.now();
}

function hasTopik(student: Student) {
  return student.languageCertificate.toLowerCase().includes("topik");
}

function isDropoutStatus(status: string) {
  return /중도|탈락|자퇴|제적|퇴학/.test(status);
}

function isActiveAcademicStatus(status: string) {
  return status === "재학";
}

function isLeaveAcademicStatus(status: string) {
  return status === "휴학";
}

function isEnrolledAcademicStatus(status: string) {
  return isActiveAcademicStatus(status) || isLeaveAcademicStatus(status);
}

function buildProgramNationalityName(student: Student) {
  return `${student.program || "미상"} · ${student.nationality || "미상"}`;
}

function buildStatusRecord(student: Student) {
  return {
    program: student.program || "미상",
    nationality: student.nationality || "미상",
    department: student.department || "미상",
    grade: student.grade ? `${student.grade}학년` : "미상",
  };
}

function buildStatusGroup(students: Student[]) {
  return {
    total: students.length,
    records: students.map(buildStatusRecord),
    distributions: {
      program: countBy(students, (student) => student.program),
      nationality: countBy(students, (student) => student.nationality).slice(0, 10),
      department: countBy(students, (student) => student.department).slice(0, 12),
      grade: countBy(students, (student) => (student.grade ? `${student.grade}학년` : "미상")),
      programNationality: countBy(students, buildProgramNationalityName).slice(0, 14),
    },
  };
}

function toPercent(value: number, total: number) {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

function eventTime(event: AttendanceEvent) {
  return new Date(event.checkedAt || event.syncedAt).getTime();
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function isSameDay(event: AttendanceEvent, date: Date) {
  const time = eventTime(event);
  return time >= startOfDay(date).getTime() && time <= endOfDay(date).getTime();
}

function isWithinCalendarDays(event: AttendanceEvent, date: Date, days: number) {
  const start = startOfDay(date);
  start.setDate(start.getDate() - (days - 1));
  const time = eventTime(event);
  return time >= start.getTime() && time <= endOfDay(date).getTime();
}

function summarizeAttendance(attendance: AttendanceEvent[]) {
  const present = attendance.filter((event) => event.status === "present").length;
  const late = attendance.filter((event) => event.status === "late").length;
  const absent = attendance.filter((event) => event.status === "absent").length;
  const excused = attendance.filter((event) => event.status === "excused").length;

  return {
    total: attendance.length,
    present,
    late,
    absent,
    excused,
    rate: attendance.length === 0 ? 0 : Math.round(((present + late) / attendance.length) * 1000) / 10,
  };
}

function groupAttendanceByStudent(attendance: AttendanceEvent[]) {
  const byStudent = new Map<string, AttendanceEvent[]>();

  for (const event of attendance) {
    const events = byStudent.get(event.studentNo);

    if (events) {
      events.push(event);
    } else {
      byStudent.set(event.studentNo, [event]);
    }
  }

  return byStudent;
}

function attendanceForStudent(byStudent: Map<string, AttendanceEvent[]>, studentNo: string) {
  return byStudent.get(studentNo) || [];
}

function buildAbsenceWatchStudents(
  students: Student[],
  attendance: AttendanceEvent[],
  classes: ReturnType<typeof getClassSessions>,
) {
  const studentByNo = new Map(students.map((student) => [student.studentNo, student]));
  const classById = new Map(classes.map((session) => [session.id, session]));
  const byStudent = new Map<
    string,
    {
      absentCount: number;
      lateCount: number;
      excusedCount: number;
      courseNames: Set<string>;
    }
  >();

  for (const event of attendance) {
    if (event.status !== "absent" && event.status !== "late" && event.status !== "excused") {
      continue;
    }

    const item =
      byStudent.get(event.studentNo) ||
      {
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        courseNames: new Set<string>(),
      };

    if (event.status === "absent") {
      item.absentCount += 1;
      item.courseNames.add(classById.get(event.classId)?.courseName || event.classId);
    } else if (event.status === "late") {
      item.lateCount += 1;
    } else {
      item.excusedCount += 1;
    }

    byStudent.set(event.studentNo, item);
  }

  return [...byStudent.entries()]
    .map(([studentNo, item]) => {
      const student = studentByNo.get(studentNo);
      if (!student) return null;

      return {
        student,
        absentCount: item.absentCount,
        lateCount: item.lateCount,
        excusedCount: item.excusedCount,
        courseNames: [...item.courseNames].slice(0, 4),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .filter((item) => item.absentCount > 0)
    .sort(
      (a, b) =>
        b.absentCount - a.absentCount ||
        b.lateCount - a.lateCount ||
        a.student.studentNo.localeCompare(b.student.studentNo, "ko-KR"),
    );
}

export function buildDashboardSummary() {
  const students = getStudents();
  const classes = getClassSessions();
  const attendance = getAttendanceEvents(students);
  const attendanceByStudent = groupAttendanceByStudent(attendance);
  const now = new Date();
  const todayAttendance = attendance.filter((event) => isSameDay(event, now));
  const weeklyAttendance = attendance.filter((event) => isWithinCalendarDays(event, now, 7));
  const todaySummary = summarizeAttendance(todayAttendance);
  const weeklySummary = summarizeAttendance(weeklyAttendance);
  const risks = students.map((student) => assessRisk(student, attendanceForStudent(attendanceByStudent, student.studentNo)));
  const enrolledStudents = students.filter((student) => isEnrolledAcademicStatus(student.academicStatus));
  const activeStudents = students.filter((student) => isActiveAcademicStatus(student.academicStatus));
  const leaveStudents = students.filter((student) => isLeaveAcademicStatus(student.academicStatus));
  const insuranceDue = students.filter((student) => isWithin(student.insuranceEndDate, 30)).length;
  const languageDue = students.filter((student) => isWithin(student.languageCertificateValidUntil, 60)).length;
  const highRisk = risks.filter((risk) => risk.overallGrade === "high").length;
  const mediumRisk = risks.filter((risk) => risk.overallGrade === "medium").length;
  const activeInsurance = students.filter(isActiveInsurance).length;
  const missingInsurance = students.length - activeInsurance;
  const topikStudents = students.filter(hasTopik).length;
  const languageTrainingCompleted = students.filter((student) => student.languageTrainingCompleted).length;
  const dropoutStudents = students.filter((student) => isDropoutStatus(student.academicStatus)).length;
  const counselingTargets = highRisk + mediumRisk;
  const absenceWatchStudents = buildAbsenceWatchStudents(students, weeklyAttendance, classes);
  const absenceOver3 = absenceWatchStudents.filter((item) => item.absentCount >= 3).length;
  const absenceOver5 = absenceWatchStudents.filter((item) => item.absentCount >= 5).length;
  const absenceOver7 = absenceWatchStudents.filter((item) => item.absentCount >= 7).length;
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
      attendanceEvents: todaySummary.total,
      todayAbsent: todaySummary.absent,
      todayLate: todaySummary.late,
      todayPresent: todaySummary.present,
      todayExcused: todaySummary.excused,
      attendanceRate: todaySummary.rate,
      weeklyAttendanceEvents: weeklySummary.total,
      weeklyAbsent: weeklySummary.absent,
      weeklyLate: weeklySummary.late,
      weeklyPresent: weeklySummary.present,
      weeklyExcused: weeklySummary.excused,
      weeklyAttendanceRate: weeklySummary.rate,
      absenceOver3,
      absenceOver5,
      absenceOver7,
      attendanceObservationTargets: absenceOver3,
      highRisk,
      mediumRisk,
      insuranceDue,
      languageDue,
      activeInsurance,
      missingInsurance,
      insuranceCoverageRate: toPercent(activeInsurance, students.length),
      topikStudents,
      topikRate: toPercent(topikStudents, students.length),
      languageTrainingCompleted,
      dropoutStudents,
      dropoutRate: toPercent(dropoutStudents, students.length),
      counselingTargets,
      counselingTargetRate: toPercent(counselingTargets, students.length),
    },
    statusGroups: {
      enrolled: buildStatusGroup(enrolledStudents),
      active: buildStatusGroup(activeStudents),
      leave: buildStatusGroup(leaveStudents),
    },
    distributions: {
      academicStatus: countBy(students, (student) => student.academicStatus),
      program: countBy(students, (student) => student.program),
      nationality: countBy(students, (student) => student.nationality).slice(0, 10),
      college: countBy(students, (student) => student.college).slice(0, 10),
      department: countBy(students, (student) => student.department).slice(0, 12),
      grade: countBy(students, (student) => (student.grade ? `${student.grade}학년` : "미상")),
      gender: countBy(students, (student) => student.gender || "미상"),
      scholarship: countBy(students, (student) => student.scholarshipName).slice(0, 10),
      insurance: countBy(students, (student) => {
        if (isWithin(student.insuranceEndDate, 30)) return "만료 예정";
        if (isActiveInsurance(student)) return "보험 유효";
        return "확인 필요";
      }),
      topik: countBy(students, (student) => {
        if (hasTopik(student)) return "TOPIK 보유";
        if (student.languageTrainingCompleted) return "어학연수 이수";
        if (student.languageCertificate && student.languageCertificate !== "미상") return "기타 어학";
        return "확인 필요";
      }),
      dropout: countBy(students, (student) => (isDropoutStatus(student.academicStatus) ? "중도탈락" : "재학/기타")),
      counseling: [
        { name: "상담 우선", value: counselingTargets },
        { name: "일반 모니터링", value: Math.max(students.length - counselingTargets, 0) },
      ],
      risk: countBy(risks, (risk) => risk.overallGrade),
    },
    recentClasses: classes,
    attentionStudents: students
      .map((student) => ({
        student,
        risk: risks.find((risk) => risk.studentNo === student.studentNo)!,
        attendance: attendanceForStudent(attendanceByStudent, student.studentNo),
      }))
      .filter((item) => item.risk.overallGrade !== "low")
      .slice(0, 12),
    absenceWatchStudents,
    harnessRuns,
  };
}

export type DashboardSummary = ReturnType<typeof buildDashboardSummary>;
