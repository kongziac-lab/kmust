import { NextResponse } from "next/server";
import { getAttendanceEvents, getClassSessions, getStudents } from "@/lib/data";
import { assessRisk } from "@/lib/harness";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ studentNo: string }> }) {
  const { studentNo } = await context.params;
  const student = getStudents().find((item) => item.studentNo === studentNo);

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const attendance = getAttendanceEvents().filter((event) => event.studentNo === student.studentNo);
  const classMap = new Map(getClassSessions().map((session) => [session.id, session]));

  return NextResponse.json({
    student,
    attendance: attendance.map((event) => ({
      ...event,
      class: classMap.get(event.classId) || null,
    })),
    risk: assessRisk(student, attendance),
  });
}
