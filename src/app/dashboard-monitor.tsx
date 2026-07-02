import type { CSSProperties, ReactNode } from "react";
import type { DashboardSummary } from "@/lib/summary";

export type Mode =
  | "overview"
  | "attendance"
  | "status"
  | "program"
  | "nationality"
  | "department"
  | "grade"
  | "gender"
  | "certification"
  | "insurance"
  | "topik"
  | "dropout"
  | "counseling";

type DistributionItem = {
  name: string;
  value: number;
};

const primaryModes: { label: string; mode: Mode }[] = [
  { label: "총괄보기", mode: "overview" },
  { label: "출결상황", mode: "attendance" },
  { label: "현황", mode: "status" },
  { label: "인증지표", mode: "certification" },
];

const statusModes: { label: string; mode: Mode }[] = [
  { label: "과정별", mode: "program" },
  { label: "국가별", mode: "nationality" },
  { label: "학과별", mode: "department" },
  { label: "학년별", mode: "grade" },
  { label: "남여별", mode: "gender" },
];

const certificationModes: { label: string; mode: Mode }[] = [
  { label: "보험상황", mode: "insurance" },
  { label: "토픽상황", mode: "topik" },
  { label: "중도탈락", mode: "dropout" },
  { label: "상담비율", mode: "counseling" },
];

const statusModeSet = new Set<Mode>(["status", "program", "nationality", "department", "grade", "gender"]);
const certificationModeSet = new Set<Mode>(["certification", "insurance", "topik", "dropout", "counseling"]);

export const dashboardModes = new Set<Mode>([
  "overview",
  "attendance",
  "status",
  "program",
  "nationality",
  "department",
  "grade",
  "gender",
  "certification",
  "insurance",
  "topik",
  "dropout",
  "counseling",
]);

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function getModeTitle(mode: Mode) {
  return (
    [...primaryModes, ...statusModes, ...certificationModes].find((item) => item.mode === mode)?.label ||
    "총괄보기"
  );
}

function modeIsActive(activeMode: Mode, mode: Mode) {
  if (mode === "status") return statusModeSet.has(activeMode);
  if (mode === "certification") return certificationModeSet.has(activeMode);
  return activeMode === mode;
}

