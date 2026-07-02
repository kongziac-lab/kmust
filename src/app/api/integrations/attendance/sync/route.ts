import { NextResponse } from "next/server";
import { fetchExternalJson, getAttendanceEvents, getClassSessions, getStudents } from "@/lib/data";
import { runAttendanceHarness } from "@/lib/harness";
import type { AttendanceEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

async function syncAttendance() {
  try {
    const attendance = await fetchExternalJson<AttendanceEvent[]>(
      process.env.LMS_ATTENDANCE_API_URL,
      getAttendanceEvents(),
    );
    const harness = runAttendanceHarness(attendance, getStudents(), getClassSessions());

    return NextResponse.json({
      source: process.env.LMS_ATTENDANCE_API_URL ? "attendance-api" : "fixture",
      persisted: false,
      note: "읽기 전용 출결 동기화 검증 결과입니다.",
      harness,
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "attendance-api",
        persisted: false,
        error: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  return syncAttendance();
}

export async function POST() {
  return syncAttendance();
}
