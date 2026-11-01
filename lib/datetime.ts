const TIME_ZONE = "Asia/Manila";

// Turns "2026-11-10T14:00" from a datetime-local input into a real moment,
// treating it as Philippine time (UTC+8).
export function parseManilaInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}