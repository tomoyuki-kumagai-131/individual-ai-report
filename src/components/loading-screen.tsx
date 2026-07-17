import { Spinner } from "@heroui/react";

/** Centered loading indicator used by route-level loading.tsx files. */
export function LoadingScreen({ label = "読み込み中…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <Spinner
        size="lg"
        classNames={{ circle1: "border-b-primary", circle2: "border-b-secondary" }}
      />
      <p className="text-sm text-default-400">{label}</p>
    </div>
  );
}
