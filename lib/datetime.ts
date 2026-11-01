const TIME_ZONE = "Asia/Manila";

// Turns "2026-11-10T14:00" from a datetime-local input into a real moment,
// treating it as Philippine time (UTC+8).
export function parseManilaInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+08:00`);
  return Number.isNaN(date.getTime()) || formatManilaInput(date.toISOString()) !== value ? null : date;
}

// Pre-fill datetime-local controls in Manila time, regardless of browser zone.
export function formatManilaInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

// Keep one conversion implementation for both group and exchange forms.
export const toManilaInput = formatManilaInput;
