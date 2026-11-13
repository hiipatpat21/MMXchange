import type { SupabaseClient } from "@supabase/supabase-js";
import { pickOne } from "@/lib/relations";
import { homePreview, type HomeTask } from "@/lib/learning-guidance";

export async function loadHome(client: SupabaseClient, userId: string) {
  const now = new Date().toISOString();
  const [free, paid, requests, lessons, review, upload, availability] = await Promise.all([
    client.from("exchange_sessions").select("id, exchange_id, starts_at, skills!skill_id(name), exchange:exchange_requests!exchange_id!inner(status)").eq("status","scheduled").eq("exchange.status","scheduled").gt("starts_at",now).order("starts_at").order("id").limit(3),
    client.from("paid_lesson_bookings").select("request_id, starts_at, request:paid_lesson_requests!request_id!inner(skill_name,status)").eq("status","confirmed").eq("request.status","accepted").gt("starts_at",now).order("starts_at").order("request_id").limit(3),
    client.from("exchange_requests").select("id, created_at, requester:profiles!requester_id(display_name)").eq("recipient_id",userId).eq("status","pending").order("created_at").order("id").limit(3),
    client.from("paid_lesson_requests").select("id, skill_name, created_at").eq("tutor_id",userId).eq("status","pending").order("created_at").order("id").limit(3),
    client.from("paid_lesson_payments").select("request_id, request:paid_lesson_requests!request_id!inner(tutor_id,status,skill_name,booking:paid_lesson_bookings!request_id!inner(starts_at,status))").eq("status","submitted").eq("request.tutor_id",userId).eq("request.status","accepted").eq("request.booking.status","reserved").gt("request.booking.starts_at",now).order("request_id").limit(3),
    client.from("paid_lesson_payments").select("request_id, request:paid_lesson_requests!request_id!inner(learner_id,status,skill_name,booking:paid_lesson_bookings!request_id!inner(starts_at,status))").in("status",["awaiting_receipt","rejected"]).eq("request.learner_id",userId).eq("request.status","accepted").eq("request.booking.status","reserved").gt("request.booking.starts_at",now).order("request_id").limit(3),
    client.from("weekly_availability").select("id").eq("profile_id",userId).limit(1),
  ]);
  const meetingError = !!(free.error || paid.error), taskError = !!(requests.error || lessons.error || review.error || upload.error);
  const tasks: HomeTask[] = [
    ...(requests.data ?? []).map(r => ({ id:r.id,title:`Skill swap with ${pickOne<{display_name:string}>(r.requester)?.display_name ?? "Student"}`,label:"Review request",href:`/exchanges/${r.id}`,at:r.created_at,priority:1 })),
    ...(lessons.data ?? []).map(r => ({ id:r.id,title:r.skill_name,label:"Review request",href:`/lessons/${r.id}`,at:r.created_at,priority:1 })),
    ...(review.data ?? []).map(r => ({ id:r.request_id,title:pickOne<{skill_name:string}>(r.request)?.skill_name ?? "Paid lesson",label:"Review payment",href:`/lessons/${r.request_id}#payment`,at:pickOne<{starts_at:string}>(pickOne<{booking: {starts_at:string} | {starts_at:string}[]}>(r.request)?.booking)?.starts_at ?? now,priority:0 })),
    ...(upload.data ?? []).map(r => ({ id:r.request_id,title:pickOne<{skill_name:string}>(r.request)?.skill_name ?? "Paid lesson",label:"Upload receipt",href:`/lessons/${r.request_id}#payment`,at:pickOne<{starts_at:string}>(pickOne<{booking: {starts_at:string} | {starts_at:string}[]}>(r.request)?.booking)?.starts_at ?? now,priority:0 })),
  ];
  const preview = homePreview([
    ...(free.data ?? []).map(r => ({id:r.id,title:pickOne<{name:string}>(r.skills)?.name ?? "Skill swap",at:r.starts_at,kind:"Free skill swap",href:`/exchanges/${r.exchange_id}#sessions-heading`})),
    ...(paid.data ?? []).map(r => ({id:r.request_id,title:pickOne<{skill_name:string}>(r.request)?.skill_name ?? "Paid lesson",at:r.starts_at,kind:"Paid lesson",href:`/lessons/${r.request_id}#meeting`})),
  ],tasks);
  return { ...preview, meetingError, taskError, availabilityError:!!availability.error, hasAvailability:!!availability.data?.length };
}
