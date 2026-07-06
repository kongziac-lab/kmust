import { NextResponse } from "next/server";
import { buildDashboardSummary } from "@/lib/summary";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildDashboardSummary());
}
