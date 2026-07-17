import { defineConfig } from "drizzle-kit";

// DATABASE_URL points to the Supabase Postgres instance (use the direct
// connection string for migrations, the pooled one for the app runtime).
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required for drizzle-kit. See .env.example");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  // Our tables live in the public schema; auth.users is managed by Supabase.
  schemaFilter: ["public"],
  verbose: true,
  strict: false,
});
