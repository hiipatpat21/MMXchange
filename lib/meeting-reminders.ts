export const REMINDER_WINDOW_MS = 5 * 60_000;
export const REMINDER_AFTER_START_MS = 60 * 60_000;
export const REMINDER_POLL_MS = 30_000;
export const REMINDER_FRESH_MS = 45_000;
export type ReminderMeeting = {
  kind: "exchange" | "paid"; id: string; title: string; startsAt: string;
  format: string; venue: string; href: string;
};
export type ReminderResult =
  | { status: "ok"; userId: string; serverNow: number; meetings: ReminderMeeting[] }
  | { status: "unauthenticated" | "error" };
export type ReminderSnapshot = { meetings: ReminderMeeting[]; now: number; error?: string };
export type ReminderRecord = { announced: boolean; dismissed: boolean; expiresAt: number };
export type ReminderRecords = Record<string, ReminderRecord>;

export function reminderTiming(startsAt: string, now: number) {
  const start = Date.parse(startsAt);
  if (!Number.isFinite(start) || !Number.isFinite(now) || now < start - REMINDER_WINDOW_MS || now >= start + REMINDER_AFTER_START_MS) return null;
  return { phase: now < start ? "upcoming" as const : "started" as const, seconds: now < start ? Math.ceil((start-now)/1000) : Math.floor((now-start)/1000) };
}
export function reminderCountdown(startsAt: string, now: number) {
  const timing = reminderTiming(startsAt,now);
  if (!timing) return "";
  const time = `${Math.floor(timing.seconds/60)}m ${String(timing.seconds%60).padStart(2,"0")}s`;
  return timing.phase === "upcoming" ? `Starts in ${time}` : `Meeting started · ${time} ago`;
}
export function reminderOccurrence(meeting: ReminderMeeting) {
  const start=Date.parse(meeting.startsAt);
  return `${meeting.kind}:${meeting.id}:${Number.isFinite(start) ? new Date(start).toISOString() : meeting.startsAt}`;
}
export function pruneReminderRecords(value: unknown, now: number): ReminderRecords {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key,row]) =>
    /^(exchange|paid):[0-9a-f-]{36}:/.test(key) && row && typeof row === "object"
    && typeof row.announced === "boolean" && typeof row.dismissed === "boolean"
    && Number.isFinite(row.expiresAt) && row.expiresAt > now
    && row.expiresAt <= now + REMINDER_WINDOW_MS + REMINDER_AFTER_START_MS));
}
export function visibleReminders(meetings: ReminderMeeting[], now: number, records: ReminderRecords) {
  return meetings.filter(meeting => reminderTiming(meeting.startsAt,now) && !records[reminderOccurrence(meeting)]?.dismissed)
    .sort((a,b) => Date.parse(a.startsAt)-Date.parse(b.startsAt) || reminderOccurrence(a).localeCompare(reminderOccurrence(b)));
}
