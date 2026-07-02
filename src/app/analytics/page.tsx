import Link from "next/link";
import { getStudents } from "@/lib/data";

type DistributionItem = {
  name: string;
  value: number;
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

function StatCard({ title, value, caption }: { title: string; value: string | number; caption: string }) {
  return (
    <article className="rounded-xl bg-gradient-to-br from-[#30206b] to-[#211452] p-5 shadow-[0_24px_70px_-42px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
      <div className="text-sm text-[#9aa6d6]">{title}</div>
      <div className="mt-3 font-mono text-3xl font-black text-white">{value}</div>
      <div className="mt-3 break-keep-all text-xs leading-5 text-[#c9d1ff]">{caption}</div>
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
    <section className="rounded-xl bg-[#211452] p-5 ring-1 ring-white/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-2 break-keep-all text-sm leading-6 text-[#9aa6d6]">{description}</p>
        </div>
        <span className="rounded-full bg-white/8 px-3 py-1 font-mono text-xs text-[#79e1ed]">
          {total.toLocaleString("ko-KR")}
        </span>
      </div>
      <div className="mt-6 space-y-4">
        {shown.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="truncate text-[#dfe5ff]">{item.name}</span>
              <span className="font-mono text-[#79e1ed]">{item.value.toLocaleString("ko-KR")}</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6f65ff] via-[#38bed0] to-[#d843b4]"
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
    <section className="overflow-hidden rounded-xl bg-[#211452] ring-1 ring-white/10">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      <div className="max-h-[480px] overflow-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="sticky top-0 bg-[#211452] text-xs uppercase tracking-[0.12em] text-[#9aa6d6]">
            <tr>
              <th className="px-5 py-3">구분</th>
              <th className="px-5 py-3">학생 수</th>
              <th className="px-5 py-3">비율</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {items.map((item) => (
              <tr key={item.name} className="transition-smooth hover:bg-white/5">
                <td className="px-5 py-3 text-[#dfe5ff]">{item.name}</td>
                <td className="px-5 py-3 font-mono text-[#79e1ed]">{item.value.toLocaleString("ko-KR")}</td>
                <td className="px-5 py-3 font-mono text-[#c9d1ff]">
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
  const nationalities = countBy(students, (student) => student.nationality);
  const grades = countBy(students, (student) => (student.grade ? `${student.grade}학년` : "미상"));
  const departments = countBy(students, (student) => student.department);
  const colleges = countBy(students, (student) => student.college);
  const gpaDistribution = buildGpaDistribution();
  const validGpaStudents = students.filter((student) => student.gpa && student.gpa > 0 && student.gpa <= 4.5);
  const averageGpa =
    validGpaStudents.reduce((sum, student) => sum + (student.gpa || 0), 0) / Math.max(validGpaStudents.length, 1);

  return (
    <main className="min-h-screen bg-[#120836] px-4 py-6 text-white md:px-8">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_82%_12%,rgba(214,46,179,0.22),transparent_30%),radial-gradient(circle_at_12%_82%,rgba(60,190,208,0.18),transparent_28%),linear-gradient(135deg,#180d48,#080624)]" />
      <div className="noise-layer" />
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#79e1ed] transition-smooth hover:text-white">
              Dashboard
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight">학생 현황 분석</h1>
            <p className="mt-3 break-keep-all text-[#c9d1ff]">
              국가, 학년, 전공, 성적분포를 기준으로 외국인학생 구성을 살펴봅니다.
            </p>
          </div>
          <div className="rounded-xl bg-[#211452] px-5 py-4 text-right ring-1 ring-white/10">
            <div className="text-sm text-[#9aa6d6]">분석 기준 학생</div>
            <div className="font-mono text-3xl font-black text-[#79e1ed]">{students.length.toLocaleString("ko-KR")}</div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="국가 수" value={nationalities.length} caption="국적 정보 기준 고유 국가" />
          <StatCard title="전공 수" value={departments.length} caption="학과·전공명 기준 고유 전공" />
          <StatCard title="평균 평점" value={averageGpa.toFixed(2)} caption="4.5 평점 범위만 집계" />
          <StatCard title="최다 국가" value={nationalities[0]?.name || "-"} caption={`${nationalities[0]?.value.toLocaleString("ko-KR") || 0}명`} />
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
