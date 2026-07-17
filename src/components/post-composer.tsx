"use client";

import { useState } from "react";
import { Button, Card, CardBody, Textarea } from "@heroui/react";
import { useRouter } from "next/navigation";

const MOODS = [
  { value: 1, label: "😢" },
  { value: 2, label: "🙁" },
  { value: 3, label: "😐" },
  { value: 4, label: "🙂" },
  { value: 5, label: "😄" },
];

/** Composer for posting a thought, with an optional mood. */
export function PostComposer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mood }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "投稿に失敗しました");
      }
      setContent("");
      setMood(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="glass-card" shadow="none">
      <CardBody className="gap-3 p-4">
        <Textarea
          placeholder="いま感じていること、考えていることを書いてみましょう…"
          minRows={3}
          value={content}
          onValueChange={setContent}
          isDisabled={submitting}
          variant="flat"
          classNames={{ inputWrapper: "bg-default-100/60" }}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                aria-label={`気分 ${m.value}`}
                onClick={() => setMood(mood === m.value ? null : m.value)}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all ${
                  mood === m.value
                    ? "scale-110 bg-primary/15 ring-2 ring-primary"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Button
            color="primary"
            radius="full"
            className="bg-gradient-to-r from-primary to-secondary font-semibold shadow-md shadow-primary/30"
            onPress={submit}
            isLoading={submitting}
            isDisabled={!content.trim()}
          >
            投稿する
          </Button>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
      </CardBody>
    </Card>
  );
}
