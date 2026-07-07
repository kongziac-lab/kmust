import Link from "next/link";
import { getDataSourceInfo, getStudents } from "@/lib/data";

export const dynamic = "force-dynamic";

type DistributionItem = {
  name: string;
  value: number;
};

const statTones: Record<string, string> = {
  violet: "linear-gradient(90deg,#a855f7,#d946ef)",
  teal: "linear-gradient(90deg,#06b6d4,#22d3ee)",
  green: "linear-gradient(90deg,#22c55e,#06b6d4)",
  amber: "linear-gradient(90deg,#f97316,#eab308)",
};

function countBy<T>(items: T[], getKey: (item: T) => string | number | null | undefined) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = String(getKey(item) || "미상");
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "ko-KR"));
}

function buildGpaDistribution() {
  const students = getStudents();
  const bands = [
    { name: "4.0 이상", min: 4, max: 4.5 },
    { name: "3.5 - 3.99", min: 3.5, max: 3.99 },
    { name: "3.0 - 3.49", min: 3, max: 3.49 },
    { name: "2.5 - 2.99", min: 2.5, max: 2.99 },
    { name: "2.0 - 2.49", min: 2, max: 2.49 },
    { name: "2.0 미만", min: 0.01, max: 1.99 },
    { name: "100점 환산/확인필요", min: 4.51, max: 100 },
    { name: "미산출", min: null, max: null },
  ];

  return bands.map((band) => ({
    name: band.name,
    value: students.filter((student) => {
      if (band.min === null) return !student.gpa || student.gpa === 0;
      return student.gpa !== null && student.gpa >= band.min && student.gpa <= band.max;
    }).length,
  }));
}

function StatCard({
  title,
  value,
  caption,
  tone = "teal",
}: {
  title: string;
  value: string | number;
  caption: string;
  tone?: keyof typeof statTones | string;
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[#23232f] bg-[#14141c] p-5">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: statTones[tone] || statTones.teal }}
      />
      <div className="text-sm font-semibold text-[#9a9fb5]">{title}</div>
      <div className="mt-3 font-mono text-3xl font-black text-white">{value}</div>
      <div className="mt-3 break-keep-all text-xs leading-5 text-[#71768c]">{caption}</div>
    </article>
  );
}

function ChartPanel({
  title,
  description,
  items,
  limit = 10,
}: {
  title: string;
  description: string;
  items: DistributionItem[];
  limit?: number;
}) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-xl border border-[#23232f] bg-[#14141c] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-[#eef2f8]">{title}</h2>
          <p className="mt-2 break-keep-all text-sm leading-6 text-[#9a9fb5]">{description}</p>
        </div>
        <span className="rounded-full border border-[#2b2b39] bg-[#1b1b25] px-3 py-1 font-mono text-xs text-[#22d3ee]">
          {total.toLocaleString("ko-KR")}
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {shown.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate text-[#d7dcee]">{item.name}</span>
              <span className="font-mono text-[#22d3ee]">{item.value.toLocaleString("ko-KR")}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#22222e]">
              <div
                className="led-fill h-full rounded-full"
                style={{ width: `${Math.max((item.value / max) * 100, 3)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataTable({ title, items }: { title: string; items: DistributionItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="overflow-hidden rounded-xl border border-[#23232f] bg-[#14141c]">
      <div className="border-b border-[#23232f] px-5 py-4">
        <h2 className="text-lg font-black text-[#eef2f8]">{title}</h2>
      </div>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="sticky top-0 bg-[#1b1b25] text-xs uppercase tracking-[0.12em] text-[#9a9fb5]">
            <tr>
              <th className="px-5 py-3">구분</th>
              <th className="px-5 py-3">학생 수</th>
              <th className="px-5 py-3">비율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#23232f]">
            {items.map((item) => (
              <tr key={item.name} className="transition-smooth hover:bg-white/[0.04]">
                <td className="px-5 py-3 text-[#d7dcee]">{item.name}</td>
                <td className="px-5 py-3 font-mono text-[#22d3ee]">{item.value.toLocaleString("ko-KR")}</td>
                <td className="px-5 py-3 font-mono text-[#9a9fb5]">
                  {total === 0 ? "0.0" : ((item.value / total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const students = getStudents();
  const dataSource = getDataSourceInfo();
  const nationalities = countBy(students, (student) => student.nationality);
  const grades = countBy(students, (student) => (student.grade ? `${student.grade}학년` : "미상"));
  const departments = countBy(students, (student) => student.department);
  const colleges = countBy(students, (student) => student.college);
  const gpaDistribution = buildGpaDistribution();
  const validGpaStudents = students.filter((student) => student.gpa && student.gpa > 0 && student.gpa <= 4.5);
  const averageGpa =
    validGpaStudents.reduce((sum, student) => sum + (student.gpa || 0), 0) / Math.max(validGpaStudents.length, 1);

  return (
    <main className="min-h-screen bg-[#0a0a0e] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[#23232f] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#22d3ee] transition-smooth hover:text-white">
              Dashboard
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#f5f6ff]">학생 현황 분석</h1>
            <p className="mt-3 break-keep-all text-[#9a9fb5]">
              국가, 학년, 전공, 성적분포를 기준으로 외국인학생 구성을 살펴봅니다.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2b2b39] bg-[#14141c] px-4 py-2 text-xs font-semibold text-[#9a9fb5]">
              <span className="h-2 w-2 rounded-full bg-[#22d3ee]" />
              {dataSource.label} · {dataSource.recordCount.toLocaleString("ko-KR")}명
              {dataSource.importedAt ? ` · ${dataSource.importedAt}` : ""}
            </div>
          </div>
          <div className="rounded-xl border border-[#23232f] bg-[#14141c] px-5 py-4 text-right">
            <div className="text-sm text-[#9a9fb5]">분석 기준 학생</div>
            <div className="font-mono text-3xl font-black text-[#22d3ee]">{students.length.toLocaleString("ko-KR")}</div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="국가 수" value={nationalities.length} caption="국적 정보 기준 고유 국가" tone="violet" />
          <StatCard title="전공 수" value={departments.length} caption="학과·전공명 기준 고유 전공" tone="teal" />
          <StatCard title="평균 평점" value={averageGpa.toFixed(2)} caption="4.5 평점 범위만 집계" tone="green" />
          <StatCard title="최다 국가" value={nationalities[0]?.name || "-"} caption={`${nationalities[0]?.value.toLocaleString("ko-KR") || 0}명`} tone="amber" />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <ChartPanel title="국가별 현황" description="학생 수가 많은 국가 순으로 상위 국가를 표시합니다." items={nationalities} limit={12} />
          <ChartPanel title="학년별 현황" description="현재 학년 기준 분포를 확인합니다." items={grades} />
          <ChartPanel title="전공별 현황" description="학과·전공 단위로 학생 집중도를 확인합니다." items={departments} limit={14} />
          <ChartPanel title="성적분포" description="평균평점 구간별 분포입니다." items={gpaDistribution} />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <DataTable title="전공별 전체 목록" items={departments} />
          <DataTable title="소속대학별 전체 목록" items={colleges} />
        </section>
      </div>
    </main>
  );
}
