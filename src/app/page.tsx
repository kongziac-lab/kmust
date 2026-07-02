import Link from "next/link";
import type { CSSProperties } from "react";
import { buildDashboardSummary } from "@/lib/summary";

const menu = [
  { label: "Dashboard", href: "/" },
  { label: "현황 분석", href: "/analytics" },
  { label: "주의 학생", href: "/attention" },
  { label: "출결 모니터링", href: "/" },
  { label: "보험·어학", href: "/" },
];

function Shell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-[#140b3d] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_90%_8%,rgba(214,46,179,0.24),transparent_28%),radial-gradient(circle_at_8%_92%,rgba(74,105,255,0.24),transparent_30%),linear-gradient(135deg,#180d48_0%,#110733_48%,#080624_100%)]" />
      <div className="noise-layer" />
      {children}
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-[#755dff]/35 bg-[#1c104d]/80 p-5 lg:block">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#6aa8ff]/50 bg-[#1d185b]">
          <div className="h-5 w-5 rotate-45 rounded-sm border-2 border-[#69a7ff]" />
        </div>
        <div>
          <div className="text-lg font-black tracking-tight">KMUST OPS</div>
          <div className="text-xs text-[#9aa6d6]">Student Control</div>
        </div>
      </div>

      <label className="mt-7 block">
        <span className="sr-only">검색</span>
        <input
          className="h-10 w-full rounded-md border border-white/10 bg-[#130b38] px-4 text-sm text-white outline-none transition-smooth placeholder:text-[#838fc3] focus:border-[#6aa8ff]"
          placeholder="Search..."
        />
      </label>

      <div className="mt-7 text-xs font-semibold uppercase tracking-[0.14em] text-[#9aa6d6]">Menu</div>
      <nav className="mt-3 space-y-1">
        {menu.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            className={`block rounded-md px-4 py-3 text-sm transition-smooth ${
              index === 0 ? "bg-[#6b50e8] text-white shadow-[0_14px_36px_-20px_rgba(110,87,255,0.95)]" : "text-[#c9d1ff] hover:bg-white/8"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-xl bg-gradient-to-br from-[#7158ef] to-[#9c53ff] p-5 shadow-[0_28px_70px_-38px_rgba(140,94,255,0.95)]">
        <div className="text-lg font-bold">운영 지표</div>
        <p className="mt-3 break-keep-all text-xs leading-5 text-[#e6e3ff]">실시간 출결과 위험 평가를 한 화면에서 확인합니다.</p>
      </div>
    </aside>
  );
}

function KpiCard({
  title,
  value,
  tone,
  caption,
}: {
  title: string;
  value: string | number;
  tone: string;
  caption: string;
}) {
  return (
    <article className={`relative overflow-hidden rounded-xl p-5 shadow-[0_24px_70px_-38px_rgba(0,0,0,0.95)] ${tone}`}>
      <div className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/14 text-xs font-bold ring-8 ring-white/6">
        85%
      </div>
      <div className="text-sm text-white/80">{title}</div>
      <div className="mt-4 font-mono text-3xl font-black tracking-tight">{value}</div>
      <div className="mt-4 text-xs text-white/70">{caption}</div>
    </article>
  );
}

function Donut({ value }: { value: number }) {
  return (
    <div
      className="mx-auto grid h-48 w-48 place-items-center rounded-full bg-[conic-gradient(#6ed7ea_0deg,#6ed7ea_calc(var(--score)*3.6deg),rgba(255,255,255,0.09)_0deg)] p-5"
      style={{ "--score": value } as CSSProperties}
    >
      <div className="grid h-full w-full place-items-center rounded-full bg-[#1b104b] text-center">
        <div>
          <div className="text-sm text-[#c9d1ff]">Attendance</div>
          <div className="mt-1 font-mono text-4xl font-black text-[#6ed7ea]">{value}%</div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsBars() {
  const bars = [46, 72, 58, 78, 34, 51, 29, 44, 82, 61];

  return (
    <div className="flex h-48 items-end gap-4 border-b border-l border-white/10 px-4 pb-3">
      {bars.map((height, index) => (
        <div key={index} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-[#6a8dff] to-[#77e4e6] shadow-[0_0_28px_rgba(106,141,255,0.25)]"
            style={{ height: `${height}%` }}
          />
          <div className="font-mono text-[10px] text-[#9aa6d6]">{String(index + 1).padStart(2, "0")}</div>
        </div>
      ))}
    </div>
  );
}

function DistributionRows({ items }: { items: { name: string; value: number }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => (
        <div key={item.name}>
          <div className="flex items-center justify-between text-sm">
            <span className="truncate text-[#dfe5ff]">{item.name}</span>
            <span className="font-mono text-[#79e1ed]">{item.value.toLocaleString("ko-KR")}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
            <div className="h-full rounded-full bg-gradient-to-r from-[#6f65ff] to-[#d843b4]" style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const summary = buildDashboardSummary();
  const attentionTotal = summary.metrics.highRisk + summary.metrics.mediumRisk;

  return (
    <Shell>
      <div className="mx-auto flex min-h-screen max-w-[1440px] border-x border-[#755dff]/35 bg-[#0d082c]/72 shadow-[0_0_120px_rgba(107,80,232,0.25)]">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-[#755dff]/35 bg-[#120a38]/82 px-5 md:px-7">
            <div>
              <div className="text-lg font-black">Dashboard</div>
              <div className="text-xs text-[#9aa6d6]">외국인학생 운영자 관제 화면</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <div className="text-sm font-semibold">국제처 운영자</div>
                <div className="font-mono text-xs text-[#9aa6d6]">OPS-2026</div>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#74d5e8] via-[#7d66ff] to-[#d944af]" />
            </div>
          </header>

          <div className="space-y-5 p-4 md:p-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <KpiCard title="재학생" value={summary.metrics.activeStudents.toLocaleString("ko-KR")} caption="학적상태 재학 집계" tone="bg-gradient-to-br from-[#3739db] to-[#6e57e9]" />
              <KpiCard title="출석률" value={`${summary.metrics.attendanceRate}%`} caption="오늘 출석 이벤트 기준" tone="bg-gradient-to-br from-[#28a2c7] to-[#37c4c2]" />
              <KpiCard title="주의 학생" value={attentionTotal.toLocaleString("ko-KR")} caption="상세 목록은 별도 페이지" tone="bg-gradient-to-br from-[#9b11d2] to-[#cf22c0]" />
              <KpiCard title="오늘 결석" value={summary.metrics.todayAbsent.toLocaleString("ko-KR")} caption="실시간 출결 이벤트" tone="bg-gradient-to-br from-[#d7298d] to-[#e2549d]" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.3fr]">
              <article className="rounded-xl bg-[#211452] p-5 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.9)] ring-1 ring-white/8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">출결 운영률</h2>
                  <Link href="/attention" className="rounded-full bg-white/8 px-4 py-2 text-xs font-semibold text-[#dfe5ff] transition-smooth hover:bg-white/14">
                    세부 보기
                  </Link>
                </div>
                <div className="mt-5">
                  <Donut value={Math.round(summary.metrics.attendanceRate)} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white/6 p-3">
                    <div className="text-[#9aa6d6]">오늘 지각</div>
                    <div className="mt-1 font-mono text-xl font-bold text-[#79e1ed]">{summary.metrics.todayLate.toLocaleString("ko-KR")}</div>
                  </div>
                  <div className="rounded-lg bg-white/6 p-3">
                    <div className="text-[#9aa6d6]">고위험</div>
                    <div className="mt-1 font-mono text-xl font-bold text-[#ff79b3]">{summary.metrics.highRisk.toLocaleString("ko-KR")}</div>
                  </div>
                </div>
              </article>

              <article className="rounded-xl bg-[#211452] p-5 shadow-[0_28px_70px_-42px_rgba(0,0,0,0.9)] ring-1 ring-white/8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">출결 분석</h2>
                  <div className="flex overflow-hidden rounded-md bg-white/8 text-xs">
                    <span className="px-4 py-2 text-[#c9d1ff]">Today</span>
                    <span className="bg-[#d843b4] px-4 py-2 text-white">Monthly</span>
                  </div>
                </div>
                <div className="mt-7">
                  <AnalyticsBars />
                </div>
              </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <article className="rounded-xl bg-[#211452] p-5 ring-1 ring-white/8">
                <h2 className="text-lg font-bold">국가별 현황</h2>
                <div className="mt-5">
                  <DistributionRows items={summary.distributions.nationality} />
                </div>
              </article>
              <article className="rounded-xl bg-[#211452] p-5 ring-1 ring-white/8">
                <h2 className="text-lg font-bold">소속대학 현황</h2>
                <div className="mt-5">
                  <DistributionRows items={summary.distributions.college} />
                </div>
              </article>
              <article className="rounded-xl bg-[#211452] p-5 ring-1 ring-white/8">
                <h2 className="text-lg font-bold">운영 알림</h2>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-white/6 p-3">
                    <span className="text-[#dfe5ff]">보험 만료 30일</span>
                    <span className="font-mono text-[#79e1ed]">{summary.metrics.insuranceDue}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-white/6 p-3">
                    <span className="text-[#dfe5ff]">어학 만료 60일</span>
                    <span className="font-mono text-[#79e1ed]">{summary.metrics.languageDue}</span>
                  </div>
                  <Link href="/attention" className="block rounded-lg bg-[#6b50e8] p-3 text-center text-sm font-bold transition-smooth hover:scale-[1.02] active:scale-[0.98]">
                    주의 학생 페이지로 이동
                  </Link>
                  <Link href="/analytics" className="block rounded-lg bg-white/8 p-3 text-center text-sm font-bold transition-smooth hover:bg-white/14">
                    학생 현황 분석 보기
                  </Link>
                </div>
              </article>
            </section>
          </div>
        </section>
      </div>
    </Shell>
  );
}
