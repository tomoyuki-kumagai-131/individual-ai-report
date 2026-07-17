/**
 * Timezone-aware helpers. Posts are bucketed into a "day" using the app
 * timezone (JST by default) so the 20:00 report covers the local day.
 */

const TZ = process.env.APP_TIMEZONE || "Asia/Tokyo";

/** Returns the local calendar date (YYYY-MM-DD) for `date` in the app tz. */
export function localDateString(date: Date = new Date(), timeZone: string = TZ): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Returns the UTC instants [start, end) that bound the given local day.
 * Used to query all posts created within that day.
 */
export function localDayRangeUtc(
  localDate: string,
  timeZone: string = TZ,
): { start: Date; end: Date } {
  const start = zonedDayStartUtc(localDate, timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * Given a local date (YYYY-MM-DD), compute the UTC Date for that day's 00:00
 * in `timeZone`. Handles the tz offset by measuring it at that instant.
 */
function zonedDayStartUtc(localDate: string, timeZone: string): Date {
  const [y, m, d] = localDate.split("-").map(Number);
  // Assume the target wall-clock time is midnight local.
  const asUtc = Date.UTC(y, m - 1, d, 0, 0, 0);
  const offsetMs = tzOffsetMs(new Date(asUtc), timeZone);
  return new Date(asUtc - offsetMs);
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function tzOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const map: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  const asIfUtc = Date.UTC(
    map.year,
    map.month - 1,
    map.day,
    map.hour === 24 ? 0 : map.hour,
    map.minute,
    map.second,
  );
  return asIfUtc - instant.getTime();
}

/** The local date (YYYY-MM-DD) `days` before `localDate`. */
export function shiftLocalDate(localDate: string, days: number): string {
  const [y, m, d] = localDate.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000;
  const dt = new Date(t);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** Yesterday, relative to the given local date (default: today). */
export function previousLocalDate(localDate: string = localDateString()): string {
  return shiftLocalDate(localDate, -1);
}

export const APP_TIMEZONE = TZ;
