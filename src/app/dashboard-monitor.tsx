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
  { label: "현황보기", mode: "status" },
  { label: "인증지표", mode: "certification" },
];

const statusModes: { label: string; mode: Mode }[] = [
  { label: "과정별", mode: "program" },
  { label: "국가별", mode: "nationality" },
  { label: "학과별", mode: "department" },
  { label: "학년별", mode: "grade" },
];

const certificationModes: { label: string; mode: Mode }[] = [
  { label: "중도탈락율", mode: "dropout" },
  { label: "토픽취득율", mode: "topik" },
  { label: "보험가입율", mode: "insurance" },
  { label: "상담비율", mode: "counseling" },
];

const statusModeSet = new Set<Mode>(["status", "program", "nationality", "department", "grade"]);
const certificationModeSet = new Set<Mode>(["certification", "insurance", "topik", "dropout", "counseling"]);

export const dashboardModes = new Set<Mode>([
  "overview",
  "attendance",
  "status",
  "program",
  "nationality",
  "department",
  "grade",
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

function getDegreeDropoutThreshold(totalStudents: number) {
  if (totalStudents < 100) return 8;
  if (totalStudents < 500) return 7;
  if (totalStudents < 1000) return 6.5;
  return 6;
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
      className={`h-9 shrink-0 rounded-md px-3.5 text-sm font-bold transition-smooth ${
        active
          ? "bg-[#47d7c6] text-[#061116] shadow-[0_0_32px_rgba(71,215,198,0.22)]"
          : "bg-white/[0.06] text-[#b8c8d4] ring-1 ring-white/[0.08] hover:bg-white/[0.1] hover:text-white"
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
    <section className={`flex h-full min-h-0 flex-col rounded-lg border p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${tones[tone]}`}>
      <div className="text-sm font-semibold text-[#a9bac4]">{title}</div>
      <div className="mt-auto pt-4 font-mono text-4xl font-black leading-none text-white xl:text-5xl">{value}</div>
      <div className="mt-4 text-xs font-medium leading-5 text-[#7f939f]">{caption}</div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.055] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="text-xs font-semibold text-[#7f949f]">{label}</div>
      <div className="mt-1.5 font-mono text-lg font-black leading-none text-white">{value}</div>
    </div>
  );
}

function Panel({
  children,
  title,
  action,
  className = "",
}: Readonly<{
  children: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
}>) {
  return (
    <section className={`monitor-panel flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-[#0b151b]/92 p-4 shadow-[0_26px_90px_-64px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.035)] ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-black text-white">{title}</h2>
        {action}
      </div>
      <div className="mt-3 min-h-0 flex-1 overflow-hidden">{children}</div>
    </section>
  );
}

function Gauge({ value, label }: { value: number; label: string }) {
  return (
    <div className="grid place-items-center">
      <div
        className="grid aspect-square w-full max-w-56 place-items-center rounded-full bg-[conic-gradient(#47d7c6_0deg,#47d7c6_calc(var(--score)*3.6deg),rgba(255,255,255,0.08)_0deg)] p-4 shadow-[0_0_42px_rgba(71,215,198,0.12)]"
        style={{ "--score": value } as CSSProperties}
      >
        <div className="grid h-full w-full place-items-center rounded-full border border-white/[0.06] bg-[#071018] text-center">
          <div>
            <div className="text-sm font-bold text-[#7f939f]">{label}</div>
            <div className="mt-2 font-mono text-4xl font-black text-[#47d7c6]">{formatPercent(value)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactAttendanceLine({
  title,
  rate,
  total,
  present,
  late,
  absent,
  excused,
}: {
  title: string;
  rate: number;
  total: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
}) {
  const items = [
    ["출석", present],
    ["지각", late],
    ["결석", absent],
    ["공결", excused],
  ] as const;

  return (
    <div className="rounded-md bg-white/6 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black text-[#81949e]">{title}</div>
          <div className="mt-1 font-mono text-3xl font-black leading-none text-white">{formatPercent(rate)}</div>
        </div>
        <div className="shrink-0 text-right text-xs font-semibold leading-5 text-[#7f939f]">
          {formatNumber(total)}건
        </div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-md bg-black/18 px-2 py-2">
            <div className="truncate text-[11px] font-semibold text-[#81949e]">{label}</div>
            <div className="mt-1 font-mono text-lg font-black leading-none text-white">{formatNumber(value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AbsenceThresholdSummary({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid h-full min-h-0 gap-3 sm:grid-cols-3">
      <MetricTile
        title="3과목 이상"
        value={formatNumber(summary.metrics.absenceOver3)}
        caption="출결 관찰 대상"
        tone={summary.metrics.absenceOver3 > 0 ? "amber" : "green"}
      />
      <MetricTile
        title="5과목 이상"
        value={formatNumber(summary.metrics.absenceOver5)}
        caption="집중 상담 권장"
        tone={summary.metrics.absenceOver5 > 0 ? "red" : "green"}
      />
      <MetricTile
        title="7과목 이상"
        value={formatNumber(summary.metrics.absenceOver7)}
        caption="즉시 확인 대상"
        tone={summary.metrics.absenceOver7 > 0 ? "red" : "green"}
      />
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

function AbsenceObservationList({ summary, limit = 8 }: { summary: DashboardSummary; limit?: number }) {
  const targets = summary.absenceWatchStudents
    .filter((item) => item.absentCount >= 3)
    .slice(0, limit);

  if (targets.length === 0) {
    return (
      <div className="rounded-md border border-white/[0.06] bg-white/[0.055] p-4 text-sm font-semibold text-[#9eb0bb]">
        최근 1주일 기준 출결 관찰 대상 없음
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-2">
      {targets.map((item) => (
        <div
          key={item.student.studentNo}
          className="grid min-h-0 gap-3 rounded-md border border-white/[0.05] bg-white/[0.055] px-3 py-2.5 sm:grid-cols-[1fr_auto]"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-white">
              {item.student.studentNo} · {item.student.department || item.student.program}
            </div>
            <div className="mt-1 truncate text-xs font-semibold text-[#81949e]">
              결석 과목 {item.courseNames.join(", ") || "미확인"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-right">
            <MiniStat label="결석" value={formatNumber(item.absentCount)} />
            <MiniStat label="지각" value={formatNumber(item.lateCount)} />
            <MiniStat label="공결" value={formatNumber(item.excusedCount)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentClasses({ summary, limit = 6 }: { summary: DashboardSummary; limit?: number }) {
  return (
    <div className="grid h-full min-h-0 content-between gap-2">
      {summary.recentClasses.slice(0, limit).map((session) => (
        <div
          key={session.id}
          className="flex min-h-0 items-center justify-between gap-3 rounded-md border border-white/[0.05] bg-white/[0.055] px-3 py-2"
        >
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
    <div className="monitor-grid grid h-full min-h-0 gap-3 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="overview-left-column grid h-full min-h-0 gap-3 xl:grid-rows-[1fr_1fr]">
        <div className="grid h-full min-h-0 auto-rows-fr gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            title="최근 1주일 출석률"
            value={formatPercent(summary.metrics.weeklyAttendanceRate)}
            caption={`${formatNumber(summary.metrics.weeklyAttendanceEvents)}건 출결 이벤트`}
            tone="teal"
          />
          <MetricTile
            title="출결 관찰 대상"
            value={formatNumber(summary.metrics.attendanceObservationTargets)}
            caption={`3과목 이상 결석 · 5과목 이상 ${formatNumber(summary.metrics.absenceOver5)}명 · 7과목 이상 ${formatNumber(summary.metrics.absenceOver7)}명`}
            tone={summary.metrics.attendanceObservationTargets > 0 ? "amber" : "green"}
          />
          <MetricTile
            title="주의 학생"
            value={formatNumber(attentionTotal)}
            caption={`고위험 ${formatNumber(summary.metrics.highRisk)}명 · 주의 ${formatNumber(summary.metrics.mediumRisk)}명`}
            tone={attentionTotal > 0 ? "red" : "green"}
          />
        </div>

        <Panel title="현황 주요 분포">
          <div className="grid gap-5 lg:grid-cols-3">
            <ProgressRows items={summary.distributions.program} limit={5} />
            <ProgressRows items={summary.distributions.nationality} limit={5} />
            <ProgressRows items={summary.distributions.gender} limit={5} />
          </div>
        </Panel>
      </div>

      <div className="overview-right-column grid h-full min-h-0 gap-3 xl:grid-rows-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
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
          <div className="grid h-full min-h-0 content-between gap-2">
            <CompactAttendanceLine
              title="오늘 출결"
              rate={summary.metrics.attendanceRate}
              total={summary.metrics.attendanceEvents}
              present={summary.metrics.todayPresent}
              late={summary.metrics.todayLate}
              absent={summary.metrics.todayAbsent}
              excused={summary.metrics.todayExcused}
            />
            <CompactAttendanceLine
              title="최근 1주일 출결"
              rate={summary.metrics.weeklyAttendanceRate}
              total={summary.metrics.weeklyAttendanceEvents}
              present={summary.metrics.weeklyPresent}
              late={summary.metrics.weeklyLate}
              absent={summary.metrics.weeklyAbsent}
              excused={summary.metrics.weeklyExcused}
            />
          </div>
        </Panel>

        <Panel title="인증지표 요약">
          <div className="grid h-full min-h-0 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="중도탈락율" value={formatPercent(summary.metrics.dropoutRate)} />
            <MiniStat label="토픽취득율" value={formatPercent(summary.metrics.topikRate)} />
            <MiniStat label="보험가입율" value={formatPercent(summary.metrics.insuranceCoverageRate)} />
            <MiniStat label="상담비율" value={formatPercent(summary.metrics.counselingTargetRate)} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AttendanceView({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="monitor-grid grid h-full min-h-0 gap-3 xl:grid-cols-[0.82fr_1.18fr]">
      <div className="attendance-left-column grid h-full min-h-0 gap-3 xl:grid-rows-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
        <Panel title="출결상황" className="attendance-main-panel">
          <div className="attendance-main-grid grid h-full min-h-0 items-center gap-3 lg:grid-cols-[0.58fr_1.42fr]">
            <Gauge value={summary.metrics.attendanceRate} label="Today" />
            <div className="grid min-h-0 content-center gap-3">
              <CompactAttendanceLine
                title="오늘 출결"
                rate={summary.metrics.attendanceRate}
                total={summary.metrics.attendanceEvents}
                present={summary.metrics.todayPresent}
                late={summary.metrics.todayLate}
                absent={summary.metrics.todayAbsent}
                excused={summary.metrics.todayExcused}
              />
              <CompactAttendanceLine
                title="최근 1주일 출결"
                rate={summary.metrics.weeklyAttendanceRate}
                total={summary.metrics.weeklyAttendanceEvents}
                present={summary.metrics.weeklyPresent}
                late={summary.metrics.weeklyLate}
                absent={summary.metrics.weeklyAbsent}
                excused={summary.metrics.weeklyExcused}
              />
            </div>
          </div>
        </Panel>

        <Panel title="오늘 수업">
          <RecentClasses summary={summary} limit={3} />
        </Panel>
      </div>

      <div className="attendance-right-column grid h-full min-h-0 gap-3 xl:grid-rows-[minmax(0,0.36fr)_minmax(0,0.64fr)]">
        <Panel title="결석 누적 관찰">
          <div className="grid h-full min-h-0 gap-3">
            <div className="text-sm font-semibold leading-6 text-[#9eb0bb]">
              최근 1주일 기준 결석 과목 수로 출결 관찰 대상을 분류합니다.
            </div>
            <AbsenceThresholdSummary summary={summary} />
          </div>
        </Panel>

        <Panel title="관찰 대상 리스트">
          <AbsenceObservationList summary={summary} limit={4} />
        </Panel>
      </div>
    </div>
  );
}

function StatusOverviewPanel({
  title,
  items,
  limit = 6,
}: {
  title: string;
  items: DistributionItem[];
  limit?: number;
}) {
  return (
    <Panel title={title} className="status-overview-panel">
      <ProgressRows items={items} limit={limit} />
    </Panel>
  );
}

function StatusView({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="monitor-grid status-overview-grid grid h-full min-h-0 gap-3 md:grid-cols-2 md:grid-rows-[repeat(2,minmax(0,1fr))]">
      <StatusOverviewPanel title="과정별 현황" items={summary.distributions.program} limit={5} />
      <StatusOverviewPanel title="국가별 현황" items={summary.distributions.nationality} limit={5} />
      <StatusOverviewPanel title="학과별 현황" items={summary.distributions.department} limit={6} />
      <StatusOverviewPanel title="학년별 현황" items={summary.distributions.grade} limit={6} />
    </div>
  );
}

type CertificationMode = "dropout" | "topik" | "insurance" | "counseling";

type CertificationIndicator = {
  mode: CertificationMode;
  title: string;
  value: string;
  score: number;
  count: string;
  criterion: string;
  formula: string;
  evidence: string;
  note: string;
  status: string;
  tone: "blue" | "amber" | "red" | "green";
  items: DistributionItem[];
};

function getCertificationIndicators(summary: DashboardSummary): CertificationIndicator[] {
  const totalStudents = summary.metrics.totalStudents;
  const dropoutThreshold = getDegreeDropoutThreshold(totalStudents);

  return [
    {
      mode: "dropout",
      title: "중도탈락율",
      value: formatPercent(summary.metrics.dropoutRate),
      score: summary.metrics.dropoutRate,
      count: `${formatNumber(summary.metrics.dropoutStudents)} / ${formatNumber(totalStudents)}명`,
      criterion: `문서 기준: ${formatPercent(dropoutThreshold)} 미만`,
      formula: "(분자) 중도탈락 학생 수 / (분모) 외국인 재적학생 수",
      evidence: "대학정보공시 4-바-2 외국인 유학생 중도탈락률",
      note: "학위과정 C. 유학생 관리 및 성과 기준",
      status: summary.metrics.dropoutRate < dropoutThreshold ? "기준 충족" : "관리 필요",
      tone: summary.metrics.dropoutRate < dropoutThreshold ? "green" : "red",
      items: summary.distributions.dropout,
    },
    {
      mode: "topik",
      title: "토픽취득율",
      value: formatPercent(summary.metrics.topikRate),
      score: summary.metrics.topikRate,
      count: `${formatNumber(summary.metrics.topikStudents)} / ${formatNumber(totalStudents)}명`,
      criterion: "문서 기준: TOPIK 등 공인 언어능력 40% 이상",
      formula: "(분자) TOPIK 등 공인 언어능력 충족 학생 수 / (분모) 외국인 유학생 수",
      evidence: "신입생 및 재학생 TOPIK 성적, 입학서류, 졸업요건 증빙",
      note: "현재 데이터는 TOPIK 보유 항목을 기준으로 산출",
      status: summary.metrics.topikRate >= 40 ? "기준 충족" : "관리 필요",
      tone: summary.metrics.topikRate >= 40 ? "green" : "red",
      items: summary.distributions.topik,
    },
    {
      mode: "insurance",
      title: "보험가입율",
      value: formatPercent(summary.metrics.insuranceCoverageRate),
      score: summary.metrics.insuranceCoverageRate,
      count: `${formatNumber(summary.metrics.activeInsurance)} / ${formatNumber(totalStudents)}명`,
      criterion: "문서 기준: 의료보험 가입률 95% 이상",
      formula: "(분자) 보험 가입·유효 학생 수 / (분모) 외국인 유학생 수",
      evidence: "외국인 어학연수생이 가입 중인 의료보험 현황",
      note: `만료 30일 이내 ${formatNumber(summary.metrics.insuranceDue)}명`,
      status: summary.metrics.insuranceCoverageRate >= 95 ? "기준 충족" : "관리 필요",
      tone: summary.metrics.insuranceCoverageRate >= 95 ? "green" : "red",
      items: summary.distributions.insurance,
    },
    {
      mode: "counseling",
      title: "상담비율",
      value: formatPercent(summary.metrics.counselingTargetRate),
      score: summary.metrics.counselingTargetRate,
      count: `${formatNumber(summary.metrics.counselingTargets)} / ${formatNumber(totalStudents)}명`,
      criterion: "문서 기준: 상담(정신건강) 포함 관리 3점 이상",
      formula: "(분자) 상담 우선관리 학생 수 / (분모) 외국인 유학생 수",
      evidence: "만족도 조사 결과보고서, 상담(정신건강) 포함 관리계획",
      note: "정량 기준이 아닌 정성 관리 지표로 별도 증빙 필요",
      status: "정성 관리",
      tone: "amber",
      items: summary.distributions.counseling,
    },
  ];
}

function IndicatorCard({
  active,
  indicator,
}: {
  active: boolean;
  indicator: CertificationIndicator;
}) {
  const activeTone = {
    blue: "border-[#6aa8ff]/42 bg-[#0c1a27]",
    amber: "border-[#e8c46a]/42 bg-[#221c0d]",
    red: "border-[#f07188]/42 bg-[#241017]",
    green: "border-[#80d88a]/42 bg-[#0d2014]",
  };
  const progress = Math.min(Math.max(indicator.score, 0), 100);

  return (
    <button
      type="submit"
      name="mode"
      value={indicator.mode}
      aria-pressed={active}
      className={`flex h-full min-h-0 flex-col rounded-lg border p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition-smooth ${
        active
          ? activeTone[indicator.tone]
          : "border-white/[0.08] bg-white/[0.045] hover:border-[#47d7c6]/35 hover:bg-white/[0.07]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-black text-white">{indicator.title}</div>
        <span className="shrink-0 rounded-md bg-black/28 px-2 py-1 text-[11px] font-black text-[#dce8ed]">
          {indicator.status}
        </span>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
        <div className="font-mono text-4xl font-black leading-none text-white">{indicator.value}</div>
        <div className="font-mono text-sm font-black text-[#47d7c6]">{indicator.count}</div>
      </div>
      <div className="mt-3 text-xs font-semibold leading-5 text-[#9eb0bb]">{indicator.criterion}</div>
      <div className="indicator-progress mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#47d7c6] via-[#6aa8ff] to-[#e8c46a]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </button>
  );
}

function CertificationDetail({ indicator }: { indicator: CertificationIndicator }) {
  return (
    <div className="grid h-full min-h-0 gap-3">
      <div className="rounded-md border border-white/[0.06] bg-white/[0.055] p-3">
        <div className="text-xs font-bold text-[#718691]">선택 지표</div>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div className="text-2xl font-black text-white">{indicator.title}</div>
          <div className="font-mono text-3xl font-black text-[#47d7c6]">{indicator.value}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStat label="기준" value={indicator.criterion.replace("문서 기준: ", "")} />
        <MiniStat label="상태" value={indicator.status} />
      </div>

      <div className="grid min-h-0 gap-2 text-sm leading-6 text-[#c8d5dc]">
        <div className="rounded-md border border-white/[0.05] bg-black/12 px-3 py-2">
          <span className="font-black text-white">산식</span>
          <span className="ml-2">{indicator.formula}</span>
        </div>
        <div className="rounded-md border border-white/[0.05] bg-black/12 px-3 py-2">
          <span className="font-black text-white">증빙</span>
          <span className="ml-2">{indicator.evidence}</span>
        </div>
        <div className="rounded-md border border-white/[0.05] bg-black/12 px-3 py-2">
          <span className="font-black text-white">참고</span>
          <span className="ml-2">{indicator.note}</span>
        </div>
      </div>
    </div>
  );
}

function CertificationView({ summary, mode }: { summary: DashboardSummary; mode: Mode }) {
  const indicators = getCertificationIndicators(summary);
  const selected = indicators.find((indicator) => indicator.mode === mode) || indicators[0];

  return (
    <div className="monitor-grid grid h-full min-h-0 gap-3 xl:grid-cols-[0.72fr_1.28fr]">
      <div className="certification-index grid h-full min-h-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:grid-rows-[repeat(4,minmax(0,1fr))]">
        {indicators.map((indicator) => (
          <IndicatorCard
            key={indicator.mode}
            active={selected.mode === indicator.mode}
            indicator={indicator}
          />
        ))}
      </div>

      <div className="certification-detail-grid grid h-full min-h-0 gap-3 xl:grid-rows-[minmax(0,0.53fr)_minmax(0,0.47fr)]">
        <Panel title="교육국제화역량 인증제 추진계획">
          <CertificationDetail indicator={selected} />
        </Panel>

        <Panel title={`${selected.title} 현황`}>
          <ProgressRows items={selected.items} limit={6} />
        </Panel>
      </div>
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
    return <StatusView summary={summary} />;
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
    <main className="min-h-screen bg-[#070d12] text-white lg:h-screen lg:overflow-hidden">
      <script
        dangerouslySetInnerHTML={{
          __html: "window.setTimeout(function(){ window.location.reload(); }, 60000);",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(135deg,#070d12_0%,#0b171d_50%,#0b0f12_100%)]" />
      <div className="noise-layer opacity-[0.02]" />

      <div className="flex min-h-screen flex-col px-3 py-3 sm:px-4 lg:h-screen">
        <header className="shrink-0 border-b border-white/10 pb-2">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-[#47d7c6]">KMUST Live Board</div>
              <h1 className="mt-0.5 text-3xl font-black tracking-tight text-white xl:text-4xl 2xl:text-[2.65rem]">
                외국인학생 현황 대시보드
              </h1>
            </div>
            <div className="grid grid-cols-3 gap-2 text-right sm:flex sm:items-end sm:justify-end">
              <MiniStat label="모드" value={getModeTitle(activeMode)} />
              <MiniStat label="자료" value={summary.dataSource.type === "sqlite" ? "DB" : "SEED"} />
              <MiniStat label="갱신" value={generatedAt} />
            </div>
          </div>

          <form action="/" className="mt-3 grid gap-2 xl:grid-cols-[auto_1fr_1fr]" aria-label="대시보드 모드 선택">
            <ModeGroup activeMode={activeMode} title="대시보드" items={primaryModes} />
            <ModeGroup activeMode={activeMode} title="현황" items={statusModes} />
            <ModeGroup activeMode={activeMode} title="인증" items={certificationModes} />
          </form>
        </header>

        <section className="dashboard-stage min-h-0 flex-1 py-3">
          <form action="/" className="contents">
            <ActivePanel activeMode={activeMode} summary={summary} />
          </form>
        </section>
      </div>
    </main>
  );
}
