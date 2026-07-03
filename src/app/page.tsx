import { DashboardMonitor } from "@/app/dashboard-monitor";
import { dashboardModes, type Mode } from "@/lib/dashboard-modes";
import { buildDashboardSummary } from "@/lib/summary";

export const dynamic = "force-dynamic";

function normalizeMode(value: string | string[] | undefined): Mode {
  const mode = Array.isArray(value) ? value[0] : value;

  return dashboardModes.has(mode as Mode) ? (mode as Mode) : "overview";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const params = await searchParams;
  const summary = buildDashboardSummary();
  const activeMode = normalizeMode(params.mode);

  return <DashboardMonitor activeMode={activeMode} summary={summary} />;
}