function ModeButton({
  activeMode,
  label,
  mode,
}: {
  activeMode: Mode;
  label: string;
  mode: Mode;
}) {
  const active = modeIsActive(activeMode, mode);

  return (
    <button
      type="submit"
      name="mode"
      value={mode}
      aria-pressed={active}
      className={`h-10 shrink-0 rounded-md px-4 text-sm font-bold transition-smooth ${
        active
          ? "bg-[#47d7c6] text-[#061116] shadow-[0_0_32px_rgba(71,215,198,0.22)]"
          : "bg-white/7 text-[#b8c8d4] ring-1 ring-white/10 hover:bg-white/12 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ModeGroup({
  activeMode,
  title,
  items,
}: {
  activeMode: Mode;
  title: string;
  items: { label: string; mode: Mode }[];
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="shrink-0 text-xs font-bold text-[#718691]">{title}</div>
      <div className="flex min-w-0 gap-2 overflow-x-auto pb-1">
        {items.map((item) => (
          <ModeButton
            key={item.mode}
            activeMode={activeMode}
            label={item.label}
            mode={item.mode}
          />
        ))}
      </div>
    </div>
  );
}

function MetricTile({
  title,
  value,
  caption,
  tone = "teal",
}: {
  title: string;
  value: string;
  caption: string;
  tone?: "teal" | "blue" | "amber" | "red" | "green";
}) {
  const tones = {
    teal: "border-[#47d7c6]/35 bg-[#0d2426]",
    blue: "border-[#6aa8ff]/35 bg-[#0d1c2d]",
    amber: "border-[#e8c46a]/35 bg-[#29220e]",
    red: "border-[#f07188]/35 bg-[#2b1118]",
    green: "border-[#80d88a]/35 bg-[#102517]",
  };

  return (
    <section className={`min-h-32 rounded-lg border p-4 ${tones[tone]}`}>
      <div className="text-sm font-semibold text-[#a9bac4]">{title}</div>
      <div className="mt-4 font-mono text-4xl font-black leading-none text-white xl:text-5xl">{value}</div>
      <div className="mt-4 text-xs font-medium leading-5 text-[#7f939f]">{caption}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/6 px-3 py-3">
      <div className="text-xs font-semibold text-[#81949e]">{label}</div>
      <div className="mt-2 font-mono text-xl font-black text-white">{value}</div>
    </div>
  );
}

function Panel({
  children,
  title,
  action,
}: Readonly<{
  children: ReactNode;
  title: string;
  action?: ReactNode;
}>) {
  return (
    <section className="min-h-0 rounded-lg border border-white/10 bg-[#0d171d]/88 p-4 shadow-[0_24px_80px_-52px_rgba(0,0,0,0.9)]">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-black text-white">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid place-items-center">
      <div
        className="grid aspect-square w-full max-w-64 place-items-center rounded-full bg-[conic-gradient(#47d7c6_0deg,#47d7c6_calc(var(--score)*3.6deg),rgba(255,255,255,0.08)_0deg)] p-5"
        style={{ "--score": value } as CSSProperties}
      >
        <div className="grid h-full w-full place-items-center rounded-full bg-[#081018] text-center">
          <div>
            <div className="text-sm font-bold text-[#7f939f]">{label}</div>
            <div className="mt-2 font-mono text-5xl font-black text-[#47d7c6]">{formatPercent(value)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRows({
  items,
  limit = 8,
  showPercent = true,
}: {
  items: DistributionItem[];
  limit?: number;
  showPercent?: boolean;
}) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-3">
      {shown.map((item) => {
        const percent = total === 0 ? 0 : (item.value / total) * 100;

        return (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate font-semibold text-[#dce8ed]">{item.name}</span>
              <span className="shrink-0 font-mono text-[#47d7c6]">
                {formatNumber(item.value)}
                {showPercent ? ` · ${percent.toFixed(1)}%` : ""}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#47d7c6] via-[#6aa8ff] to-[#e8c46a]"
                style={{ width: `${Math.max((item.value / max) * 100, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BigBars({ items, limit = 10 }: { items: DistributionItem[]; limit?: number }) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map((item) => item.value), 1);

  return (
    <div className="grid h-full min-h-80 grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {shown.map((item) => (
        <div key={item.name} className="flex min-h-0 flex-col justify-end rounded-lg bg-white/5 p-3">
          <div className="flex flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-[#245d68] to-[#47d7c6]"
              style={{ height: `${Math.max((item.value / max) * 100, 6)}%` }}
            />
          </div>
          <div className="mt-3 min-h-10 text-xs font-bold leading-5 text-[#dce8ed]">{item.name}</div>
          <div className="font-mono text-xl font-black text-white">{formatNumber(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

function RecentClasses({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="space-y-2">
      {summary.recentClasses.slice(0, 6).map((session) => (
        <div key={session.id} className="flex items-center justify-between gap-3 rounded-md bg-white/6 px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{session.courseName}</div>
            <div className="mt-1 text-xs text-[#81949e]">
              {session.courseCode} · {session.room}
            </div>
          </div>
          <div className="shrink-0 font-mono text-xs text-[#47d7c6]">
            {new Date(session.scheduledAt).toLocaleTimeString("ko-KR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Overview({ summary }: { summary: DashboardSummary }) {
  const attentionTotal = summary.metrics.highRisk + summary.metrics.mediumRisk;

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-4 md:grid-cols-2">
        <MetricTile
          title="전체 학생"
          value={formatNumber(summary.metrics.totalStudents)}
          caption={`${summary.dataSource.label} · ${formatNumber(summary.dataSource.recordCount)}명`}
        />
        <MetricTile
          title="재학생"
          value={formatNumber(summary.metrics.activeStudents)}
          caption="학적상태 재학 기준"
          tone="green"
        />
        <MetricTile
          title="오늘 출석률"
          value={formatPercent(summary.metrics.attendanceRate)}
          caption={`${formatNumber(summary.metrics.attendanceEvents)}건 출결 이벤트`}
          tone="blue"
        />
        <MetricTile
          title="주의 학생"
          value={formatNumber(attentionTotal)}
          caption={`고위험 ${formatNumber(summary.metrics.highRisk)}명 · 주의 ${formatNumber(summary.metrics.mediumRisk)}명`}
          tone={attentionTotal > 0 ? "red" : "green"}
        />
      </div>

      <Panel
        title="오늘 출결"
        action={
          <button
            type="submit"
            name="mode"
            value="attendance"
            className="rounded-md bg-white/8 px-3 py-2 text-xs font-bold text-[#dce8ed] transition-smooth hover:bg-white/12"
          >
            출결상황
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
          <Gauge value={summary.metrics.attendanceRate} label="Attendance" />
          <div className="grid content-center gap-3">
            <MiniStat label="출석" value={formatNumber(summary.metrics.todayPresent)} />
            <MiniStat label="지각" value={formatNumber(summary.metrics.todayLate)} />
            <MiniStat label="결석" value={formatNumber(summary.metrics.todayAbsent)} />
            <MiniStat label="공결" value={formatNumber(summary.metrics.todayExcused)} />
          </div>
        </div>
      </Panel>

      <Panel title="현황 주요 분포">
        <div className="grid gap-5 lg:grid-cols-3">
          <ProgressRows items={summary.distributions.program} limit={5} />
          <ProgressRows items={summary.distributions.nationality} limit={5} />
          <ProgressRows items={summary.distributions.gender} limit={5} />
        </div>
      </Panel>

      <Panel title="인증지표 요약">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MiniStat label="보험 유효율" value={formatPercent(summary.metrics.insuranceCoverageRate)} />
          <MiniStat label="TOPIK 보유율" value={formatPercent(summary.metrics.topikRate)} />
          <MiniStat label="중도탈락" value={formatNumber(summary.metrics.dropoutStudents)} />
          <MiniStat label="상담비율" value={formatPercent(summary.metrics.counselingTargetRate)} />
        </div>
      </Panel>
    </div>
  );
}

function AttendanceView({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      <Panel title="출결상황">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Gauge value={summary.metrics.attendanceRate} label="Today" />
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricTile
              title="출석"
              value={formatNumber(summary.metrics.todayPresent)}
              caption="정상 체크인"
              tone="green"
            />
            <MetricTile
              title="지각"
              value={formatNumber(summary.metrics.todayLate)}
              caption="수업 시작 후 체크인"
              tone="amber"
            />
            <MetricTile
              title="결석"
              value={formatNumber(summary.metrics.todayAbsent)}
              caption="미확인 출결"
              tone="red"
            />
            <MetricTile
              title="공결"
              value={formatNumber(summary.metrics.todayExcused)}
              caption="사유 등록"
              tone="blue"
            />
          </div>
        </div>
      </Panel>

      <Panel title="오늘 수업">
        <RecentClasses summary={summary} />
      </Panel>
    </div>
  );
}

function StatusView({ summary, mode }: { summary: DashboardSummary; mode: Mode }) {
  const itemsByMode: Record<string, DistributionItem[]> = {
    status: summary.distributions.program,
    program: summary.distributions.program,
    nationality: summary.distributions.nationality,
    department: summary.distributions.department,
    grade: summary.distributions.grade,
    gender: summary.distributions.gender,
  };
  const titles: Record<string, string> = {
    status: "현황",
    program: "과정별 현황",
    nationality: "국가별 현황",
    department: "학과별 현황",
    grade: "학년별 현황",
    gender: "남여별 현황",
  };
  const items = itemsByMode[mode] || itemsByMode.status;

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <Panel title={titles[mode] || "현황"}>
        <BigBars items={items} limit={mode === "department" ? 10 : 8} />
      </Panel>

      <Panel title="상세 목록">
        <ProgressRows items={items} limit={mode === "department" ? 12 : 8} />
      </Panel>
    </div>
  );
}

function CertificationView({ summary, mode }: { summary: DashboardSummary; mode: Mode }) {
  const itemsByMode: Record<string, DistributionItem[]> = {
    certification: summary.distributions.insurance,
    insurance: summary.distributions.insurance,
    topik: summary.distributions.topik,
    dropout: summary.distributions.dropout,
    counseling: summary.distributions.counseling,
  };
  const titles: Record<string, string> = {
    certification: "인증지표",
    insurance: "보험상황",
    topik: "토픽상황",
    dropout: "중도탈락",
    counseling: "상담비율",
  };
  const items = itemsByMode[mode] || itemsByMode.certification;

  return (
    <div className="grid min-h-0 gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricTile
          title="보험 유효율"
          value={formatPercent(summary.metrics.insuranceCoverageRate)}
          caption={`만료 30일 이내 ${formatNumber(summary.metrics.insuranceDue)}명`}
          tone="green"
        />
        <MetricTile
          title="TOPIK 보유율"
          value={formatPercent(summary.metrics.topikRate)}
          caption={`TOPIK ${formatNumber(summary.metrics.topikStudents)}명 · 어학연수 ${formatNumber(summary.metrics.languageTrainingCompleted)}명`}
          tone="blue"
        />
        <MetricTile
          title="중도탈락"
          value={formatNumber(summary.metrics.dropoutStudents)}
          caption={`전체 대비 ${formatPercent(summary.metrics.dropoutRate)}`}
          tone={summary.metrics.dropoutStudents > 0 ? "red" : "green"}
        />
        <MetricTile
          title="상담비율"
          value={formatPercent(summary.metrics.counselingTargetRate)}
          caption={`상담 우선 ${formatNumber(summary.metrics.counselingTargets)}명`}
          tone={summary.metrics.counselingTargets > 0 ? "amber" : "green"}
        />
      </div>

      <Panel title={titles[mode] || "인증지표"}>
        <BigBars items={items} limit={6} />
      </Panel>
    </div>
  );
}

function ActivePanel({
  activeMode,
  summary,
}: {
  activeMode: Mode;
  summary: DashboardSummary;
}) {
  if (activeMode === "attendance") {
    return <AttendanceView summary={summary} />;
  }

  if (statusModeSet.has(activeMode)) {
    return <StatusView mode={activeMode} summary={summary} />;
  }

  if (certificationModeSet.has(activeMode)) {
    return <CertificationView mode={activeMode} summary={summary} />;
  }

  return <Overview summary={summary} />;
}

export function DashboardMonitor({ activeMode, summary }: { activeMode: Mode; summary: DashboardSummary }) {
  const generatedAt = new Date(summary.generatedAt).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-[#081018] text-white lg:h-screen lg:overflow-hidden">
      <script
        dangerouslySetInnerHTML={{
          __html: "window.setTimeout(function(){ window.location.reload(); }, 60000);",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,#081018_0%,#0d1b22_48%,#10130f_100%)]" />
      <div className="noise-layer opacity-[0.025]" />

      <div className="flex min-h-screen flex-col px-4 py-4 sm:px-5 lg:h-screen">
        <header className="shrink-0 border-b border-white/10 pb-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#47d7c6]">KMUST Live Board</div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white xl:text-5xl">
                외국인학생 현황 대시보드
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 text-right sm:flex sm:items-end sm:justify-end">
              <MiniStat label="모드" value={getModeTitle(activeMode)} />
              <MiniStat label="자료" value={summary.dataSource.type === "sqlite" ? "DB" : "SEED"} />
              <MiniStat label="갱신" value={generatedAt} />
            </div>
          </div>

          <form action="/" className="mt-4 grid gap-3 xl:grid-cols-[auto_1fr_1fr]" aria-label="대시보드 모드 선택">
            <ModeGroup activeMode={activeMode} title="대시보드" items={primaryModes} />
            <ModeGroup activeMode={activeMode} title="현황" items={statusModes} />
            <ModeGroup activeMode={activeMode} title="인증" items={certificationModes} />
          </form>
        </header>

        <section className="min-h-0 flex-1 py-4">
          <form action="/" className="contents">
            <ActivePanel activeMode={activeMode} summary={summary} />
          </form>
        </section>
      </div>
    </main>
  );
}
