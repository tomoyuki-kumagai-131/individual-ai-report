import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reports, type Report } from "@/db/schema";
import type { ReportPayload, ReportType } from "@/types";

/** Upsert the report for (userId, reportDate, type). Regenerating overwrites it. */
export async function upsertReport(input: {
  userId: string;
  reportDate: string;
  type: ReportType;
  payload: ReportPayload;
  model: string;
  postCount: number;
}): Promise<Report> {
  const [row] = await db
    .insert(reports)
    .values({
      userId: input.userId,
      reportDate: input.reportDate,
      type: input.type,
      payload: input.payload,
      model: input.model,
      postCount: input.postCount,
    })
    .onConflictDoUpdate({
      target: [reports.userId, reports.reportDate, reports.type],
      set: {
        payload: input.payload,
        model: input.model,
        postCount: input.postCount,
        createdAt: new Date(),
      },
    })
    .returning();
  return row;
}

/** List a user's reports, newest day first (morning before evening within a day). */
export async function listReports(userId: string, limit = 60): Promise<Report[]> {
  return db
    .select()
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.reportDate), desc(reports.type))
    .limit(limit);
}

/** All reports (morning + evening) for a user on a given local date. */
export async function getReportsForDate(
  userId: string,
  reportDate: string,
): Promise<Report[]> {
  return db
    .select()
    .from(reports)
    .where(and(eq(reports.userId, userId), eq(reports.reportDate, reportDate)))
    .orderBy(desc(reports.type));
}

export interface ReportSummary {
  reportDate: string;
  type: ReportType;
  moodScore: number;
}

/** Lightweight per-report summaries for the calendar view. */
export async function listReportSummaries(
  userId: string,
  limit = 400,
): Promise<ReportSummary[]> {
  const rows = await db
    .select({
      reportDate: reports.reportDate,
      type: reports.type,
      payload: reports.payload,
    })
    .from(reports)
    .where(eq(reports.userId, userId))
    .orderBy(desc(reports.reportDate))
    .limit(limit);
  return rows.map((r) => ({
    reportDate: r.reportDate,
    type: r.type,
    moodScore: r.payload.moodScore,
  }));
}

/** Fetch one report by date + type, or null. */
export async function getReport(
  userId: string,
  reportDate: string,
  type: ReportType,
): Promise<Report | null> {
  const [row] = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.userId, userId),
        eq(reports.reportDate, reportDate),
        eq(reports.type, type),
      ),
    )
    .limit(1);
  return row ?? null;
}
