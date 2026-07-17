import { z } from "zod";

/**
 * Central, validated access to environment variables.
 *
 * Server-only secrets live in `serverEnv` and must never be imported into a
 * client component. Public values live in `publicEnv`.
 */

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),
  APP_TIMEZONE: z.string().min(1).default("Asia/Tokyo"),
  CRON_SECRET: z.string().min(1),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
});

// Public env is safe to evaluate anywhere. Reference keys statically so Next.js
// can inline them into the client bundle.
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

/**
 * Lazily validate and return server-only env. Throws if called in the browser.
 */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called on the client");
  }
  if (!cachedServerEnv) {
    cachedServerEnv = serverSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
      APP_TIMEZONE: process.env.APP_TIMEZONE,
      CRON_SECRET: process.env.CRON_SECRET,
    });
  }
  return cachedServerEnv;
}
