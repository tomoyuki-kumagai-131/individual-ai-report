"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Post } from "@/db/schema";

const MOOD_EMOJI: Record<number, string> = {
  1: "😢",
  2: "🙁",
  3: "😐",
  4: "🙂",
  5: "😄",
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(iso));
}

/** `posts` come from a server component; timestamps are ISO strings. */
export function PostList({
  posts,
}: {
  posts: Array<Pick<Post, "id" | "content" | "mood"> & { createdAt: string }>;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    setDeletingId(null);
    router.refresh();
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-default-200 py-10 text-center">
        <p className="text-3xl">🌱</p>
        <p className="mt-2 text-sm text-default-400">
          まだ投稿がありません。今の気持ちを綴ってみましょう。
        </p>
      </div>
    );
  }

  return (
    <ol className="relative flex flex-col gap-3 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-default-200">
      {posts.map((p) => (
        <li key={p.id} className="relative flex gap-3 pl-6">
          <span className="absolute left-0 top-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-gradient-to-br from-primary to-secondary shadow" />
          <div className="glass-card group flex flex-1 items-start justify-between gap-3 rounded-2xl p-3.5">
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-default-700">
                {p.content}
              </p>
              <span className="mt-1.5 block text-xs text-default-400">
                {formatTime(p.createdAt)}
                {p.mood ? ` ・ ${MOOD_EMOJI[p.mood]}` : ""}
              </span>
            </div>
            <Button
              size="sm"
              variant="light"
              color="danger"
              isIconOnly
              radius="full"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              isLoading={deletingId === p.id}
              onPress={() => remove(p.id)}
              aria-label="削除"
            >
              ✕
            </Button>
          </div>
        </li>
      ))}
    </ol>
  );
}
