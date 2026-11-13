"use server";
import { createClient } from "@/lib/supabase/server";
import { loadMeetingReminders } from "@/lib/meeting-reminders-data";
import type { ReminderResult } from "@/lib/meeting-reminders";

// Read-only action: no user ID, date range or meeting IDs are accepted from the browser.
export async function getMeetingReminders(): Promise<ReminderResult> {
  try {
    const client = await createClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error) return {status: error.status === 401 || error.status === 403 || error.name === "AuthSessionMissingError" ? "unauthenticated" : "error"};
    if (!user) return {status:"unauthenticated"};
    const snapshot = await loadMeetingReminders(client,user.id);
    return {status:"ok",userId:user.id,...snapshot};
  } catch { return {status:"error"}; }
}
