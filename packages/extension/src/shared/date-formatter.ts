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
