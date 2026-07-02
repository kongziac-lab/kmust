import { NextResponse } from "next/server";
import { fetchExternalJson, getStudents } from "@/lib/data";
import { runStudentHarness } from "@/lib/harness";
import type { Student } from "@/lib/types";

export const dynamic = "force-dynamic";

async function syncStudents() {
  try {
    const students = await fetchExternalJson<Student[]>(process.env.ACADEMIC_API_URL, getStudents());
    const harness = runStudentHarness(students);

    return NextResponse.json({
      source: process.env.ACADEMIC_API_URL ? "academic-api" : "seed-xlsx",
      persisted: false,
      note: "읽기 전용 동기화 검증 결과입니다. DATABASE_URL 연결 후 upsert 저장으로 전환할 수 있습니다.",
      harness,
    });
  } catch (error) {
    return NextResponse.json(
      {
        source: "academic-api",
        persisted: false,
        error: error instanceof Error ? error.message : "Unknown sync error",
      },
      { status: 502 },
    );
  }
}

export async function GET() {
  return syncStudents();
}

export async function POST() {
  return syncStudents();
}
