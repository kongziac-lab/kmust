import Link from "next/link";
import { buildDashboardSummary } from "@/lib/summary";

export const dynamic = "force-dynamic";

const riskLabel = {
  low: "낮음",
  medium: "주의",
  high: "높음",
} as const;

export default function AttentionPage() {
  const summary = buildDashboardSummary();

  return (
    <main className="min-h-screen bg-[#0a0a0e] px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-[#23232f] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#22d3ee] transition-smooth hover:text-white">
              Dashboard
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-[#f5f6ff]">주의 학생 상세</h1>
            <p className="mt-3 break-keep-all text-[#9a9fb5]">출결, 성적, 보험, 어학 기준으로 주의가 필요한 학생만 별도로 확인합니다.</p>
          </div>
          <div className="rounded-xl border border-[#23232f] bg-[#14141c] px-5 py-4 text-right">
            <div className="text-sm text-[#9a9fb5]">대상 학생</div>
            <div className="font-mono text-3xl font-black text-[#22d3ee]">{summary.attentionStudents.length}</div>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-xl border border-[#23232f] bg-[#14141c]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#1b1b25] text-xs uppercase tracking-[0.12em] text-[#9a9fb5]">
                <tr>
                  <th className="px-5 py-4">학번</th>
                  <th className="px-5 py-4">국적</th>
                  <th className="px-5 py-4">소속</th>
                  <th className="px-5 py-4">학년</th>
                  <th className="px-5 py-4">평점</th>
                  <th className="px-5 py-4">위험등급</th>
                  <th className="px-5 py-4">근거</th>
                  <th className="px-5 py-4">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#23232f]">
                {summary.attentionStudents.map(({ student, risk }) => (
                  <tr key={student.studentNo} className="transition-smooth hover:bg-white/[0.04]">
                    <td className="px-5 py-4 font-mono text-[#22d3ee]">{student.studentNo}</td>
                    <td className="px-5 py-4 text-[#d7dcee]">{student.nationality || "미상"}</td>
                    <td className="px-5 py-4 text-[#d7dcee]">{student.department || student.college}</td>
                    <td className="px-5 py-4 text-[#d7dcee]">{student.grade ? `${student.grade}학년` : "미상"}</td>
                    <td className="px-5 py-4 font-mono text-[#d7dcee]">{student.gpa ?? "-"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          risk.overallGrade === "high"
                            ? "bg-gradient-to-r from-[#ec4899] to-[#f43f5e] text-[#0b0710]"
                            : "bg-gradient-to-r from-[#8b5cf6] to-[#c084fc] text-[#0b0710]"
                        }`}
                      >
                        {riskLabel[risk.overallGrade]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#9a9fb5]">{risk.reasons.join(", ") || "모니터링"}</td>
                    <td className="px-5 py-4">
                      <Link href={`/api/students/${student.studentNo}`} className="rounded-md border border-[#2b2b39] bg-[#1b1b25] px-3 py-2 text-xs font-semibold text-white transition-smooth hover:bg-[#23232f]">
                        JSON
                      </Link>
                    </td>
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
