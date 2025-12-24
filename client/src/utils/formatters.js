export function formatDateRange(start, end, timezone = "UTC") {
  if (!start) return "TBA";
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : null;

  const startFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  });

  const endFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  });

  const startLabel = startFormatter.format(startDate);
  if (!endDate) return startLabel;
  return `${startLabel} — ${endFormatter.format(endDate)}`;
}

export function formatNumber(value = 0) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function slotUsageLabel(used = 0, capacity = 0) {
  const remaining = Math.max(capacity - used, 0);
  return `${remaining} spots left of ${capacity}`;
}

export function asPercentage(part = 0, total = 1) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
