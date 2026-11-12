import { z } from "zod";
import { pickOne } from "@/lib/relations";
import type { SupabaseClient } from "@supabase/supabase-js";

// The database rollout switch remains authoritative for new requests.
export const PAID_BOOKING_READY = true;
export type LessonState = { error?: string; message?: string } | null;
export type PaidOffer = { id: string; tutor_id: string; skill_id: number; price_centavos: number; enabled: boolean; skill_name?: string };
export type PairOptions = { mutual: boolean; teachesMe: { id: number; name: string }[]; iTeachThem: { id: number; name: string }[]; offers: PaidOffer[]; ready: boolean };
export const requestStatuses = ["pending", "accepted", "declined", "cancelled", "completed"] as const;
export type PaidRequest = {
  id: string; learner_id: string; tutor_id: string; skill_id: number; skill_name: string;
  quoted_price_centavos: number; agreed_price_centavos: number | null; status: typeof requestStatuses[number];
  message: string; accepted_at: string | null; learner_completed_at: string | null; tutor_completed_at: string | null;
  created_at: string; tutor: { display_name: string } | { display_name: string }[] | null;
  learner: { display_name: string } | { display_name: string }[] | null;
};
export const paidRequestSelect = "id, learner_id, tutor_id, skill_id, skill_name, quoted_price_centavos, agreed_price_centavos, status, message, accepted_at, learner_completed_at, tutor_completed_at, created_at, tutor:profiles!tutor_id(display_name), learner:profiles!learner_id(display_name)";
export const centavos = z.coerce.number().int().min(1).max(1000000);
export function parsePhp(value: string): number | null {
  if (!/^(?:0|[1-9]\d{0,4})(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return amount >= 1 && amount <= 1000000 ? amount : null;
}
export function formatPhp(value: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value / 100);
}
export const lessonErrors: Record<string, string> = {
  not_authenticated: "Please sign in again.", setup_required: "Both students must finish profile setup first.",
  invalid_input: "Check your details and try again.", not_found: "This lesson or offering is unavailable.",
  payment_method_required: "The tutor needs to upload a GCash QR in My skills before reserving this lesson.",
  payment_closed: "The payment status changed. Refresh this lesson before trying again.",
  not_teaching: "The tutor no longer lists that teaching skill. Reload to choose another offering.",
  offer_unavailable: "This offering has been withdrawn. Reload to choose another tutor.",
  self_request: "Choose another tutor.", mutual_use_swap: "Your skills now match in both directions. Request a free skill swap instead.",
  price_changed: "The fee changed before acceptance. Cancel this request and send a new one at the current fee.",
  duplicate_active: "You already have a pending or accepted request for this offering. Check My learning.",
  not_allowed: "You cannot make that change to this lesson.", invalid_transition: "This lesson has changed. Refresh to see its current status.",
  release_closed: "Paid requests open after scheduling and payment setup is complete.",
  meeting_started: "This meeting has started; cancellation is no longer available. Message your learning partner.",
  messaging_closed: "Messages can be sent after acceptance and before completion or cancellation.",
  meeting_not_ready: "Completion requires a confirmed, paid meeting whose start time has passed.",
  not_completed: "Feedback opens after both students confirm completion.", already_reviewed: "Feedback has already been submitted.",
};
export function lessonResult(code: unknown, error: unknown): LessonState {
  if (error) return { error: "Could not save this change. Please try again." };
  return code === "ok" ? { message: "Lesson updated." } : { error: lessonErrors[String(code)] ?? "Could not update this lesson." };
}
export async function loadLearningOptions(client: SupabaseClient, userId: string, tutorIds: string[]): Promise<Map<string, PairOptions>> {
  const ids = [...new Set(tutorIds.filter(id => id !== userId))];
  const result = new Map<string, PairOptions>();
  if (!ids.length) return result;
  const rows: { profile_id: string; skill_id: number; kind: "teach" | "learn"; name: string }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("profile_skills").select("profile_id, skill_id, kind, skills(name)").in("profile_id", [userId, ...ids]).order("profile_id").order("skill_id").range(offset, offset + 499);
    if (error) throw new Error("Could not load complementary skills.");
    rows.push(...data.map(row => ({ ...row, name: pickOne<{ name: string }>(row.skills)?.name ?? "Skill" })));
    if (data.length < 500) break;
  }
  const offers: PaidOffer[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from("paid_lesson_offers").select("id, tutor_id, skill_id, price_centavos, enabled").in("tutor_id", ids).eq("enabled", true).order("id").range(offset, offset + 499);
    if (error) throw new Error("Could not load paid offers. Apply Teacher Prompt 3 SQL on a new deployment.");
    offers.push(...data);
    if (data.length < 500) break;
  }
  const { data: release, error } = await client.from("learning_release_settings").select("paid_requests_enabled").eq("id", true).single();
  if (error || !release) throw new Error("Could not load lesson availability.");
  const mine = rows.filter(row => row.profile_id === userId);
  for (const id of ids) {
    const theirs = rows.filter(row => row.profile_id === id);
    const teachesMe = theirs.filter(row => row.kind === "teach" && mine.some(m => m.kind === "learn" && m.skill_id === row.skill_id)).map(row => ({ id: row.skill_id, name: row.name }));
    const iTeachThem = mine.filter(row => row.kind === "teach" && theirs.some(t => t.kind === "learn" && t.skill_id === row.skill_id)).map(row => ({ id: row.skill_id, name: row.name }));
    result.set(id, { mutual: teachesMe.length > 0 && iTeachThem.length > 0, teachesMe, iTeachThem,
      offers: offers.filter(offer => offer.tutor_id === id && theirs.some(row => row.kind === "teach" && row.skill_id === offer.skill_id)).map(offer => ({ ...offer, skill_name: theirs.find(row => row.skill_id === offer.skill_id)?.name })), ready: PAID_BOOKING_READY && release.paid_requests_enabled });
  }
  return result;
}

// Read related state together and capture time after the database reads, as in exchange-sessions.ts.
export async function loadPaidLessonState(client: SupabaseClient, id: string) {
  const [booking, payment, review] = await Promise.all([
    client.from("paid_lesson_bookings").select("status, starts_at, format, venue").eq("request_id", id).maybeSingle(),
    client.from("paid_lesson_payments").select("status, amount_centavos").eq("request_id", id).maybeSingle(),
    client.from("paid_lesson_reviews").select("rating, comment").eq("request_id", id).maybeSingle(),
  ]);
  return { booking, payment, review, now: Date.now() };
}
