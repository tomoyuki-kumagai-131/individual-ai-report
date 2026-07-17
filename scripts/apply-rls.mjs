// Applies supabase/rls.sql to the database in DATABASE_URL.
//
// IMPORTANT: `drizzle-kit push` strips RLS/policies (the Drizzle schema doesn't
// declare them), so run this AFTER every `npm run db:push`:
//   npm run db:push && npm run db:rls
import postgres from "postgres";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(url, { prepare: false, max: 1 });
try {
  await sql.unsafe(readFileSync("supabase/rls.sql", "utf8"));
  const pol = await sql`
    select tablename, policyname from pg_policies
    where schemaname = 'public' order by tablename, policyname`;
  console.log("RLS applied. policies:", pol.map((p) => `${p.tablename}.${p.policyname}`).join(", "));
} catch (e) {
  console.error("RLS ERROR:", e.code || "", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 3 });
}
