"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { centavos, parsePhp, lessonResult, lessonErrors, PAID_BOOKING_READY, type LessonState } from "@/lib/paid-lessons";

function refresh(id?: string) {
  for (const path of ["/skills", "/discover", "/exchanges", "/messages", "/dashboard", "/notifications"]) revalidatePath(path);
  if (id) revalidatePath(`/lessons/${id}`);
  revalidatePath("/", "layout");
}
export async function savePaidOffer(_previous: LessonState, form: FormData): Promise<LessonState> {
  const parsed = z.object({ skill: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER), price: z.string().refine(value => parsePhp(value) !== null, "Enter PHP 0.01 to 10,000.00, with at most two decimals."), enabled: z.enum(["on", "off"]) }).safeParse({ skill: form.get("skill"), price: form.get("price"), enabled: form.get("enabled") ?? "off" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { error: "Please sign in again." };
  const { data, error } = await client.rpc("save_paid_lesson_offer", { p_skill: parsed.data.skill, p_price: parsePhp(parsed.data.price), p_enabled: parsed.data.enabled === "on" });
  const result = lessonResult(data, error);
  if (!result?.error) { refresh(); revalidatePath(`/students/${user.id}`); }
  return result?.error ? result : { message: "Offering saved. Paid requests remain closed until scheduling and payment setup is ready." };
}
export async function requestPaidLesson(_previous: LessonState, form: FormData): Promise<LessonState> {
  const parsed = z.object({ offer: z.string().uuid(), price: centavos, message: z.string().trim().min(10).max(500) }).safeParse({ offer: form.get("offer"), price: form.get("price"), message: form.get("message") });
  if (!parsed.success) return { error: "Choose an offering and write a message of 10-500 characters." };
  if (!PAID_BOOKING_READY) return { error: lessonErrors.release_closed };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { error: "Please sign in again." };
  const { data, error } = await client.rpc("create_paid_lesson_request", { p_offer: parsed.data.offer, p_expected_price: parsed.data.price, p_message: parsed.data.message });
  if (error || typeof data !== "string") return { error: "Could not send the lesson request. Try again." };
  if (!data.startsWith("ok:")) return { error: lessonErrors[data] ?? "Could not send this request." };
  const id = z.string().uuid().safeParse(data.slice(3));
  if (!id.success) return { error: "Request sent. Open My learning to find it." };
  refresh(id.data);
  redirect(`/lessons/${id.data}`);
}
export async function changePaidLesson(_previous: LessonState, form: FormData): Promise<LessonState> {
  const parsed = z.object({ id: z.string().uuid(), action: z.enum(["accept", "decline", "cancel", "complete"]), price: centavos.optional() }).safeParse({ id: form.get("id"), action: form.get("action"), price: form.get("price") ?? undefined });
  if (!parsed.success) return { error: "Choose a valid lesson and action." };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { error: "Please sign in again." };
  const d = parsed.data;
  const { data, error } = d.action === "complete"
    ? await client.rpc("complete_paid_lesson", { p_request: d.id })
    : await client.rpc("respond_paid_lesson_request", { p_request: d.id, p_action: d.action, p_expected_price: d.price ?? null });
  const result = lessonResult(data, error);
  if (!result?.error) refresh(d.id);
  return result;
}
export async function submitLessonContent(_previous: LessonState, form: FormData): Promise<LessonState> {
  const parsed = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("message"), id: z.string().uuid(), body: z.string().trim().min(1).max(2000) }),
    z.object({ kind: z.literal("review"), id: z.string().uuid(), body: z.string().trim().max(500), rating: z.coerce.number().int().min(1).max(5) }),
  ]).safeParse({ kind: form.get("kind"), id: form.get("id"), body: form.get("body"), rating: form.get("rating") });
  if (!parsed.success) return { error: "Check your message or rating and try again." };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { error: "Please sign in again." };
  const d = parsed.data;
  const { data, error } = d.kind === "message"
    ? await client.rpc("send_paid_lesson_message", { p_request: d.id, p_body: d.body })
    : await client.rpc("submit_paid_lesson_review", { p_request: d.id, p_rating: d.rating, p_comment: d.body });
  const result = lessonResult(data, error);
  if (!result?.error) refresh(d.id);
  return result?.error ? result : { message: d.kind === "message" ? "Message sent." : "Feedback submitted." };
}
