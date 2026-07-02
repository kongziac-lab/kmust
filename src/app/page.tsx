import Link from "next/link";
import { buildDashboardSummary } from "@/lib/summary";

const riskLabel = {
  low: "낮음",
  medium: "주의",
  high: "높음",
} as const;

const statusClass = {
  success: "bg-cyan-300/15 text-cyan-100 ring-cyan-200/20",
  warning: "bg-amber-300/15 text-amber-100 ring-amber-200/20",
  failed: "bg-rose-300/15 text-rose-100 ring-rose-200/20",
} as const;

const stageLabel = {
  source_fetch: "수집",
  schema_validate: "검증",
  normalize: "정규화",
  deduplicate: "중복",
  quality_check: "품질",
  metric_build: "지표",
  risk_score: "평가",
  publish: "게시",
} as const;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function Bezel({
  children,
  className = "",
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={`rounded-[1.75rem] bg-white/[0.045] p-1.5 ring-1 ring-white/10 ${className}`}>
      <div className="h-full rounded-[calc(1.75rem-0.375rem)] bg-[#101936]/78 shadow-[inset_0_1px_1px_rgba(255,255,255,0.16),0_24px_80px_-42px_rgba(71,118,255,0.72)]">
        {children}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
  detail,
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "danger" | "warn" | "good";
  detail: string;
}) {
  const toneClass = {
    neutral: "from-slate-200 to-blue-200 text-blue-100",
    danger: "from-rose-300 to-orange-200 text-rose-100",
    warn: "from-amber-200 to-pink-200 text-amber-100",
    good: "from-cyan-200 to-blue-300 text-cyan-100",
  }[tone];

  return (
    <Bezel className="reveal group">
      <div className="relative min-h-40 overflow-hidden p-5">
        <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-400/12 blur-2xl transition-smooth group-hover:scale-125" />
        <div className="relative flex h-full flex-col justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
            <div className={`mt-3 bg-gradient-to-r bg-clip-text font-mono text-4xl font-semibold text-transparent ${toneClass}`}>
              {value}
            </div>
          </div>
          <p className="break-keep-all text-sm leading-relaxed text-slate-400">{detail}</p>
        </div>
      </div>
    </Bezel>
  );
}

