import type { SupabaseClient } from "@supabase/supabase-js";
export async function loadLessonListState(client: SupabaseClient, ids: string[]) {
  if (!ids.length) return { bookings: [], payments: [], error:false, now:Date.now() };
  const [bookings, payments] = await Promise.all([
    client.from("paid_lesson_bookings").select("request_id,status,starts_at").in("request_id",ids),
    client.from("paid_lesson_payments").select("request_id,status").in("request_id",ids),
  ]);
  return { bookings:bookings.data ?? [], payments:payments.data ?? [], error:!!(bookings.error || payments.error), now:Date.now() };
}
