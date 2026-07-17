import { analyzeDay } from "@/lib/ai/analyze";
import { listPostsForLocalDay } from "@/db/queries/posts";
import { upsertReport } from "@/db/queries/reports";
import { previousLocalDate } from "@/lib/time";
import type { PostForAnalysis, ReportType } from "@/types";
import type { Report } from "@/db/schema";

export type GenerateOutcome =
  | { status: "generated"; report: Report }
  | { status: "skipped"; reason: "no-posts" };

/**
 * Which day's posts a report analyzes:
 * - morning report on day D analyzes D-1 (yesterday) and plans D.
 * - evening report on day D analyzes D (today).
 */
export function analyzeDateFor(type: ReportType, reportDate: string): string {
  return type === "morning" ? previousLocalDate(reportDate) : reportDate;
}

/**
 * Generate (and persist) a report of the given type for one user.
 * Idempotent: re-running upserts the same (user, reportDate, type) row.
 */
export async function generateReport(
  userId: string,
  reportDate: string,
  type: ReportType,
): Promise<GenerateOutcome> {
  const analyzeDate = analyzeDateFor(type, reportDate);
  const posts = await listPostsForLocalDay(userId, analyzeDate);
  if (posts.length === 0) {
    return { status: "skipped", reason: "no-posts" };
  }

  const forAnalysis: PostForAnalysis[] = posts.map((p) => ({
    content: p.content,
    mood: p.mood,
    createdAt: p.createdAt.toISOString(),
  }));

  const { payload, model } = await analyzeDay(type, analyzeDate, forAnalysis);

  const report = await upsertReport({
    userId,
    reportDate,
    type,
    payload,
    model,
    postCount: posts.length,
  });

  return { status: "generated", report };
}
