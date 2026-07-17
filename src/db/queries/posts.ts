import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { posts, type Post } from "@/db/schema";
import { localDayRangeUtc } from "@/lib/time";

/** Distinct user ids that created at least one post during the local day. */
export async function usersWithPostsForLocalDay(localDate: string): Promise<string[]> {
  const { start, end } = localDayRangeUtc(localDate);
  const rows = await db
    .selectDistinct({ userId: posts.userId })
    .from(posts)
    .where(and(gte(posts.createdAt, start), lt(posts.createdAt, end)));
  return rows.map((r) => r.userId);
}

/** Create a post for a user. */
export async function createPost(input: {
  userId: string;
  content: string;
  mood?: number | null;
}): Promise<Post> {
  const [row] = await db
    .insert(posts)
    .values({
      userId: input.userId,
      content: input.content,
      mood: input.mood ?? null,
    })
    .returning();
  return row;
}

/** List a user's posts, newest first. */
export async function listPosts(userId: string, limit = 50): Promise<Post[]> {
  return db
    .select()
    .from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

/** All posts a user created within the given local day (app timezone). */
export async function listPostsForLocalDay(
  userId: string,
  localDate: string,
): Promise<Post[]> {
  const { start, end } = localDayRangeUtc(localDate);
  return db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.userId, userId),
        gte(posts.createdAt, start),
        lt(posts.createdAt, end),
      ),
    )
    .orderBy(posts.createdAt);
}

/** Delete a post, scoped to its owner. Returns true if a row was removed. */
export async function deletePost(userId: string, postId: string): Promise<boolean> {
  const rows = await db
    .delete(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
    .returning({ id: posts.id });
  return rows.length > 0;
}
