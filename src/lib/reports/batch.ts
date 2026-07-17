import { usersWithPostsForLocalDay } from "@/db/queries/posts";
import { analyzeDateFor, generateReport } from "./generate";
import type { ReportType } from "@/types";

export interface BatchSummary {
  type: ReportType;
  reportDate: string;
  analyzeDate: string;
  total: number;
  generated: number;
  skipped: number;
  failed: number;
  errors: Array<{ userId: string; message: string }>;
}

/**
 * Generate reports of the given type for every user who posted on the analyzed
 * day. Runs sequentially to stay within API rate limits; failures are collected
 * (not thrown) so one bad user doesn't abort the whole batch.
 */
export async function runBatch(
  type: ReportType,
  reportDate: string,
): Promise<BatchSummary> {
  const analyzeDate = analyzeDateFor(type, reportDate);
  const userIds = await usersWithPostsForLocalDay(analyzeDate);

  const summary: BatchSummary = {
    type,
    reportDate,
    analyzeDate,
    total: userIds.length,
    generated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (const userId of userIds) {
    try {
      const outcome = await generateReport(userId, reportDate, type);
      if (outcome.status === "generated") summary.generated += 1;
      else summary.skipped += 1;
    } catch (err) {
      summary.failed += 1;
      summary.errors.push({
        userId,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return summary;
}
