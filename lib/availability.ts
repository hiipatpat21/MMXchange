import { z } from "zod";
import { formatManilaInput, parseManilaInput } from "@/lib/datetime";
export type AvailabilityState = { error?: string; message?: string } | null;
export type WeeklyWindow = { id: string; weekday: number; start_minute: number; end_minute: number };
export const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const availabilityErrors: Record<string, string> = {
  payment_method_required: "The tutor must upload a GCash QR in My skills before this time can be reserved.",
  payment_closed: "Refresh this lesson to check the latest payment status.",
  not_authenticated: "Please sign in again.", not_logged_in: "Please sign in again.",
  invalid_input: "Check the day and times and try again.", not_found: "This availability or meeting no longer exists.",
  duplicate_window: "That time window is already saved.", overlapping_window: "That window overlaps your existing hours. Choose another time or remove the old window first.",
  past_date: "Choose a future meeting time, or today or later for an unavailable date.",
  outside_horizon: "Choose a date within the next 30 days.", invalid_grid: "Meetings must start on the hour or half hour, with no seconds.",
  one_hour_required: "New and rescheduled meetings last one hour.",
  own_availability_missing: "Add your weekly availability in My profile first.",
  partner_availability_missing: "Your learning partner needs to add weekly availability in their profile. Ask them in Messages.",
  outside_availability: "This whole hour must fit both students' available hours and avoid unavailable dates.",
  slot_taken: "That time was just taken or conflicts with another meeting. Refresh the times and choose another slot.",
  no_slots: "No shared free hours on this date. Try another day, or ask your partner to update their availability.",
  not_allowed: "You cannot select times for this learning relationship.", invalid_transition: "This request or meeting has changed. Refresh to see its current status.",
  release_closed: "Paid reservations open after payment setup is complete.", meeting_started: "A confirmed meeting has started and cannot be rescheduled here.",
  payment_not_confirmed: "The tutor must verify payment before this reservation can be confirmed.", reservation_required: "Reserve a shared time before confirming a paid meeting.",
};
export function timeToMinute(value: string): number | null {
  if (value === "24:00") return 1440;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  return Number(value.slice(0,2)) * 60 + Number(value.slice(3));
}
export function minuteToTime(value: number): string {
  return `${String(Math.floor(value / 60)).padStart(2,"0")}:${String(value % 60).padStart(2,"0")}`;
}
export function isCalendarDay(value: string): boolean { return !!parseManilaInput(`${value}T00:00`); }
export const calendarDay = z.string().refine(isCalendarDay, "Choose a valid calendar date.");
export const windowSchema = z.object({ weekday: z.coerce.number().int().min(0).max(6), start: z.string(), end: z.string() })
  .refine(value => { const start = timeToMinute(value.start), end = timeToMinute(value.end); return start !== null && end !== null && start < end; }, "Choose a start time before the end time.");
export function meetingDateBounds(now: number) {
  return { min: formatManilaInput(new Date(now).toISOString()).slice(0,10), max: formatManilaInput(new Date(now + 30 * 86400000).toISOString()).slice(0,10) };
}
export function validMeetingStart(iso: string, now: number): boolean {
  if (!z.iso.datetime({ offset: true }).safeParse(iso).success) return false;
  const date = new Date(iso), time = date.getTime();
  return Number.isFinite(time) && time > now && time <= now + 30 * 86400000
    && date.getUTCMinutes() % 30 === 0 && date.getUTCSeconds() === 0 && date.getUTCMilliseconds() === 0;
}
