"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { availabilityErrors, validMeetingStart, type AvailabilityState } from "@/lib/availability";
import { PAID_BOOKING_READY } from "@/lib/paid-lessons";
import { validMeetingLocation, meetingUrlHint } from "@/lib/meeting-links";
export async function reservePaidBooking(_previous: AvailabilityState, form: FormData): Promise<AvailabilityState> {
  const parsed = z.object({ id: z.string().uuid(), startsAt: z.iso.datetime({ offset: true }).refine(value => validMeetingStart(value,Date.now())), format: z.enum(["online","in_person"]), venue: z.string().trim().min(2).max(200) }).refine(validMeetingLocation, { path:["venue"], message:meetingUrlHint }).safeParse({ id: form.get("id"), startsAt: form.get("startsAt"), format: form.get("format"), venue: form.get("venue") });
  if (!parsed.success) return { error: parsed.error.issues.find(issue => issue.message === meetingUrlHint)?.message ?? "Choose a shared future hour and enter a venue or meeting link of 2-200 characters." };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { error: "Please sign in again." };
  if (!PAID_BOOKING_READY) return { error: availabilityErrors.release_closed };
  const d = parsed.data;
  const { data, error } = await client.rpc("reserve_paid_lesson", { p_request: d.id, p_starts_at: d.startsAt, p_format: d.format, p_venue: d.venue });
  if (error) return { error: "Could not reserve this time. Please refresh and try again." };
  if (data !== "ok") return { error: availabilityErrors[String(data)] ?? "Could not reserve this time." };
  revalidatePath("/", "layout");
  return { message: "Time saved. Check the meeting and payment statuses above; saving a reservation does not confirm payment." };
}
