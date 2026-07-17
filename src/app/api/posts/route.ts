import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/server";
import { createPost, listPosts } from "@/db/queries/posts";

const createSchema = z.object({
  content: z.string().trim().min(1, "内容を入力してください").max(4000),
  mood: z.number().int().min(1).max(5).nullish(),
});

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = await listPosts(user.id);
  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "invalid input" },
      { status: 400 },
    );
  }

  const post = await createPost({
    userId: user.id,
    content: parsed.data.content,
    mood: parsed.data.mood ?? null,
  });

  return NextResponse.json({ post }, { status: 201 });
}
