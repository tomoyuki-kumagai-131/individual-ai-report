import { Card, CardBody, CardHeader } from "@heroui/react";

/**
 * Renders the accumulated user profile. `content` is short markdown-ish text
 * (headings + bullets); we render it as-is with whitespace preserved.
 */
export function ProfileCard({
  content,
  updatedAt,
}: {
  content: string;
  updatedAt?: string;
}) {
  return (
    <Card className="glass-card overflow-hidden" shadow="none">
      <CardHeader className="flex-col items-start gap-0.5 bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-base">
            🪞
          </span>
          <h2 className="text-base font-bold text-default-800">あなたの傾向</h2>
        </div>
        <p className="text-xs text-default-500">
          レポートを重ねるほど、AIがあなたの思考のクセを学びます。
        </p>
      </CardHeader>
      <CardBody className="gap-2 p-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-default-700">
          {content}
        </p>
        {updatedAt && (
          <p className="text-right text-[11px] text-default-400">
            更新: {updatedAt}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
