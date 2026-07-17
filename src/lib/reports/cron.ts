import { NextResponse, type NextRequest } from "next/server";
import { runBatch } from "./batch";
import { localDateString } from "@/lib/time";
import { serverEnv } from "@/lib/env";
import type { ReportType } from "@/types";

/**
 * Shared handler for the scheduled cron endpoints. Authenticates via CRON_SECRET
 * (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`) and runs the batch
 * for the current local day.
 */
export async function handleCron(request: NextRequest, type: ReportType) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${serverEnv().CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // "Today" in the app timezone. Morning fires at 06:00 JST, evening at 18:00.
  const reportDate = localDateString();
  const summary = await runBatch(type, reportDate);
  return NextResponse.json(summary);
}
