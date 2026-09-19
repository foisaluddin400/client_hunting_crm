/**
 * Centralized Date & Timezone utilities for Client Hunting CRM.
 * Timezone is strictly locked to Bangladesh Time: Asia/Dhaka (UTC+6).
 */

export const CRM_TIMEZONE = "Asia/Dhaka";

/**
 * Parses any date input safely into a valid Date object, or null if invalid.
 */
export function parseDate(dateInput?: string | Date | number | null): Date | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Converts any date into "YYYY-MM-DD" representing the calendar day in Bangladesh timezone (Asia/Dhaka).
 */
export function toDhakaDateString(dateInput?: string | Date | number | null): string {
  const d = parseDate(dateInput) || new Date();
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: CRM_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    // Fallback if Intl timeZone fails
    const localTime = new Date(d.getTime() + 6 * 3600 * 1000);
    return localTime.toISOString().split("T")[0];
  }
}

/**
 * Returns today's "YYYY-MM-DD" in Bangladesh timezone (Asia/Dhaka).
 */
export function getDhakaTodayDateString(): string {
  return toDhakaDateString(new Date());
}

/**
 * Returns yesterday's "YYYY-MM-DD" in Bangladesh timezone (Asia/Dhaka).
 */
export function getDhakaYesterdayDateString(): string {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return toDhakaDateString(yesterday);
}

/**
 * Formats date in Bangladesh timezone: "Sep 19, 2026"
 */
export function formatDate(dateInput?: string | Date | number | null): string {
  const d = parseDate(dateInput);
  if (!d) return typeof dateInput === "string" ? dateInput : "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: CRM_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}

/**
 * Formats time in 12-hour format with AM/PM in Bangladesh timezone: "5:24 PM"
 */
export function formatTime(dateInput?: string | Date | number | null): string {
  const d = parseDate(dateInput);
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: CRM_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

/**
 * Formats date and time in Bangladesh timezone: "Sep 19, 2026, 5:24 PM"
 * If timeString is provided, appends it to the formatted date.
 */
export function formatDateTime(
  dateInput?: string | Date | number | null,
  timeString?: string
): string {
  const d = parseDate(dateInput);
  if (!d) return typeof dateInput === "string" ? dateInput : "—";

  if (timeString) {
    const formattedDate = formatDate(d);
    return `${formattedDate}, ${timeString}`;
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: CRM_TIMEZONE,
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return formatDate(d);
  }
}

/**
 * Formats date in long English in Bangladesh timezone: "September 19, 2026"
 */
export function formatEnglishDate(dateInput?: string | Date | number | null): string {
  const d = parseDate(dateInput);
  if (!d) return "";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: CRM_TIMEZONE,
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return formatDate(d);
  }
}

/**
 * Formats relative time ("Today", "Yesterday", "2 days ago", "1w ago")
 * calculated strictly relative to Bangladesh calendar days.
 */
export function formatRelativeTime(dateInput?: string | Date | number | null): string {
  const d = parseDate(dateInput);
  if (!d) return typeof dateInput === "string" ? dateInput : "—";

  const targetDateStr = toDhakaDateString(d);
  const todayStr = getDhakaTodayDateString();
  const yesterdayStr = getDhakaYesterdayDateString();

  if (targetDateStr === todayStr) return "Today";
  if (targetDateStr === yesterdayStr) return "Yesterday";

  try {
    const [ty, tm, td] = todayStr.split("-").map(Number);
    const [y, m, day] = targetDateStr.split("-").map(Number);

    const todayUtc = Date.UTC(ty, tm - 1, td);
    const targetUtc = Date.UTC(y, m - 1, day);
    const diffDays = Math.round((todayUtc - targetUtc) / (24 * 60 * 60 * 1000));

    if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
    if (diffDays >= 7 && diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  } catch {
    // fallback
  }

  return formatDate(d);
}

/**
 * Returns UTC start and end Date objects corresponding to 00:00:00.000 to 23:59:59.999
 * for a specific calendar day in Bangladesh timezone (Asia/Dhaka, UTC+6).
 *
 * Example: for "2026-09-19",
 * start = 2026-09-18T18:00:00.000Z
 * end   = 2026-09-19T17:59:59.999Z
 */
export function getDhakaDayRange(dateStr?: string): { start: Date; end: Date } {
  const target = dateStr || getDhakaTodayDateString();
  const parts = target.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];

  // Dhaka is UTC+6
  const startMs = Date.UTC(y, m - 1, d, 0 - 6, 0, 0, 0);
  const endMs = Date.UTC(y, m - 1, d, 23 - 6, 59, 59, 999);

  return {
    start: new Date(startMs),
    end: new Date(endMs),
  };
}
