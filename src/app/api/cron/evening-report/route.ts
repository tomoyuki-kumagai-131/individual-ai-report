import { type NextRequest } from "next/server";
import { handleCron } from "@/lib/reports/cron";

// 18:00 JST = 09:00 UTC (see vercel.json). Reviews today.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCron(request, "evening");
}
