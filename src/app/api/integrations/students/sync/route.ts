import { NextResponse } from "next/server";
import { fetchExternalJson, getDataSourceInfo, getStudents } from "@/lib/data";
import { runStudentHarness } from "@/lib/harness";
import type { Student } from "@/lib/types";

export const dynamic = "force-dynamic";

async function syncStudents() {
  try {
    const dataSource = getDataSourceInfo();
    const students = await fetchExternalJson<Student[]>(process.env.ACADEMIC_API_URL, getStudents());
    const harness = runStudentHarness(students);

    return NextResponse.json({
      source: process.env.ACADEMIC_API_URL ? "academic-api" : dataSource.type,
      persisted: false,
      dataSource,
      note: "읽기 전용 동기화 검증 결과입니다. 현재 로컬 운영 자료는 엑셀 적재 SQLite DB를 우선 조회합니다.",
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
