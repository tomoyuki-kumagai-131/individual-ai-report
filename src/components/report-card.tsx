import { Card, CardBody, Chip } from "@heroui/react";
import { REPORT_TYPE_META, type ReportPayload, type ReportType } from "@/types";

const MOOD_LABEL: Record<number, string> = {
  1: "とても低い",
  2: "低め",
  3: "ふつう",
  4: "良い",
  5: "とても良い",
};

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-default-700">
      <span aria-hidden className="text-base">
        {icon}
      </span>
      {children}
    </h3>
  );
}

export function ReportCard({
  reportDate,
  type = "evening",
  payload,
  postCount,
}: {
  reportDate: string;
  type?: ReportType;
  payload: ReportPayload;
  postCount?: number;
}) {
  const meta = REPORT_TYPE_META[type];
  return (
    <Card className="glass-card overflow-hidden" shadow="none">
      {/* Gradient header band */}
      <div className="bg-gradient-to-br from-primary to-secondary px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              {meta.icon} {meta.badge}
            </p>
            <h2 className="text-xl font-bold">{reportDate}</h2>
          </div>
          <div className="rounded-2xl bg-white/15 px-3 py-2 backdrop-blur">
            <MoodMeterInverted score={payload.moodScore} />
          </div>
        </div>
        {payload.emotions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {payload.emotions.map((e) => (
              <span
                key={e}
                className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur"
              >
                {e}
              </span>
            ))}
          </div>
        )}
      </div>

      <CardBody className="gap-6 p-6">
        <section>
          <SectionTitle icon="📝">{meta.summaryTitle}</SectionTitle>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-default-700">
            {payload.summary}
          </p>
        </section>

        <section>
          <SectionTitle icon="🧠">今日の思考性</SectionTitle>
          <ul className="flex flex-col gap-2">
            {payload.thinkingPatterns.map((tp, i) => (
              <li
                key={i}
                className="rounded-2xl border border-default-100 bg-default-50/60 p-3.5"
              >
                <div className="mb-1 flex items-center gap-2">
                  <Chip
                    size="sm"
                    variant="flat"
                    color="secondary"
                    className="font-medium"
                  >
                    {tp.label}
                  </Chip>
                </div>
                <p className="text-sm leading-relaxed text-default-500">{tp.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle icon="🚀">{meta.actionsTitle}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {payload.nextActions.map((a, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-3.5"
              >
                <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-default-800">{a.title}</p>
                  <p className="text-sm leading-relaxed text-default-500">{a.why}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 p-4">
          <p className="text-sm italic leading-relaxed text-default-700">
            {payload.encouragement}
          </p>
        </div>

        {typeof postCount === "number" && (
          <p className="text-center text-xs text-default-400">
            {postCount} 件の投稿から生成されました
          </p>
        )}
      </CardBody>
    </Card>
  );
}

/** Mood meter variant for use on the colored header (white on translucent). */
function MoodMeterInverted({ score }: { score: number }) {
  const pct = (score / 5) * 100;
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-[10px] font-medium text-white/80">
        気分 {MOOD_LABEL[score] ?? score}
      </span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/25">
        <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
