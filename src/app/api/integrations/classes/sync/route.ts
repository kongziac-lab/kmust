import { NextResponse } from "next/server";
import { fetchExternalJson, getClassSessions } from "@/lib/data";
import { runClassHarness } from "@/lib/harness";
import type { ClassSession } from "@/lib/types";

export const dynamic = "force-dynamic";

type RawClassSession = ClassSession & {
  instructor?: unknown;
  teacher?: unknown;
  professor?: unknown;
  facultyName?: unknown;
};

function stripTeacherFields(session: RawClassSession): ClassSession {
  return {
    id: session.id,
    courseCode: session.courseCode,
    courseName: session.courseName,
    section: session.section,
    scheduledAt: session.scheduledAt,
    room: session.room,
    sourceSystemId: session.sourceSystemId,
  };
}

async function syncClasses() {
  try {
    const rawClasses = await fetchExternalJson<RawClassSession[]>(process.env.LMS_CLASSES_API_URL, getClassSessions());
    const classes = rawClasses.map(stripTeacherFields);
    const harness = runClassHarness(classes);

    return NextResponse.json({
      source: process.env.LMS_CLASSES_API_URL ? "lms-api" : "fixture",
      persisted: false,
      privacy: "담당교원 관련 필드는 수집 응답에 있어도 제거했습니다.",
      classes,
      harness,
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "lms-api",
        persisted: false,
        error: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  return syncClasses();
}

export async function POST() {
  return syncClasses();
}
