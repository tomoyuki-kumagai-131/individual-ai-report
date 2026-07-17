import { type NextRequest } from "next/server";
import { handleCron } from "@/lib/reports/cron";

// 06:00 JST = 21:00 UTC (see vercel.json). Reviews yesterday, plans today.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return handleCron(request, "morning");
}