function Distribution({
  title,
  eyebrow,
  items,
}: {
  title: string;
  eyebrow: string;
  items: { name: string; value: number }[];
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <Bezel className="reveal">
      <section className="p-5">
        <div className="rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200 ring-1 ring-white/10">
          {eyebrow}
        </div>
        <h2 className="mt-4 break-keep-all text-lg font-semibold leading-snug text-slate-50">{title}</h2>
        <div className="mt-5 space-y-4">
          {items.map((item) => (
            <div key={item.name}>
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate text-slate-300">{item.name}</span>
                <span className="font-mono text-blue-100">{item.value.toLocaleString("ko-KR")}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.055]">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#6a8dff] via-[#8eb0ff] to-[#ff7a74]"
                  style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </Bezel>
  );
}

export default function Home() {
  const summary = buildDashboardSummary();
  const filters = ["학기", "학적상태", "국가", "대학/학과", "학년", "위험등급"];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07102a] text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_5%,rgba(48,102,255,0.36),transparent_34%),radial-gradient(circle_at_84%_46%,rgba(108,59,255,0.28),transparent_32%),radial-gradient(circle_at_72%_88%,rgba(255,100,101,0.14),transparent_26%),linear-gradient(135deg,#07102a_0%,#101643_48%,#151036_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.032)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.026)_1px,transparent_1px)] bg-[size:72px_72px] opacity-35" />
      <div className="noise-layer" />

      <nav className="mx-auto mt-5 flex w-[calc(100%-2rem)] max-w-7xl items-center justify-between rounded-full border border-white/10 bg-white/[0.07] px-5 py-3 shadow-[0_24px_80px_-42px_rgba(80,120,255,0.85)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#7aa2ff] to-[#ff7772] shadow-[0_0_34px_rgba(122,162,255,0.32)]" />
          <span className="font-semibold text-slate-50">KMUST</span>
        </div>
        <div className="hidden items-center gap-2 text-sm text-slate-300 md:flex">
          {["현황", "출결", "위험평가", "하네스"].map((item, index) => (
            <span
              key={item}
              className={`rounded-full px-4 py-2 transition-smooth ${
                index === 0 ? "bg-white/10 text-white" : "hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              {item}
            </span>
          ))}
        </div>
        <span className="font-mono text-xs text-blue-100">LIVE {formatDateTime(summary.generatedAt)}</span>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-5 md:py-16">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div className="reveal">
            <div className="inline-flex rounded-full bg-[#5b8bff]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200 ring-1 ring-[#7aa2ff]/20">
              International Student Command Center
            </div>
            <h1 className="mt-7 max-w-3xl break-keep-all text-5xl font-black leading-snug tracking-normal text-slate-50 md:text-7xl">
              외국인학생 현황을
              <span className="block bg-gradient-to-r from-[#ff7a74] via-[#ee7ad8] to-[#7aa2ff] bg-clip-text text-transparent">
                실시간으로 판단하세요.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl break-keep-all text-base leading-8 text-slate-300 md:text-lg">
              학적, 출결, 보험, 어학 정보를 하네스 엔진으로 검증하고 운영자가 바로 볼 수 있는 지표로 정리합니다.
            </p>
          </div>

          <Bezel className="reveal lg:translate-y-8">
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Harness Health</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-50">운영 검증 흐름</div>
                </div>
                <div className="rounded-full bg-cyan-300/10 px-3 py-1 font-mono text-xs text-cyan-100 ring-1 ring-cyan-200/20">
                  {summary.harnessRuns.filter((run) => run.status === "success").length}/{summary.harnessRuns.length}
                </div>
              </div>
              <div className="mt-6 grid grid-cols-8 gap-1.5">
                {summary.harnessRuns.flatMap((run) =>
                  run.steps.map((item) => (
                    <div
                      key={`${run.id}-${item.name}`}
                      title={item.message}
                      className={`h-9 rounded-full ${
                        item.status === "success"
                          ? "bg-cyan-300/75"
                          : item.status === "warning"
                            ? "bg-amber-300/80"
                            : "bg-rose-300/80"
                      }`}
                    />
                  )),
                )}
              </div>
              <p className="mt-5 break-keep-all text-sm leading-7 text-slate-400">
                수업 정보는 운영 지표에 필요한 최소 항목만 반영합니다.
              </p>
            </div>
          </Bezel>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="전체 학생" value={summary.metrics.totalStudents.toLocaleString("ko-KR")} detail="익명화된 운영 seed 기준" />
          <Metric label="재학생" value={summary.metrics.activeStudents.toLocaleString("ko-KR")} tone="good" detail="학적상태 재학 집계" />
          <Metric label="오늘 수업" value={summary.metrics.todayClasses} detail="LMS/출결 시스템 연동 대상" />
          <Metric label="오늘 결석" value={summary.metrics.todayAbsent.toLocaleString("ko-KR")} tone="danger" detail="실시간 출결 이벤트 기준" />
          <Metric label="오늘 지각" value={summary.metrics.todayLate.toLocaleString("ko-KR")} tone="warn" detail="지각 상태 이벤트 합계" />
          <Metric label="출석률" value={`${summary.metrics.attendanceRate}%`} tone="good" detail="출석과 지각 반영" />
          <Metric label="고위험 학생" value={summary.metrics.highRisk.toLocaleString("ko-KR")} tone="danger" detail="규칙 기반 종합등급" />
          <Metric label="보험 만료 30일" value={summary.metrics.insuranceDue.toLocaleString("ko-KR")} tone="warn" detail="보험 종료일 임박" />
        </section>

        <Bezel className="reveal mt-6">
          <section className="p-4">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {filters.map((label) => (
                <label key={label} className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {label}
                  <select className="mt-2 h-11 w-full rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm text-slate-100 outline-none transition-smooth focus:border-[#7aa2ff]/60 focus:bg-white/[0.08]">
                    <option className="bg-[#101936]">전체</option>
                    {label === "위험등급" ? (
                      <>
                        <option className="bg-[#101936]">높음</option>
                        <option className="bg-[#101936]">주의</option>
                        <option className="bg-[#101936]">낮음</option>
                      </>
                    ) : null}
                  </select>
                </label>
              ))}
            </div>
          </section>
        </Bezel>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Bezel className="reveal">
            <section className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">Attention Queue</div>
                  <h2 className="mt-2 text-xl font-semibold text-slate-50">주의 학생</h2>
                </div>
                <span className="rounded-full bg-white/[0.07] px-4 py-2 text-sm font-medium text-slate-200 ring-1 ring-white/10">
                  {summary.metrics.highRisk + summary.metrics.mediumRisk}명
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-white/[0.035] text-[11px] uppercase tracking-[0.12em] text-slate-400">
                    <tr>
                      <th className="px-6 py-4">학번</th>
                      <th className="px-6 py-4">국적</th>
                      <th className="px-6 py-4">소속</th>
                      <th className="px-6 py-4">학년</th>
                      <th className="px-6 py-4">위험등급</th>
                      <th className="px-6 py-4">근거</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.07]">
                    {summary.attentionStudents.map(({ student, risk }) => (
                      <tr key={student.studentNo} className="transition-smooth hover:bg-white/[0.045]">
                        <td className="px-6 py-4 font-mono">
                          <Link href={`/api/students/${student.studentNo}`} className="text-blue-200 hover:text-white">
                            {student.studentNo}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{student.nationality || "미상"}</td>
                        <td className="px-6 py-4">
                          <div className="max-w-56 truncate text-slate-200">{student.department || student.college}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{student.grade ? `${student.grade}학년` : "미상"}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                              risk.overallGrade === "high"
                                ? "bg-rose-300/15 text-rose-100 ring-rose-200/20"
                                : "bg-amber-300/15 text-amber-100 ring-amber-200/20"
                            }`}
                          >
                            {riskLabel[risk.overallGrade]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{risk.reasons.join(", ") || "모니터링"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </Bezel>

          <Bezel className="reveal">
            <section className="p-6">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">Harness Engine</div>
              <h2 className="mt-2 text-xl font-semibold text-slate-50">검증 파이프라인</h2>
              <div className="mt-6 space-y-5">
                {summary.harnessRuns.map((run) => (
                  <div key={run.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-50">{run.target}</div>
                        <div className="font-mono text-xs text-slate-500">{run.recordCount.toLocaleString("ko-KR")} records</div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass[run.status]}`}>
                        {run.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {run.steps.map((item) => (
                        <div
                          key={item.name}
                          title={item.message}
                          className={`rounded-full px-2 py-1 text-center text-[10px] font-semibold ${
                            item.status === "success"
                              ? "bg-cyan-300/16 text-cyan-100"
                              : item.status === "warning"
                                ? "bg-amber-300/16 text-amber-100"
                                : "bg-rose-300/16 text-rose-100"
                          }`}
                        >
                          {stageLabel[item.name]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </Bezel>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          <Distribution title="국가별 Top 10" eyebrow="Nationality" items={summary.distributions.nationality} />
          <Distribution title="소속대학" eyebrow="College" items={summary.distributions.college} />
          <Distribution title="학년" eyebrow="Grade" items={summary.distributions.grade} />
          <Distribution title="장학 현황" eyebrow="Scholarship" items={summary.distributions.scholarship} />
        </section>

        <Bezel className="reveal mt-6">
          <section className="overflow-hidden">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-200">Today Classes</div>
              <h2 className="mt-2 text-xl font-semibold text-slate-50">오늘 수업 현황</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-white/[0.035] text-[11px] uppercase tracking-[0.12em] text-slate-400">
                  <tr>
                    <th className="px-6 py-4">과목</th>
                    <th className="px-6 py-4">분반</th>
                    <th className="px-6 py-4">시간</th>
                    <th className="px-6 py-4">강의실</th>
                    <th className="px-6 py-4">원천 ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.07]">
                  {summary.recentClasses.map((session) => (
                    <tr key={session.id} className="transition-smooth hover:bg-white/[0.045]">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-50">{session.courseName}</div>
                        <div className="font-mono text-xs text-slate-500">{session.courseCode}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{session.section}</td>
                      <td className="px-6 py-4 text-slate-300">{formatDateTime(session.scheduledAt)}</td>
                      <td className="px-6 py-4 text-slate-300">{session.room}</td>
                      <td className="px-6 py-4 font-mono text-xs text-blue-200">{session.sourceSystemId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Bezel>
      </div>
    </main>
  );
}
