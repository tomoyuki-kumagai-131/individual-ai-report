import {
  pgTable,
  uuid,
  text,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
  smallint,
} from "drizzle-orm/pg-core";
import type { ReportPayload, ReportType } from "@/types";

/**
 * A single thought/feeling entry posted by the user during the day.
 * `userId` references Supabase's auth.users(id). We don't model auth.users in
 * Drizzle (it's managed by Supabase); we just store the uuid.
 */
export const posts = pgTable(
  "posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    content: text("content").notNull(),
    // Optional self-reported mood, 1 (low) .. 5 (high).
    mood: smallint("mood"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("posts_user_created_idx").on(t.userId, t.createdAt),
  ],
);

/**
 * One AI-generated report per user per local day. `payload` holds the
 * structured analysis (see ReportPayload). Regenerating a day upserts on
 * (userId, reportDate).
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    // The local day (app timezone) this report is presented for.
    reportDate: date("report_date").notNull(),
    // "morning" (reviews yesterday, plans today) or "evening" (reviews today).
    type: text("type").$type<ReportType>().notNull().default("evening"),
    payload: jsonb("payload").$type<ReportPayload>().notNull(),
    model: text("model").notNull(),
    postCount: smallint("post_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("reports_user_date_type_uq").on(t.userId, t.reportDate, t.type),
  ],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
