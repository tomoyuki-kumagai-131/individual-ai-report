import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { listPostsForLocalDay } from "@/db/queries/posts";
import { getReportsForDate } from "@/db/queries/reports";
import { REPORT_TYPE_META } from "@/types";
import { localDateString } from "@/lib/time";
import { PostComposer } from "@/components/post-composer";
import { PostList } from "@/components/post-list";
import { AnalyzeButton } from "@/components/analyze-button";

export const dynamic = "force-dynamic";

function greeting(hour: number) {
  if (hour < 5) return "こんばんは";
  if (hour < 11) return "おはようございます";
  if (hour < 18) return "こんにちは";
  return "こんばんは";
}

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) return null;

  const today = localDateString();
  const jstHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );

  const [posts, todaysReports] = await Promise.all([
    listPostsForLocalDay(user.id, today),
    getReportsForDate(user.id, today),
  ]);
  const hasReport = todaysReports.length > 0;

  const postsForClient = posts
    .slice()
    .reverse()
    .map((p) => ({
      id: p.id,
      content: p.content,
      mood: p.mood,
      createdAt: p.createdAt.toISOString(),
    }));

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <header className="flex flex-col gap-1">
        <p className="text-sm text-default-400">{today}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {greeting(jstHour)}
        </h1>
        <p className="text-sm text-default-500">
          思いを綴ると、朝6時と夜18時にAIが振り返りを届けます。
        </p>
      </header>

      <PostComposer />

      {/* Today's report status */}
      <div className="glass-card flex items-center justify-between gap-3 rounded-2xl p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-default-700">今日のレポート</p>
          {hasReport ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {todaysReports.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  {REPORT_TYPE_META[r.type].icon} {REPORT_TYPE_META[r.type].badge}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-default-400">
              朝6時・夜18時に自動生成されます。今すぐ試すこともできます。
            </p>
          )}
        </div>
        {hasReport ? (
          <Link
            href={`/reports/${today}`}
            className="flex-none rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            見る →
          </Link>
        ) : (
          <AnalyzeButton disabled={posts.length === 0} />
        )}
      </div>

      {/* Timeline */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-default-600">
            今日の投稿 ({posts.length})
          </h2>
          {hasReport && posts.length > 0 && <AnalyzeButton disabled={false} />}
        </div>
        <PostList posts={postsForClient} />
      </section>
    </div>
  );
}
