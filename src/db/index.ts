import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

/**
 * Drizzle client backed by postgres-js, connected to Supabase Postgres.
 *
 * NOTE: Drizzle connects with a direct Postgres role, which bypasses RLS.
 * Every query MUST scope by userId — see src/db/queries/*. RLS policies are
 * still defined in the SQL migration as defense-in-depth for the anon/auth
 * roles used by PostgREST.
 */
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.client ??
  postgres(serverEnv().DATABASE_URL, {
    prepare: false, // required when using Supabase's transaction pooler
    max: 1,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.client = client;
}

export const db = drizzle(client, { schema });
export { schema };
