import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { listReports } from "@/db/queries/reports";
import { REPORT_TYPE_META } from "@/types";

export const dynamic = "force-dynamic";

const MOOD_EMOJI: Record<number, string> = {
  1: "😢",
  2: "🙁",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export default async function ReportsPage() {
  const user = await getUser();
  if (!user) return null;

  const reports = await listReports(user.id);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">レポート</h1>
        <p className="text-sm text-default-500">これまでの1日の振り返り。</p>
      </header>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-default-200 py-12 text-center">
          <p className="text-3xl">📊</p>
          <p className="mt-2 text-sm text-default-400">
            まだレポートがありません。投稿を重ねると、毎晩20時に生成されます。
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Link href={`/reports/${r.reportDate}`} className="block">
                <div className="glass-card rounded-2xl p-4 transition-transform hover:-translate-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-default-800">
                        {r.reportDate}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {REPORT_TYPE_META[r.type].icon} {REPORT_TYPE_META[r.type].badge}
                      </span>
                    </div>
                    <span className="text-lg" aria-hidden>
                      {MOOD_EMOJI[r.payload.moodScore] ?? "🙂"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-default-500">
                    {r.payload.summary}
                  </p>
                  {r.payload.emotions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.payload.emotions.slice(0, 4).map((e) => (
                        <span
                          key={e}
                          className="rounded-full bg-primary/8 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
