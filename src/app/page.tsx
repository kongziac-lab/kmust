import Link from "next/link";
import { buildDashboardSummary } from "@/lib/summary";

const riskLabel = {
  low: "낮음",
  medium: "주의",
  high: "높음",
} as const;

const statusClass = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "danger" | "warn" | "good";
}) {
  const toneClass = {
    neutral: "border-slate-200 bg-white text-slate-950",
    danger: "border-rose-200 bg-rose-50 text-rose-950",
    warn: "border-amber-200 bg-amber-50 text-amber-950",
    good: "border-emerald-200 bg-emerald-50 text-emerald-950",
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-2 font-mono text-3xl font-semibold tracking-normal">{value}</div>
    </div>
  );
}

function Distribution({
  title,
  items,
}: {
  title: string;
  items: { name: string; value: number }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-slate-700">{item.name}</span>
              <span className="font-mono text-slate-950">{item.value.toLocaleString("ko-KR")}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-cyan-600"
                style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const summary = buildDashboardSummary();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-700">KMUST International Student Operations</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
              외국인학생 실시간 현황·출결 대시보드
            </h1>
          </div>
          <div className="font-mono text-sm text-slate-500">updated {formatDateTime(summary.generatedAt)}</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-6">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="전체 학생" value={summary.metrics.totalStudents.toLocaleString("ko-KR")} />
          <Metric label="재학생" value={summary.metrics.activeStudents.toLocaleString("ko-KR")} tone="good" />
          <Metric label="오늘 수업" value={summary.metrics.todayClasses} />
          <Metric label="오늘 결석" value={summary.metrics.todayAbsent.toLocaleString("ko-KR")} tone="danger" />
          <Metric label="오늘 지각" value={summary.metrics.todayLate.toLocaleString("ko-KR")} tone="warn" />
          <Metric label="출석률" value={`${summary.metrics.attendanceRate}%`} tone="good" />
          <Metric label="고위험 학생" value={summary.metrics.highRisk.toLocaleString("ko-KR")} tone="danger" />
          <Metric label="보험 만료 30일" value={summary.metrics.insuranceDue.toLocaleString("ko-KR")} tone="warn" />
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {["학기", "학적상태", "국가", "대학/학과", "학년", "위험등급"].map((label) => (
              <label key={label} className="text-sm font-medium text-slate-700">
                {label}
                <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none ring-cyan-600 focus:ring-2">
                  <option>전체</option>
                  {label === "위험등급" ? (
                    <>
                      <option>높음</option>
                      <option>주의</option>
                      <option>낮음</option>
                    </>
                  ) : null}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">주의 학생</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {summary.metrics.highRisk + summary.metrics.mediumRisk}명
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">학번</th>
                    <th className="px-5 py-3">국적</th>
                    <th className="px-5 py-3">소속</th>
                    <th className="px-5 py-3">학년</th>
                    <th className="px-5 py-3">위험등급</th>
                    <th className="px-5 py-3">근거</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.attentionStudents.map(({ student, risk }) => (
                    <tr key={student.studentNo} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono">
                        <Link href={`/api/students/${student.studentNo}`} className="text-cyan-700 hover:underline">
                          {student.studentNo}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{student.nationality || "미상"}</td>
                      <td className="px-5 py-3">
                        <div className="max-w-56 truncate">{student.department || student.college}</div>
                      </td>
                      <td className="px-5 py-3">{student.grade ? `${student.grade}학년` : "미상"}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            risk.overallGrade === "high"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {riskLabel[risk.overallGrade]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{risk.reasons.join(", ") || "모니터링"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-base font-semibold">하네스 엔진</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {summary.harnessRuns.map((run) => (
                <div key={run.id} className="px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-950">{run.target}</div>
                      <div className="font-mono text-xs text-slate-500">
                        {run.recordCount.toLocaleString("ko-KR")} records
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClass[run.status]}`}>
                      {run.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-1">
                    {run.steps.map((item) => (
                      <div
                        key={item.name}
                        title={item.message}
                        className={`h-2 rounded-full ${
                          item.status === "success"
                            ? "bg-emerald-500"
                            : item.status === "warning"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                      />
                    ))}
                  </div>
                  {run.warnings.length > 0 ? (
                    <div className="mt-3 text-xs text-slate-500">경고 {run.warnings.length}건</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          <Distribution title="국가별 Top 10" items={summary.distributions.nationality} />
          <Distribution title="소속대학" items={summary.distributions.college} />
          <Distribution title="학년" items={summary.distributions.grade} />
          <Distribution title="장학 현황" items={summary.distributions.scholarship} />
        </section>

        <section className="mt-5 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold">오늘 수업 현황</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">과목</th>
                  <th className="px-5 py-3">분반</th>
                  <th className="px-5 py-3">시간</th>
                  <th className="px-5 py-3">강의실</th>
                  <th className="px-5 py-3">원천 ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.recentClasses.map((session) => (
                  <tr key={session.id}>
                    <td className="px-5 py-3">
                      <div className="font-medium">{session.courseName}</div>
                      <div className="font-mono text-xs text-slate-500">{session.courseCode}</div>
                    </td>
                    <td className="px-5 py-3">{session.section}</td>
                    <td className="px-5 py-3">{formatDateTime(session.scheduledAt)}</td>
                    <td className="px-5 py-3">{session.room}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{session.sourceSystemId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
