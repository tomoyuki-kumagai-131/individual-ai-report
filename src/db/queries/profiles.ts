import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";

/** The user's accumulated profile, or null if none yet. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const [row] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row ?? null;
}

/** Create or replace the user's profile. */
export async function upsertProfile(input: {
  userId: string;
  content: string;
  reportCount: number;
}): Promise<Profile> {
  const [row] = await db
    .insert(profiles)
    .values({
      userId: input.userId,
      content: input.content,
      reportCount: input.reportCount,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        content: input.content,
        reportCount: input.reportCount,
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}
