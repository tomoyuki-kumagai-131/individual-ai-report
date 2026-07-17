import { analyzeDay } from "@/lib/ai/analyze";
import { updateUserProfile } from "@/lib/ai/profile";
import { listPostsForLocalDay } from "@/db/queries/posts";
import { upsertReport } from "@/db/queries/reports";
import { getProfile, upsertProfile } from "@/db/queries/profiles";
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

  // Load the accumulated profile so the analysis reflects long-term patterns.
  const profile = await getProfile(userId);

  const { payload, model } = await analyzeDay(
    type,
    analyzeDate,
    forAnalysis,
    profile?.content ?? null,
  );

  const report = await upsertReport({
    userId,
    reportDate,
    type,
    payload,
    model,
    postCount: posts.length,
  });

  // Fold this day into the profile. Best-effort: a failure here must not fail
  // the report the user is waiting on.
  try {
    const content = await updateUserProfile({
      existing: profile?.content ?? null,
      analyzeDate,
      posts: forAnalysis,
      payload,
    });
    await upsertProfile({
      userId,
      content,
      reportCount: (profile?.reportCount ?? 0) + 1,
    });
  } catch (err) {
    console.error("profile update failed (non-fatal):", err);
  }

  return { status: "generated", report };
}
