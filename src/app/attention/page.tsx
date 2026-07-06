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
    <main className="dashboard-shell min-h-screen px-4 py-6 text-[#2e2418] md:px-8">
      <div className="dashboard-ambient" />
      <div className="dashboard-horizon" />
      <div className="paper-scanline" />
      <div className="paper-grain" />
      <div className="mx-auto max-w-7xl">
        <header className="dashboard-header flex flex-col gap-4 border-b border-[#c9b187]/70 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#a23a2e] transition-smooth hover:text-[#7a2820]">
              ← Dashboard
            </Link>
            <h1 className="dashboard-title mt-3 text-4xl font-black tracking-tight">주의 학생 상세</h1>
            <p className="mt-3 break-keep-all text-[#5a4418]">출결, 성적, 보험, 어학 기준으로 주의가 필요한 학생만 별도로 확인합니다.</p>
          </div>
          <div className="rounded-lg border border-[#c9b187]/55 bg-[#fbf6ea]/88 px-5 py-4 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
            <div className="text-sm text-[#8a7355]">대상 학생</div>
            <div className="font-mono text-3xl font-black text-[#a23a2e]">{summary.attentionStudents.length}</div>
          </div>
        </header>

        <section className="monitor-panel mt-6 overflow-hidden rounded-lg border border-[#c9b187]/55 bg-[#fbf6ea]/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#f4eccf]/70 text-xs uppercase tracking-[0.12em] text-[#8a7355]">
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
              <tbody className="divide-y divide-[#c9b187]/35">
                {summary.attentionStudents.map(({ student, risk }) => (
                  <tr key={student.studentNo} className="transition-smooth hover:bg-[#f7eed6]/70">
                    <td className="px-5 py-4 font-mono text-[#a23a2e]">{student.studentNo}</td>
                    <td className="px-5 py-4 text-[#2e2418]">{student.nationality || "미상"}</td>
                    <td className="px-5 py-4 text-[#2e2418]">{student.department || student.college}</td>
                    <td className="px-5 py-4 text-[#2e2418]">{student.grade ? `${student.grade}학년` : "미상"}</td>
                    <td className="px-5 py-4 font-mono text-[#2e2418]">{student.gpa ?? "-"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`status-stamp text-[11px] ${
                          risk.overallGrade === "high" ? "text-[#a23a2e]" : "text-[#9a6a18]"
                        }`}
                      >
                        {riskLabel[risk.overallGrade]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#5a4418]">{risk.reasons.join(", ") || "모니터링"}</td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/api/students/${student.studentNo}`}
                        className="rounded-md border border-[#c9b187]/55 bg-[#f4eccf]/70 px-3 py-2 text-xs font-semibold text-[#2e2418] transition-smooth hover:bg-[#ecdcb0]/85"
                      >
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
