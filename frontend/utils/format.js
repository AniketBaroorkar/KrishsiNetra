const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return value || "";
  return dateFormatter.format(date);
}

export function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return value || "";
  return dateTimeFormatter.format(date);
}

export function formatRelative(value, now = new Date()) {
  const date = parseDate(value);
  if (!date) return value || "";
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffSec) < 45) return "just now";
  if (Math.abs(diffMin) < 45) return relativeFormatter.format(diffMin, "minute");
  if (Math.abs(diffHour) < 22) return relativeFormatter.format(diffHour, "hour");
  if (Math.abs(diffDay) < 7) return relativeFormatter.format(diffDay, "day");
  return dateFormatter.format(date);
}
