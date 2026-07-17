import { getUser } from "@/lib/supabase/server";
import { listReportSummaries } from "@/db/queries/reports";
import { localDateString } from "@/lib/time";
import { ReportCalendar, type CalendarDay } from "@/components/report-calendar";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await getUser();
  if (!user) return null;

  const summaries = await listReportSummaries(user.id);

  // Group per date. Prefer the evening report's mood when both exist.
  const days: Record<string, CalendarDay> = {};
  for (const s of summaries) {
    const day = (days[s.reportDate] ??= { types: [], mood: s.moodScore });
    day.types.push(s.type);
    if (s.type === "evening") day.mood = s.moodScore;
  }

  const today = localDateString();
  const initialMonth = today.slice(0, 7); // YYYY-MM

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight">カレンダー</h1>
        <p className="text-sm text-default-500">
          過去のレポートを日付から振り返れます。
        </p>
      </header>

      <ReportCalendar days={days} initialMonth={initialMonth} today={today} />
    </div>
  );
}
