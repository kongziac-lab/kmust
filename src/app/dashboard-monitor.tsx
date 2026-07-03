"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { dashboardModes, type Mode } from "@/lib/dashboard-modes";
import type { DashboardSummary } from "@/lib/summary";

type DistributionItem = {
  name: string;
  value: number;
};

type ModeChangeHandler = (mode: Mode) => void;
type EnrollmentFilter = "enrolled" | "active" | "leave";
type StatusDimension = "program" | "nationality" | "department" | "grade";
type StatusFilterDimension = "all" | StatusDimension;
type StatusRecord = DashboardSummary["statusGroups"]["enrolled"]["records"][number];
type CombinationRow = {
  name: string;
  value: number;
  segments: DistributionItem[];
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
  { label: "조합분석", mode: "programNationality" },
];

const enrollmentFilters: { label: string; value: EnrollmentFilter }[] = [
  { label: "재적", value: "enrolled" },
  { label: "재학", value: "active" },
  { label: "휴학", value: "leave" },
];

const certificationModes: { label: string; mode: Mode }[] = [
  { label: "중도탈락율", mode: "dropout" },
  { label: "토픽취득율", mode: "topik" },
  { label: "보험가입율", mode: "insurance" },
  { label: "상담비율", mode: "counseling" },
];

