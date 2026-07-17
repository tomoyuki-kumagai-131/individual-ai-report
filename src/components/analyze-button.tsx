"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Triggers /api/analyze for today. On success, navigates to that day's report.
 */
export function AnalyzeButton({
  disabled,
  fullWidth,
}: {
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "分析に失敗しました");
      if (data.status === "skipped") {
        setNote("分析する投稿がまだありません。");
        setLoading(false);
        return;
      }
      // Navigate to the freshly generated report.
      const date: string | undefined = data.report?.reportDate;
      router.push(date ? `/reports/${date}` : "/reports");
      router.refresh();
      // Keep the spinner until the route transition completes.
    } catch (e) {
      setNote(e instanceof Error ? e.message : "分析に失敗しました");
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? "" : "items-end"}`}>
      <Button
        color="primary"
        radius="full"
        size={fullWidth ? "lg" : "sm"}
        className={`bg-gradient-to-r from-primary to-secondary font-semibold shadow-md shadow-primary/30 ${
          fullWidth ? "w-full" : ""
        }`}
        isLoading={loading}
        isDisabled={disabled || loading}
        onPress={run}
        startContent={!loading ? <span aria-hidden>✨</span> : undefined}
      >
        今日を分析する
      </Button>
      {note && <span className="text-xs text-default-400">{note}</span>}
    </div>
  );
}
