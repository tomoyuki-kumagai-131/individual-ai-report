import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { generateReport } from "@/lib/reports/generate";
import { localDateString } from "@/lib/time";

const bodySchema = z.object({
  // Local date (YYYY-MM-DD). Defaults to today in the app timezone.
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  // Which report to (re)generate. The button generates today's evening review.
  type: z.enum(["morning", "evening"]).default("evening"),
});

/**
 * Manually (re)generate the current user's report for a given local day.
 * Powers the "今日を分析する" button (evening review of today).
 */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid input" }, { status: 400 });
  }

  const localDate = parsed.data.date ?? localDateString();

  try {
    const outcome = await generateReport(user.id, localDate, parsed.data.type);
    if (outcome.status === "skipped") {
      return NextResponse.json(
        { status: "skipped", reason: outcome.reason },
        { status: 200 },
      );
    }
    return NextResponse.json({ status: "generated", report: outcome.report });
  } catch (err) {
    const message = err instanceof Error ? err.message : "analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
