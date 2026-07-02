import Link from "next/link";
import { buildDashboardSummary } from "@/lib/summary";

const riskLabel = {
  low: "낮음",
  medium: "주의",
  high: "높음",
} as const;

export default function AttentionPage() {
  const summary = buildDashboardSummary();

  return (
    <main className="min-h-screen bg-[#120836] px-4 py-6 text-white md:px-8">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_82%_12%,rgba(214,46,179,0.22),transparent_30%),linear-gradient(135deg,#180d48,#080624)]" />
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#79e1ed] transition-smooth hover:text-white">
              Dashboard
            </Link>
            <h1 className="mt-3 text-4xl font-black tracking-tight">주의 학생 상세</h1>
            <p className="mt-3 break-keep-all text-[#c9d1ff]">출결, 성적, 보험, 어학 기준으로 주의가 필요한 학생만 별도로 확인합니다.</p>
          </div>
          <div className="rounded-xl bg-[#211452] px-5 py-4 text-right ring-1 ring-white/10">
            <div className="text-sm text-[#9aa6d6]">대상 학생</div>
            <div className="font-mono text-3xl font-black text-[#79e1ed]">{summary.attentionStudents.length}</div>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-xl bg-[#211452] ring-1 ring-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-white/6 text-xs uppercase tracking-[0.12em] text-[#9aa6d6]">
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
              <tbody className="divide-y divide-white/8">
                {summary.attentionStudents.map(({ student, risk }) => (
                  <tr key={student.studentNo} className="transition-smooth hover:bg-white/5">
                    <td className="px-5 py-4 font-mono text-[#79e1ed]">{student.studentNo}</td>
                    <td className="px-5 py-4 text-[#dfe5ff]">{student.nationality || "미상"}</td>
                    <td className="px-5 py-4 text-[#dfe5ff]">{student.department || student.college}</td>
                    <td className="px-5 py-4 text-[#dfe5ff]">{student.grade ? `${student.grade}학년` : "미상"}</td>
                    <td className="px-5 py-4 font-mono text-[#dfe5ff]">{student.gpa ?? "-"}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${risk.overallGrade === "high" ? "bg-[#d84370] text-white" : "bg-[#6b50e8] text-white"}`}>
                        {riskLabel[risk.overallGrade]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#c9d1ff]">{risk.reasons.join(", ") || "모니터링"}</td>
                    <td className="px-5 py-4">
                      <Link href={`/api/students/${student.studentNo}`} className="rounded-md bg-white/8 px-3 py-2 text-xs font-semibold text-white transition-smooth hover:bg-white/14">
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