const statusModeSet = new Set<Mode>(["status", "program", "nationality", "department", "grade", "programNationality"]);
const certificationModeSet = new Set<Mode>(["certification", "insurance", "topik", "dropout", "counseling"]);
const dashboardSummaryEndpoint = "/api/dashboard/summary";
const dashboardSummaryPollingMs = 10_000;
const statusDimensionOptions: { label: string; value: StatusDimension }[] = [
  { label: "과정", value: "program" },
  { label: "국가", value: "nationality" },
  { label: "학과", value: "department" },
  { label: "학년", value: "grade" },
];
const statusFilterOptions: { label: string; value: StatusFilterDimension }[] = [
  { label: "전체", value: "all" },
  ...statusDimensionOptions,
];

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatRatioCount(value: number, total: number) {
  return `${formatNumber(value)}/${formatNumber(total)}명`;
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function getStatusDimensionLabel(dimension: StatusDimension) {
  return statusDimensionOptions.find((item) => item.value === dimension)?.label || "현황";
}

function getAlternateDimension(dimension: StatusDimension) {
  return statusDimensionOptions.find((item) => item.value !== dimension)?.value || "program";
}

function getStatusRecordValue(record: StatusRecord, dimension: StatusDimension) {
  return record[dimension] || "미상";
}

function sortKoreanValue(a: string, b: string) {
  return a.localeCompare(b, "ko-KR", { numeric: true });
}

function getStatusDimensionValues(records: StatusRecord[], dimension: StatusDimension) {
  return [...new Set(records.map((record) => getStatusRecordValue(record, dimension)))].sort(sortKoreanValue);
}

function getEffectiveFilterValue(
  records: StatusRecord[],
  filterDimension: StatusFilterDimension,
  filterValue: string,
) {
  if (filterDimension === "all") return "";

  const values = getStatusDimensionValues(records, filterDimension);
  return values.includes(filterValue) ? filterValue : values[0] || "";
}

function getFilteredStatusRecords(
  records: StatusRecord[],
  filterDimension: StatusFilterDimension,
  filterValue: string,
) {
  if (filterDimension === "all" || !filterValue) return records;

  return records.filter((record) => getStatusRecordValue(record, filterDimension) === filterValue);
}

function buildCombinationRows(
  records: StatusRecord[],
  rowDimension: StatusDimension,
  columnDimension: StatusDimension,
): CombinationRow[] {
  const rows = new Map<string, Map<string, number>>();

  for (const record of records) {
    const rowKey = getStatusRecordValue(record, rowDimension);
    const columnKey = getStatusRecordValue(record, columnDimension);
    const row = rows.get(rowKey) || new Map<string, number>();

    row.set(columnKey, (row.get(columnKey) || 0) + 1);
    rows.set(rowKey, row);
  }

  return [...rows.entries()]
    .map(([name, columnCounts]) => {
      const segments = [...columnCounts.entries()]
        .map(([segmentName, value]) => ({ name: segmentName, value }))
        .sort((a, b) => b.value - a.value || sortKoreanValue(a.name, b.name));

      return {
        name,
        value: segments.reduce((sum, segment) => sum + segment.value, 0),
        segments,
      };
    })
    .sort((a, b) => b.value - a.value || sortKoreanValue(a.name, b.name));
}

function getCombinationTitle(
  rowDimension: StatusDimension,
  columnDimension: StatusDimension,
  filterDimension: StatusFilterDimension,
  filterValue: string,
) {
  const title = `${getStatusDimensionLabel(rowDimension)}별 ${getStatusDimensionLabel(columnDimension)} 현황`;

  if (filterDimension === "all" || !filterValue) {
    return title;
  }

  return `${filterValue} 기준 ${title}`;
}

function getSeoulDateParts(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function formatSeoulDateTime(value: string | Date) {
  const parts = getSeoulDateParts(value);
  const hour = Number(parts.hour) % 24;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = String(hour % 12 || 12).padStart(2, "0");

  return `${parts.month}. ${parts.day}. ${period} ${displayHour}:${parts.minute}`;
}

function formatSeoulTime(value: string | Date) {
  const parts = getSeoulDateParts(value);
  const hour = Number(parts.hour) % 24;
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = String(hour % 12 || 12).padStart(2, "0");

  return `${period} ${displayHour}:${parts.minute}`;
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

function normalizeModeValue(value: string | null | undefined): Mode {
  return dashboardModes.has(value as Mode) ? (value as Mode) : "overview";
}

function updateModeUrl(mode: Mode) {
  const url = new URL(window.location.href);

  if (mode === "overview") {
    url.searchParams.delete("mode");
  } else {
    url.searchParams.set("mode", mode);
  }

  window.history.pushState({ mode }, "", `${url.pathname}${url.search}${url.hash}`);
}

function ModeButton({
  activeMode,
  label,
  mode,
  onModeChange,
}: {
  activeMode: Mode;
  label: string;
  mode: Mode;
  onModeChange: ModeChangeHandler;
}) {
  const active = modeIsActive(activeMode, mode);

  return (
    <button
      type="button"
      value={mode}
      aria-pressed={active}
      data-mode-control="true"
      data-mode={mode}
      onClick={() => onModeChange(mode)}
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
  onModeChange,
}: {
  activeMode: Mode;
  title: string;
  items: { label: string; mode: Mode }[];
  onModeChange: ModeChangeHandler;
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
            onModeChange={onModeChange}
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

function OverviewAttendanceLine({
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
    <div className="overview-attendance-line grid min-h-0 gap-3 rounded-md border border-white/[0.06] bg-white/[0.055] px-3 py-2.5 xl:grid-cols-[minmax(9rem,0.72fr)_minmax(0,1.28fr)]">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate text-xs font-black text-[#9eb0bb]">{title}</div>
          <div className="shrink-0 font-mono text-xs font-bold text-[#81949e]">{formatNumber(total)}건</div>
        </div>
        <div className="mt-1.5 font-mono text-3xl font-black leading-none text-white">{formatPercent(rate)}</div>
      </div>
      <div className="overview-attendance-breakdown grid min-w-0 grid-cols-4 gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-md bg-black/18 px-2.5 py-2">
            <div className="truncate text-[11px] font-semibold text-[#8ca1ac]">{label}</div>
            <div className="mt-1 font-mono text-base font-black leading-none text-white">{formatNumber(value)}</div>
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
    .filter((item) => item.absentCount >= 3);
  const rolling = targets.length > limit;
  const rollDuration = `${Math.max(targets.length * 3.5, 26)}s`;

  function renderTarget(item: (typeof targets)[number], key: string) {
    return (
      <div
        key={key}
        className="absence-roll-row grid min-h-0 gap-3 rounded-md border border-white/[0.05] bg-white/[0.055] px-3 py-2.5 sm:grid-cols-[1fr_auto]"
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
    );
  }

  if (targets.length === 0) {
    return (
      <div className="rounded-md border border-white/[0.06] bg-white/[0.055] p-4 text-sm font-semibold text-[#9eb0bb]">
        최근 1주일 기준 출결 관찰 대상 없음
      </div>
    );
  }

  return (
    <div
      className="absence-roll h-full min-h-0 overflow-hidden pr-1"
      aria-label="최근 1주일 출결 관찰 대상 롤링 리스트"
      style={{ "--roll-duration": rollDuration } as CSSProperties}
    >
      <div className="absence-roll-track flex flex-col" data-rolling={rolling ? "true" : "false"}>
        <div className="grid gap-2">
          {targets.map((item) => renderTarget(item, item.student.studentNo))}
        </div>
        {rolling ? (
          <div className="grid gap-2" aria-hidden="true">
            {targets.map((item) => renderTarget(item, `repeat-${item.student.studentNo}`))}
          </div>
        ) : null}
      </div>
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
            {formatSeoulTime(session.scheduledAt)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Overview({ onModeChange, summary }: { onModeChange: ModeChangeHandler; summary: DashboardSummary }) {
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

      <div className="overview-right-column grid h-full min-h-0 gap-3 xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel
          title="오늘 출결"
          className="overview-attendance-panel"
          action={
            <button
              type="button"
              value="attendance"
              data-mode-control="true"
              data-mode="attendance"
              onClick={() => onModeChange("attendance")}
              className="rounded-md bg-white/8 px-3 py-2 text-xs font-bold text-[#dce8ed] transition-smooth hover:bg-white/12"
            >
              출결상황
            </button>
          }
        >
          <div className="grid h-full min-h-0 grid-rows-2 gap-3">
            <OverviewAttendanceLine
              title="오늘 출결"
              rate={summary.metrics.attendanceRate}
              total={summary.metrics.attendanceEvents}
              present={summary.metrics.todayPresent}
              late={summary.metrics.todayLate}
              absent={summary.metrics.todayAbsent}
              excused={summary.metrics.todayExcused}
            />
            <OverviewAttendanceLine
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
          <CertificationSummaryGrid summary={summary} />
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
  mode,
  onModeChange,
  limit = 6,
}: {
  title: string;
  items: DistributionItem[];
  mode: Mode;
  onModeChange: ModeChangeHandler;
  limit?: number;
}) {
  return (
    <Panel
      title={title}
      className="status-overview-panel"
      action={
        <button
          type="button"
          value={mode}
          data-mode-control="true"
          data-mode={mode}
          onClick={() => onModeChange(mode)}
          className="rounded-md bg-white/8 px-3 py-2 text-xs font-bold text-[#dce8ed] transition-smooth hover:bg-white/12"
        >
          상세내역
        </button>
      }
    >
      <ProgressRows items={items} limit={limit} />
    </Panel>
  );
}

type StatusGroup = DashboardSummary["statusGroups"][EnrollmentFilter];

function getEnrollmentFilterTotal(summary: DashboardSummary, filter: EnrollmentFilter) {
  return summary.statusGroups[filter].total;
}

function EnrollmentStatusToggle({
  activeFilter,
  onFilterChange,
  summary,
}: {
  activeFilter: EnrollmentFilter;
  onFilterChange: (filter: EnrollmentFilter) => void;
  summary: DashboardSummary;
}) {
  return (
    <div className="status-filter-bar flex min-h-0 items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-[#0b151b]/92 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="min-w-0">
        <div className="text-base font-black text-white">재적현황</div>
        <div className="mt-1 font-mono text-xs font-bold text-[#7f939f]">
          {formatNumber(getEnrollmentFilterTotal(summary, activeFilter))}명
        </div>
      </div>
      <div className="grid shrink-0 grid-cols-3 gap-1 rounded-md bg-black/22 p-1" role="group" aria-label="재적현황 보기">
        {enrollmentFilters.map((item) => {
          const active = activeFilter === item.value;

          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              data-enrollment-filter-control="true"
              data-enrollment-filter={item.value}
              onClick={() => onFilterChange(item.value)}
              className={`min-w-20 rounded px-3 py-2 text-xs font-black transition-smooth ${
                active ? "bg-[#47d7c6] text-[#061116]" : "text-[#a8bbc6] hover:bg-white/8 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              <span className="ml-2 font-mono">{formatNumber(getEnrollmentFilterTotal(summary, item.value))}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getStatusDetailConfig(group: StatusGroup, mode: Mode) {
  const configs: Record<string, { title: string; items: DistributionItem[]; limit: number }> = {
    program: { title: "과정별", items: group.distributions.program, limit: 8 },
    nationality: { title: "국가별", items: group.distributions.nationality, limit: 12 },
    department: { title: "학과별", items: group.distributions.department, limit: 12 },
    grade: { title: "학년별", items: group.distributions.grade, limit: 10 },
  };

  return configs[mode] || null;
}

function StatusDetailRows({ items, limit }: { items: DistributionItem[]; limit: number }) {
  const shown = items.slice(0, limit);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...shown.map((item) => item.value), 1);

  if (shown.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed border-white/[0.08] bg-white/[0.035] text-sm font-bold text-[#8fa2ad]">
        대상 없음
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-2 overflow-y-auto pr-1">
      {shown.map((item, index) => {
        const percent = total === 0 ? 0 : (item.value / total) * 100;

        return (
          <div
            key={item.name}
            className="status-detail-row grid gap-3 rounded-md border border-white/[0.05] bg-white/[0.045] px-3 py-2.5 sm:grid-cols-[auto_1fr_auto]"
          >
            <div className="font-mono text-xs font-black text-[#47d7c6]">{String(index + 1).padStart(2, "0")}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">{item.name}</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#47d7c6] via-[#6aa8ff] to-[#e8c46a]"
                  style={{ width: `${Math.max((item.value / max) * 100, 3)}%` }}
                />
              </div>
            </div>
            <div className="text-right font-mono text-sm font-black text-[#47d7c6]">
              {formatNumber(item.value)}
              <div className="mt-1 text-xs text-[#81949e]">{percent.toFixed(1)}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DimensionButton({
  active,
  disabled,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`min-w-14 rounded px-2.5 py-2 text-xs font-black transition-smooth ${
        active
          ? "bg-[#47d7c6] text-[#061116]"
          : "bg-white/[0.055] text-[#a9bac4] ring-1 ring-white/[0.06] hover:bg-white/[0.09] hover:text-white"
      } disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/[0.055] disabled:hover:text-[#a9bac4]`}
    >
      {label}
    </button>
  );
}

function StatusDimensionControl({
  disabledValues = [],
  label,
  onChange,
  value,
}: {
  disabledValues?: StatusDimension[];
  label: string;
  onChange: (value: StatusDimension) => void;
  value: StatusDimension;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-[11px] font-black text-[#718691]">{label}</div>
      <div className="grid grid-cols-4 gap-1" role="group" aria-label={label}>
        {statusDimensionOptions.map((item) => (
          <DimensionButton
            key={item.value}
            active={value === item.value}
            disabled={disabledValues.includes(item.value)}
            label={item.label}
            onClick={() => onChange(item.value)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusFilterDimensionControl({
  onChange,
  value,
}: {
  onChange: (value: StatusFilterDimension) => void;
  value: StatusFilterDimension;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-2 text-[11px] font-black text-[#718691]">필터 기준</div>
      <div className="grid grid-cols-5 gap-1" role="group" aria-label="필터 기준">
        {statusFilterOptions.map((item) => (
          <DimensionButton
            key={item.value}
            active={value === item.value}
            label={item.label}
            onClick={() => onChange(item.value)}
          />
        ))}
      </div>
    </div>
  );
}

function StatusFilterValueControl({
  filterDimension,
  filterValue,
  onFilterValueChange,
  records,
}: {
  filterDimension: StatusFilterDimension;
  filterValue: string;
  onFilterValueChange: (value: string) => void;
  records: StatusRecord[];
}) {
  const filterValues = filterDimension === "all" ? [] : getStatusDimensionValues(records, filterDimension);
  const effectiveValue = getEffectiveFilterValue(records, filterDimension, filterValue);

  return (
    <label className="min-w-0">
      <div className="mb-2 text-[11px] font-black text-[#718691]">필터 값</div>
      <select
        value={effectiveValue}
        disabled={filterDimension === "all" || filterValues.length === 0}
        onChange={(event) => onFilterValueChange(event.target.value)}
        className="h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.055] px-3 text-xs font-black text-[#dce8ed] outline-none transition-smooth focus:border-[#47d7c6]/65 disabled:opacity-55"
      >
        {filterDimension === "all" ? (
          <option value="">전체</option>
        ) : (
          filterValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))
        )}
      </select>
    </label>
  );
}

function StatusCombinationControls({
  columnDimension,
  filterDimension,
  filterValue,
  onColumnDimensionChange,
  onFilterDimensionChange,
  onFilterValueChange,
  onRowDimensionChange,
  records,
  rowDimension,
}: {
  columnDimension: StatusDimension;
  filterDimension: StatusFilterDimension;
  filterValue: string;
  onColumnDimensionChange: (value: StatusDimension) => void;
  onFilterDimensionChange: (value: StatusFilterDimension) => void;
  onFilterValueChange: (value: string) => void;
  onRowDimensionChange: (value: StatusDimension) => void;
  records: StatusRecord[];
  rowDimension: StatusDimension;
}) {
  return (
    <div className="combination-controls grid min-h-0 gap-3 rounded-lg border border-white/[0.08] bg-[#0b151b]/92 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] md:grid-cols-2 2xl:grid-cols-[1fr_1fr_1.2fr_0.9fr]">
      <StatusDimensionControl
        disabledValues={[columnDimension]}
        label="기준"
        onChange={onRowDimensionChange}
        value={rowDimension}
      />
      <StatusDimensionControl
        disabledValues={[rowDimension]}
        label="세부"
        onChange={onColumnDimensionChange}
        value={columnDimension}
      />
      <StatusFilterDimensionControl onChange={onFilterDimensionChange} value={filterDimension} />
      <StatusFilterValueControl
        filterDimension={filterDimension}
        filterValue={filterValue}
        onFilterValueChange={onFilterValueChange}
        records={records}
      />
    </div>
  );
}

function CombinationDetailRows({ rows, total, limit = 10 }: { rows: CombinationRow[]; total: number; limit?: number }) {
  const shown = rows.slice(0, limit);

  if (shown.length === 0) {
    return (
      <div className="grid h-full place-items-center rounded-md border border-dashed border-white/[0.08] bg-white/[0.035] text-sm font-bold text-[#8fa2ad]">
        대상 없음
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-2 overflow-y-auto pr-1">
      {shown.map((row, index) => {
        const rowPercent = total === 0 ? 0 : (row.value / total) * 100;

        return (
          <div
            key={row.name}
            className="status-detail-row rounded-md border border-white/[0.05] bg-white/[0.045] px-3 py-2.5"
          >
            <div className="grid items-start gap-3 sm:grid-cols-[auto_1fr_auto]">
              <div className="font-mono text-xs font-black text-[#47d7c6]">{String(index + 1).padStart(2, "0")}</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-white">{row.name}</div>
                <div className="mt-1 font-mono text-xs font-bold text-[#81949e]">{rowPercent.toFixed(1)}%</div>
              </div>
              <div className="text-right font-mono text-sm font-black text-[#47d7c6]">{formatNumber(row.value)}명</div>
            </div>

            <div className="mt-3 grid gap-2">
              {row.segments.slice(0, 5).map((segment) => {
                const segmentPercent = row.value === 0 ? 0 : (segment.value / row.value) * 100;

                return (
                  <div key={`${row.name}-${segment.name}`} className="grid gap-1">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate font-bold text-[#c8d5dc]">{segment.name}</span>
                      <span className="shrink-0 font-mono font-black text-[#47d7c6]">
                        {formatNumber(segment.value)}명 · {segmentPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#47d7c6] via-[#6aa8ff] to-[#e8c46a]"
                        style={{ width: `${Math.max(segmentPercent, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusCombinationView({
  columnDimension,
  enrollmentFilter,
  filterDimension,
  filterValue,
  onColumnDimensionChange,
  onEnrollmentFilterChange,
  onFilterDimensionChange,
  onFilterValueChange,
  onRowDimensionChange,
  rowDimension,
  summary,
}: {
  columnDimension: StatusDimension;
  enrollmentFilter: EnrollmentFilter;
  filterDimension: StatusFilterDimension;
  filterValue: string;
  onColumnDimensionChange: (value: StatusDimension) => void;
  onEnrollmentFilterChange: (filter: EnrollmentFilter) => void;
  onFilterDimensionChange: (value: StatusFilterDimension) => void;
  onFilterValueChange: (value: string) => void;
  onRowDimensionChange: (value: StatusDimension) => void;
  rowDimension: StatusDimension;
  summary: DashboardSummary;
}) {
  const group = summary.statusGroups[enrollmentFilter];
  const effectiveFilterValue = getEffectiveFilterValue(group.records, filterDimension, filterValue);
  const filteredRecords = getFilteredStatusRecords(group.records, filterDimension, effectiveFilterValue);
  const rows = buildCombinationRows(filteredRecords, rowDimension, columnDimension);
  const title = getCombinationTitle(rowDimension, columnDimension, filterDimension, effectiveFilterValue);
  const rankItems = rows.map((row) => ({ name: row.name, value: row.value }));

  return (
    <div
      className="grid h-full min-h-0 gap-3 xl:grid-rows-[auto_minmax(0,1fr)]"
      data-combination-analysis="true"
      data-combination-row-dimension={rowDimension}
      data-combination-column-dimension={columnDimension}
    >
      <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(21rem,0.35fr)_minmax(0,0.65fr)]">
        <EnrollmentStatusToggle
          activeFilter={enrollmentFilter}
          onFilterChange={onEnrollmentFilterChange}
          summary={summary}
        />
        <StatusCombinationControls
          columnDimension={columnDimension}
          filterDimension={filterDimension}
          filterValue={filterValue}
          onColumnDimensionChange={onColumnDimensionChange}
          onFilterDimensionChange={onFilterDimensionChange}
          onFilterValueChange={onFilterValueChange}
          onRowDimensionChange={onRowDimensionChange}
          records={group.records}
          rowDimension={rowDimension}
        />
      </div>

      <div className="monitor-grid status-detail-grid grid h-full min-h-0 gap-3 xl:grid-cols-[0.72fr_1.28fr]">
        <Panel title="분포 순위">
          <div className="grid h-full min-h-0 gap-3">
            <div className="rounded-md border border-white/[0.05] bg-white/[0.05] px-3 py-2">
              <div className="text-xs font-black text-[#81949e]">조합분석</div>
              <div className="mt-1 text-lg font-black text-white">{title}</div>
              <div className="mt-2 font-mono text-xs font-bold text-[#47d7c6]">
                {formatNumber(filteredRecords.length)}명 / {formatNumber(group.total)}명
              </div>
            </div>
            <div className="min-h-0 overflow-hidden">
              <ProgressRows items={rankItems} limit={8} />
            </div>
          </div>
        </Panel>

        <Panel title={`${title} 상세내역`}>
          <CombinationDetailRows rows={rows} total={filteredRecords.length} />
        </Panel>
      </div>
    </div>
  );
}

function StatusView({
  summary,
  mode,
  onModeChange,
  enrollmentFilter,
  onEnrollmentFilterChange,
  combinationColumnDimension,
  combinationFilterDimension,
  combinationFilterValue,
  combinationRowDimension,
  onCombinationColumnDimensionChange,
  onCombinationFilterDimensionChange,
  onCombinationFilterValueChange,
  onCombinationRowDimensionChange,
}: {
  summary: DashboardSummary;
  mode: Mode;
  onModeChange: ModeChangeHandler;
  enrollmentFilter: EnrollmentFilter;
  onEnrollmentFilterChange: (filter: EnrollmentFilter) => void;
  combinationColumnDimension: StatusDimension;
  combinationFilterDimension: StatusFilterDimension;
  combinationFilterValue: string;
  combinationRowDimension: StatusDimension;
  onCombinationColumnDimensionChange: (value: StatusDimension) => void;
  onCombinationFilterDimensionChange: (value: StatusFilterDimension) => void;
  onCombinationFilterValueChange: (value: string) => void;
  onCombinationRowDimensionChange: (value: StatusDimension) => void;
}) {
  const group = summary.statusGroups[enrollmentFilter];

  if (mode === "programNationality") {
    return (
      <StatusCombinationView
        columnDimension={combinationColumnDimension}
        enrollmentFilter={enrollmentFilter}
        filterDimension={combinationFilterDimension}
        filterValue={combinationFilterValue}
        onColumnDimensionChange={onCombinationColumnDimensionChange}
        onEnrollmentFilterChange={onEnrollmentFilterChange}
        onFilterDimensionChange={onCombinationFilterDimensionChange}
        onFilterValueChange={onCombinationFilterValueChange}
        onRowDimensionChange={onCombinationRowDimensionChange}
        rowDimension={combinationRowDimension}
        summary={summary}
      />
    );
  }

  const detail = getStatusDetailConfig(group, mode);

  if (detail) {
    return (
      <div className="grid h-full min-h-0 gap-3 xl:grid-rows-[auto_minmax(0,1fr)]">
        <EnrollmentStatusToggle
          activeFilter={enrollmentFilter}
          onFilterChange={onEnrollmentFilterChange}
          summary={summary}
        />
        <div className="monitor-grid status-detail-grid grid h-full min-h-0 gap-3 xl:grid-cols-[0.82fr_1.18fr]">
          <Panel title="분포 순위">
            <ProgressRows items={detail.items} limit={Math.min(detail.limit, 8)} />
          </Panel>

          <Panel title={`${detail.title} 상세내역`}>
            <StatusDetailRows items={detail.items} limit={detail.limit} />
          </Panel>
        </div>
      </div>
    );
  }

  const combinationPreviewItems = buildCombinationRows(group.records, "program", "nationality").map((row) => ({
    name: row.name,
    value: row.value,
  }));

  return (
    <div className="grid h-full min-h-0 gap-3 xl:grid-rows-[auto_minmax(0,1fr)]">
      <EnrollmentStatusToggle
        activeFilter={enrollmentFilter}
        onFilterChange={onEnrollmentFilterChange}
        summary={summary}
      />
      <div className="monitor-grid status-overview-grid grid h-full min-h-0 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-[repeat(2,minmax(0,1fr))]">
        <StatusOverviewPanel
          title="과정별 현황"
          mode="program"
          onModeChange={onModeChange}
          items={group.distributions.program}
          limit={5}
        />
        <StatusOverviewPanel
          title="국가별 현황"
          mode="nationality"
          onModeChange={onModeChange}
          items={group.distributions.nationality}
          limit={5}
        />
        <StatusOverviewPanel
          title="학과별 현황"
          mode="department"
          onModeChange={onModeChange}
          items={group.distributions.department}
          limit={6}
        />
        <StatusOverviewPanel
          title="학년별 현황"
          mode="grade"
          onModeChange={onModeChange}
          items={group.distributions.grade}
          limit={6}
        />
        <StatusOverviewPanel
          title="과정별 국가 현황"
          mode="programNationality"
          onModeChange={onModeChange}
          items={combinationPreviewItems}
          limit={6}
        />
      </div>
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
      count: formatRatioCount(summary.metrics.dropoutStudents, totalStudents),
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
      count: formatRatioCount(summary.metrics.topikStudents, totalStudents),
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
      count: formatRatioCount(summary.metrics.activeInsurance, totalStudents),
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
      count: formatRatioCount(summary.metrics.counselingTargets, totalStudents),
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

function getStatusBadgeClass(status: string) {
  if (status === "관리 필요") {
    return "border-[#f07188]/65 bg-[#f07188]/18 text-[#ffd6de] shadow-[0_0_26px_rgba(240,113,136,0.18)]";
  }

  if (status === "정성 관리") {
    return "border-[#e8c46a]/55 bg-[#e8c46a]/16 text-[#ffe6a1]";
  }

  return "border-[#80d88a]/45 bg-[#80d88a]/12 text-[#d7ffd8]";
}

function CertificationSummaryGrid({ summary }: { summary: DashboardSummary }) {
  const indicators = getCertificationIndicators(summary);

  return (
    <div className="grid h-full min-h-0 auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {indicators.map((indicator) => (
        <section
          key={indicator.mode}
          className={`summary-certification-card flex h-full min-h-0 flex-col rounded-lg border p-3.5 ${
            indicator.status === "관리 필요"
              ? "border-[#f07188]/45 bg-[#251018]"
              : "border-white/[0.07] bg-white/[0.045]"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-sm font-black text-[#c7d5dc]">{indicator.title}</div>
            <span
              className={`summary-status-badge shrink-0 rounded-md border px-2 py-1 text-[11px] font-black ${getStatusBadgeClass(indicator.status)}`}
            >
              {indicator.status}
            </span>
          </div>

          <div className="summary-value-stack mt-3 grid gap-2">
            <div className="summary-value min-w-0 font-mono text-[clamp(1.85rem,2.2vw,2.45rem)] font-black leading-none text-white">
              {indicator.value}
            </div>
            <div className="summary-count-ratio-row flex min-w-0 items-center justify-end rounded-md bg-black/14 px-2.5 py-1.5">
              <span className="summary-count-ratio whitespace-nowrap text-right font-mono text-sm font-black leading-none text-[#47d7c6]">
                {indicator.count}
              </span>
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-xs font-semibold leading-5 text-[#9eb0bb]">
            <div>{indicator.criterion}</div>
            <div className="rounded-md bg-black/16 px-2 py-1.5 text-[#c4d2d9]">{indicator.note}</div>
          </div>
        </section>
      ))}
    </div>
  );
}

function IndicatorCard({
  active,
  indicator,
  onModeChange,
}: {
  active: boolean;
  indicator: CertificationIndicator;
  onModeChange: ModeChangeHandler;
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
      type="button"
      value={indicator.mode}
      aria-pressed={active}
      data-mode-control="true"
      data-mode={indicator.mode}
      onClick={() => onModeChange(indicator.mode)}
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
        <div className="shrink-0 whitespace-nowrap font-mono text-sm font-black leading-none text-[#47d7c6]">
          {indicator.count}
        </div>
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

function CertificationView({
  summary,
  mode,
  onModeChange,
}: {
  summary: DashboardSummary;
  mode: Mode;
  onModeChange: ModeChangeHandler;
}) {
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
            onModeChange={onModeChange}
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
  combinationColumnDimension,
  combinationFilterDimension,
  combinationFilterValue,
  combinationRowDimension,
  enrollmentFilter,
  onCombinationColumnDimensionChange,
  onCombinationFilterDimensionChange,
  onCombinationFilterValueChange,
  onCombinationRowDimensionChange,
  onEnrollmentFilterChange,
  onModeChange,
  summary,
}: {
  activeMode: Mode;
  combinationColumnDimension: StatusDimension;
  combinationFilterDimension: StatusFilterDimension;
  combinationFilterValue: string;
  combinationRowDimension: StatusDimension;
  enrollmentFilter: EnrollmentFilter;
  onCombinationColumnDimensionChange: (value: StatusDimension) => void;
  onCombinationFilterDimensionChange: (value: StatusFilterDimension) => void;
  onCombinationFilterValueChange: (value: string) => void;
  onCombinationRowDimensionChange: (value: StatusDimension) => void;
  onEnrollmentFilterChange: (filter: EnrollmentFilter) => void;
  onModeChange: ModeChangeHandler;
  summary: DashboardSummary;
}) {
  if (activeMode === "attendance") {
    return <AttendanceView summary={summary} />;
  }

  if (statusModeSet.has(activeMode)) {
    return (
      <StatusView
        combinationColumnDimension={combinationColumnDimension}
        combinationFilterDimension={combinationFilterDimension}
        combinationFilterValue={combinationFilterValue}
        combinationRowDimension={combinationRowDimension}
        enrollmentFilter={enrollmentFilter}
        mode={activeMode}
        onCombinationColumnDimensionChange={onCombinationColumnDimensionChange}
        onCombinationFilterDimensionChange={onCombinationFilterDimensionChange}
        onCombinationFilterValueChange={onCombinationFilterValueChange}
        onCombinationRowDimensionChange={onCombinationRowDimensionChange}
        onEnrollmentFilterChange={onEnrollmentFilterChange}
        onModeChange={onModeChange}
        summary={summary}
      />
    );
  }

  if (certificationModeSet.has(activeMode)) {
    return <CertificationView mode={activeMode} onModeChange={onModeChange} summary={summary} />;
  }

  return <Overview onModeChange={onModeChange} summary={summary} />;
}

export function DashboardMonitor({ activeMode: initialActiveMode, summary }: { activeMode: Mode; summary: DashboardSummary }) {
  const [activeMode, setActiveMode] = useState(initialActiveMode);
  const [enrollmentFilter, setEnrollmentFilter] = useState<EnrollmentFilter>("enrolled");
  const [combinationRowDimension, setCombinationRowDimension] = useState<StatusDimension>("program");
  const [combinationColumnDimension, setCombinationColumnDimension] = useState<StatusDimension>("nationality");
  const [combinationFilterDimension, setCombinationFilterDimension] = useState<StatusFilterDimension>("all");
  const [combinationFilterValue, setCombinationFilterValue] = useState("");
  const [liveSummary, setLiveSummary] = useState(summary);
  const generatedAt = formatSeoulDateTime(liveSummary.generatedAt);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setActiveMode(normalizeModeValue(params.get("mode")));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let stopped = false;
    let activeController: AbortController | null = null;

    async function refreshSummary() {
      if (activeController) {
        return;
      }

      const controller = new AbortController();
      activeController = controller;

      try {
        const response = await fetch(dashboardSummaryEndpoint, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to refresh dashboard summary: ${response.status}`);
        }

        const nextSummary = (await response.json()) as DashboardSummary;

        if (!stopped) {
          setLiveSummary(nextSummary);
        }
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
        }
      } finally {
        if (activeController === controller) {
          activeController = null;
        }
      }
    }

    const intervalId = window.setInterval(refreshSummary, dashboardSummaryPollingMs);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
      activeController?.abort();
    };
  }, []);

  function handleModeChange(mode: Mode) {
    setActiveMode(mode);
    updateModeUrl(mode);
  }

  function handleCombinationRowDimensionChange(dimension: StatusDimension) {
    setCombinationRowDimension(dimension);
    setCombinationColumnDimension((current) => (current === dimension ? getAlternateDimension(dimension) : current));
  }

  function handleCombinationColumnDimensionChange(dimension: StatusDimension) {
    setCombinationColumnDimension(dimension);
    setCombinationRowDimension((current) => (current === dimension ? getAlternateDimension(dimension) : current));
  }

  function handleCombinationFilterDimensionChange(dimension: StatusFilterDimension) {
    setCombinationFilterDimension(dimension);
    setCombinationFilterValue("");
  }

  return (
    <main
      className="min-h-screen bg-[#070d12] text-white lg:h-screen lg:overflow-hidden"
      data-live-summary-endpoint={dashboardSummaryEndpoint}
      data-live-summary-polling={dashboardSummaryPollingMs}
    >
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
              <MiniStat label="자료" value={liveSummary.dataSource.type === "sqlite" ? "DB" : "SEED"} />
              <MiniStat label="갱신" value={generatedAt} />
            </div>
          </div>

          <nav
            className="client-mode-switcher mt-3 grid gap-2 xl:grid-cols-[auto_1fr_1fr]"
            aria-label="대시보드 모드 선택"
          >
            <ModeGroup activeMode={activeMode} title="대시보드" items={primaryModes} onModeChange={handleModeChange} />
            <ModeGroup activeMode={activeMode} title="현황" items={statusModes} onModeChange={handleModeChange} />
            <ModeGroup activeMode={activeMode} title="인증" items={certificationModes} onModeChange={handleModeChange} />
          </nav>
        </header>

        <section className="dashboard-stage min-h-0 flex-1 py-3">
          <ActivePanel
            activeMode={activeMode}
            combinationColumnDimension={combinationColumnDimension}
            combinationFilterDimension={combinationFilterDimension}
            combinationFilterValue={combinationFilterValue}
            combinationRowDimension={combinationRowDimension}
            enrollmentFilter={enrollmentFilter}
            onCombinationColumnDimensionChange={handleCombinationColumnDimensionChange}
            onCombinationFilterDimensionChange={handleCombinationFilterDimensionChange}
            onCombinationFilterValueChange={setCombinationFilterValue}
            onCombinationRowDimensionChange={handleCombinationRowDimensionChange}
            onEnrollmentFilterChange={setEnrollmentFilter}
            onModeChange={handleModeChange}
            summary={liveSummary}
          />
        </section>
      </div>
    </main>
  );
}
