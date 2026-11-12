import type { SupabaseClient } from "@supabase/supabase-js";
import type { WeeklyWindow } from "@/lib/availability";
export async function loadOwnAvailability(client: SupabaseClient, userId: string) {
  const windows: WeeklyWindow[] = [], dates: { day: string }[] = [];
  let error = false;
  for (let offset=0; ; offset+=500) {
    const result = await client.from("weekly_availability").select("id, weekday, start_minute, end_minute").eq("profile_id",userId).order("weekday").order("start_minute").order("id").range(offset,offset+499);
    if (result.error) { error=true; break; }
    windows.push(...result.data);
    if (result.data.length<500) break;
  }
  for (let offset=0; ; offset+=500) {
    const result = await client.from("unavailable_dates").select("day").eq("profile_id",userId).order("day").range(offset,offset+499);
    if (result.error) { error=true; break; }
    dates.push(...result.data);
    if (result.data.length<500) break;
  }
  return { windows, dates, error, now: Date.now() };
}
