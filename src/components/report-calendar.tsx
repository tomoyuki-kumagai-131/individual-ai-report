"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@heroui/react";
import type { ReportType } from "@/types";

export type CalendarDay = { types: ReportType[]; mood: number };

const MOOD_EMOJI: Record<number, string> = {
  1: "😢",
  2: "🙁",
  3: "😐",
  4: "🙂",
  5: "😄",
};
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Month calendar. Days that have reports are highlighted with the day's mood
 * emoji and morning/evening dots, and link to that day's report detail.
 * All navigation is client-side over the pre-fetched `days` map.
 */
export function ReportCalendar({
  days,
  initialMonth,
  today,
}: {
  days: Record<string, CalendarDay>;
  /** YYYY-MM to open on. */
  initialMonth: string;
  /** Today's local date (YYYY-MM-DD) for the "today" ring. */
  today: string;
}) {
  const [y0, m0] = initialMonth.split("-").map(Number);
  const [cur, setCur] = useState({ y: y0, m: m0 }); // m is 1..12

  // Day-of-week of the 1st, and number of days in the month (tz-independent).
  const firstDow = new Date(Date.UTC(cur.y, cur.m - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(cur.y, cur.m, 0)).getUTCDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function shift(delta: number) {
    setCur((c) => {
      const idx = (c.y * 12 + (c.m - 1)) + delta;
      return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
    });
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      {/* Month header */}
      <div className="mb-3 flex items-center justify-between">
        <Button isIconOnly size="sm" variant="light" radius="full" onPress={() => shift(-1)} aria-label="前の月">
          ‹
        </Button>
        <span className="font-bold text-default-800">
          {cur.y}年 {cur.m}月
        </span>
        <Button isIconOnly size="sm" variant="light" radius="full" onPress={() => shift(1)} aria-label="次の月">
          ›
        </Button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`pb-1 text-xs font-medium ${
              i === 0 ? "text-danger" : i === 6 ? "text-primary" : "text-default-400"
            }`}
          >
            {w}
          </div>
        ))}

        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />;
          const dateStr = `${cur.y}-${pad(cur.m)}-${pad(d)}`;
          const info = days[dateStr];
          const isToday = dateStr === today;

          const inner = (
            <div
              className={`flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors ${
                info
                  ? "bg-primary/10 font-semibold text-default-800 hover:bg-primary/20"
                  : "text-default-500"
              } ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              <span>{d}</span>
              {info ? (
                <span className="text-sm leading-none">
                  {MOOD_EMOJI[info.mood] ?? "🙂"}
                </span>
              ) : (
                <span className="h-3.5" />
              )}
            </div>
          );

          return info ? (
            <Link key={dateStr} href={`/reports/${dateStr}`} aria-label={`${dateStr} のレポート`}>
              {inner}
            </Link>
          ) : (
            <div key={dateStr}>{inner}</div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-default-400">
        絵文字のある日はレポートあり。タップで開きます。
      </p>
    </div>
  );
}
