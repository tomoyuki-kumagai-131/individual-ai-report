import { z } from "zod";

/**
 * The structured output of a daily analysis. This schema is the contract
 * between the AI harness (src/lib/ai) and everything that renders a report.
 * The model is forced to return exactly this shape via a tool definition.
 */
export const reportPayloadSchema = z.object({
  // 今日はこのようなことが起きた — a short narrative recap of the day.
  summary: z.string(),
  // Overall mood on a 1..5 scale, inferred from the posts.
  moodScore: z.number().min(1).max(5),
  // A few emotion labels detected across the day (e.g. 不安, 達成感).
  emotions: z.array(z.string()).max(8),
  // 今日の思考性 — recurring thinking patterns / cognitive tendencies.
  thinkingPatterns: z.array(
    z.object({
      label: z.string(),
      detail: z.string(),
    }),
  ),
  // Concrete, kind suggestions for what to do next.
  nextActions: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
    }),
  ),
  // One encouraging closing line addressed to the user.
  encouragement: z.string(),
});

export type ReportPayload = z.infer<typeof reportPayloadSchema>;

/**
 * Two kinds of auto-generated report:
 * - morning (朝6時): reviews *yesterday* and plans *today* (nextActions = 今日やること).
 * - evening (夜18時): reviews *today* (nextActions = 次どうすればいい).
 */
export type ReportType = "morning" | "evening";

/** UI labels that differ per report type. */
export const REPORT_TYPE_META: Record<
  ReportType,
  { badge: string; icon: string; summaryTitle: string; actionsTitle: string }
> = {
  morning: {
    badge: "朝のブリーフィング",
    icon: "🌅",
    summaryTitle: "昨日はこんな一日でした",
    actionsTitle: "今日やるべきこと",
  },
  evening: {
    badge: "夜の振り返り",
    icon: "🌙",
    summaryTitle: "今日はこんな一日でした",
    actionsTitle: "次、どうすればいい？",
  },
};

/** Serializable shape of a post handed to the AI. */
export interface PostForAnalysis {
  content: string;
  mood: number | null;
  /** ISO timestamp of creation. */
  createdAt: string;
}
