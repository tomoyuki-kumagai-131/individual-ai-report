import Link from "next/link";
import { notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getReportsForDate } from "@/db/queries/reports";
import { ReportCard } from "@/components/report-card";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const user = await getUser();
  if (!user) return null;

  const { date } = await params;
  const reports = await getReportsForDate(user.id, date);
  if (reports.length === 0) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/reports"
        className="w-fit text-sm text-default-500 transition-colors hover:text-primary"
      >
        ← レポート一覧へ
      </Link>
      <div className="flex flex-col gap-6">
        {reports.map((r) => (
          <ReportCard
            key={r.id}
            reportDate={r.reportDate}
            type={r.type}
            payload={r.payload}
            postCount={r.postCount}
          />
        ))}
      </div>
    </div>
  );
}
