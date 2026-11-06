/**
 * Locale-aware date and time formatting module.
 * Provides human-readable timestamps, relative time hints,
 * and timeline grouping buckets ("Today", "Yesterday", "This week", "Earlier").
 */

export function formatLocaleDateTime(
  timestamp: number,
  locale?: string
): { formatted: string; full: string; relative: string } {
  const d = new Date(timestamp);
  const effectiveLocale = locale || (typeof navigator !== "undefined" ? navigator.language : "en-US");

  const dateFormatter = new Intl.DateTimeFormat(effectiveLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const fullFormatter = new Intl.DateTimeFormat(effectiveLocale, {
    dateStyle: "full",
    timeStyle: "long",
  });

  return {
    formatted: dateFormatter.format(d),
    full: fullFormatter.format(d),
    relative: formatRelativeTime(timestamp),
  };
}

export function formatRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDays = Math.floor(diffSec / 86400);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export type TimelineBucket = "Today" | "Yesterday" | "This week" | "Earlier";

/**
 * Formats exact timestamp per KuraCode D10 spec:
 * - "3:42 PM" for today
 * - "Yesterday 6:10 PM" for yesterday
 * - "5 Nov, 3:42 PM" for earlier dates
 */
export function formatExactTime(timestamp: number, locale = "en-US"): string {
  const d = new Date(timestamp);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const timeStr = d.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday) {
    return timeStr;
  }
  if (isYesterday) {
    return `Yesterday ${timeStr}`;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const month = months[d.getMonth()];

  if (d.getFullYear() === now.getFullYear()) {
    return `${day} ${month}, ${timeStr}`;
  }

  return `${day} ${month} ${d.getFullYear()}, ${timeStr}`;
}

/**
 * Returns full tooltip metadata string: full local date, time, timezone, and capturing device.
 */
export function formatTimestampTooltip(
  timestamp: number,
  device?: string,
  locale = "en-US"
): string {
  const d = new Date(timestamp);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const dateStr = d.toLocaleDateString(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = d.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  const base = `${dateStr} at ${timeStr} (${tz})`;
  return device ? `${base} • Device: ${device}` : base;
}

export function getTimelineBucket(timestamp: number): TimelineBucket {
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400 * 1000;
  const startOfWeek = startOfToday - now.getDay() * 86400 * 1000;

  if (timestamp >= startOfToday) {
    return "Today";
  } else if (timestamp >= startOfYesterday) {
    return "Yesterday";
  } else if (timestamp >= startOfWeek) {
    return "This week";
  } else {
    return "Earlier";
  }
}
