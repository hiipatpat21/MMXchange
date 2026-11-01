"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ExchangeActionState } from "@/lib/exchanges";
import { parseManilaInput } from "@/lib/datetime";

const skillId = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const requestSchema = z.object({
  recipientId: z.string().uuid("Choose a valid student."),
  learnSkillId: skillId,
  teachSkillId: skillId,
  message: z.string().trim().min(10, "Write a message of at least 10 characters.").max(500, "Keep your message to 500 characters."),
  format: z.enum(["in_person", "online", "either"], { message: "Choose a meeting format." }),
  availability: z.string().trim().max(300, "Keep availability to 300 characters."),
  notes: z.string().trim().max(500, "Keep learning goals to 500 characters."),
});

const rejectionMessages: Record<string, string> = {
  not_logged_in: "Please sign in to continue.",
  self_request: "Choose another student for an exchange.",
  recipient_not_found: "This student could not be found. Choose someone from Discover.",
  profile_not_found: "Your profile could not be found. Please sign in again.",
  recipient_does_not_teach: "This student no longer offers that teaching skill. Reload and choose another skill.",
  you_do_not_teach: "Add the skill you are offering to your teaching skills first.",
  duplicate_active: "You already have an active request with this student. Check your Exchanges, including Incoming and Active.",
  invalid_input: "Check the skills, message, and meeting preferences and try again.",
  invalid_action: "Choose a valid response.",
  not_found: "This exchange could not be found.",
  not_allowed: "You cannot make that change to this exchange.",
  invalid_transition: "This exchange has already changed. Reload to see its current status.",
  invalid_teacher_skill: "Choose one of the two teachers and their agreed exchange skill.",
  session_not_scheduled: "This session has already been cancelled or completed. Reload to see its status.",
  past_date: "Choose a valid start time in the future (Philippine time).",
  too_early: "You can confirm completion after a non-cancelled session has started.",
};

export async function createExchangeRequest(_previous: ExchangeActionState, formData: FormData): Promise<ExchangeActionState> {
  const parsed = requestSchema.safeParse({
    recipientId: formData.get("recipientId"),
    learnSkillId: formData.get("learnSkillId"),
    teachSkillId: formData.get("teachSkillId"),
    message: formData.get("message"),
    format: formData.get("format"),
    availability: formData.get("availability") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in to continue." };
  const d = parsed.data;
  const { data, error } = await supabase.rpc("create_exchange_request", {
    p_recipient: d.recipientId,
    p_learn_skill: d.learnSkillId,
    p_teach_skill: d.teachSkillId,
    p_message: d.message,
    p_format: d.format,
    p_availability: d.availability || null,
    p_notes: d.notes || null,
  });
  if (error) return { error: "Could not send your request. Please try again." };
  if (typeof data !== "string") return { error: "Could not send your request." };
  if (!data.startsWith("ok:")) return { error: rejectionMessages[data] ?? "Could not send your request." };
  const id = z.string().uuid().safeParse(data.slice(3));
  if (!id.success) return { error: "Your request was sent, but could not be opened. Check Exchanges." };
  revalidatePath("/exchanges");
  revalidatePath(`/exchanges/${id.data}`);
  revalidatePath("/", "layout");
  redirect(`/exchanges/${id.data}`);
}

const sessionSchema = z.object({
  startsAt: z.string().refine((value) => {
    const date = parseManilaInput(value);
    return !!date && date.getTime() > Date.now();
  }, "Choose a valid future start time in Philippine time."),
  duration: z.coerce.number().int().min(15, "Duration must be at least 15 minutes.").max(480, "Duration cannot exceed 480 minutes."),
  format: z.enum(["in_person", "online"], { message: "Choose a meeting format." }),
  venue: z.string().trim().min(2, "Enter a venue or meeting link.").max(200, "Keep the venue to 200 characters."),
  notes: z.string().trim().max(500, "Keep preparation notes to 500 characters."),
});

function sessionFields(formData: FormData) {
  return { startsAt: formData.get("startsAt"), duration: formData.get("duration"), format: formData.get("format"), venue: formData.get("venue"), notes: formData.get("notes") ?? "" };
}

function sessionArguments(data: z.infer<typeof sessionSchema>) {
  return { p_starts_at: parseManilaInput(data.startsAt)!.toISOString(), p_duration: data.duration, p_format: data.format, p_venue: data.venue, p_notes: data.notes || null };
}

function sessionResult(data: unknown, error: { message: string } | null, exchangeId: string): ExchangeActionState {
  if (error) return { error: "Could not update the exchange. Please try again." };
  revalidatePath("/exchanges");
  revalidatePath(`/exchanges/${exchangeId}`);
  revalidatePath("/", "layout");
  if (data !== "ok") return { error: rejectionMessages[String(data)] ?? "Could not update the exchange." };
  return { message: "Exchange updated." };
}

export async function scheduleSession(_previous: ExchangeActionState, formData: FormData): Promise<ExchangeActionState> {
  const parsed = sessionSchema.extend({ exchangeId: z.string().uuid(), teacherId: z.string().uuid() }).safeParse({ ...sessionFields(formData), exchangeId: formData.get("exchangeId"), teacherId: formData.get("teacherId") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in to continue." };
  const d = parsed.data;
  const { data: exchange, error: readError } = await supabase.from("exchange_requests").select("requester_id, recipient_id, teach_skill_id, learn_skill_id").eq("id", d.exchangeId).maybeSingle();
  if (readError) return { error: "Could not load the exchange. Please try again." };
  if (!exchange || ![exchange.requester_id, exchange.recipient_id].includes(user.id)) return { error: rejectionMessages.not_allowed };
  if (![exchange.requester_id, exchange.recipient_id].includes(d.teacherId)) return { error: rejectionMessages.invalid_teacher_skill };
  // Derive the skill from the agreement; never trust a skill ID in form data.
  const skill = d.teacherId === exchange.requester_id ? exchange.teach_skill_id : exchange.learn_skill_id;
  const { data, error } = await supabase.rpc("schedule_exchange_session", { ...sessionArguments(d), p_exchange_id: d.exchangeId, p_teacher_id: d.teacherId, p_skill_id: skill });
  return sessionResult(data, error, d.exchangeId);
}

export async function rescheduleSession(_previous: ExchangeActionState, formData: FormData): Promise<ExchangeActionState> {
  const parsed = sessionSchema.extend({ sessionId: z.string().uuid() }).safeParse({ ...sessionFields(formData), sessionId: formData.get("sessionId") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in to continue." };
  const { data: session, error: readError } = await supabase.from("exchange_sessions").select("exchange_id").eq("id", parsed.data.sessionId).maybeSingle();
  if (readError) return { error: "Could not load the session. Please try again." };
  if (!session) return { error: rejectionMessages.not_allowed };
  const { data, error } = await supabase.rpc("reschedule_exchange_session", { ...sessionArguments(parsed.data), p_session_id: parsed.data.sessionId });
  return sessionResult(data, error, session.exchange_id);
}

export async function cancelSession(_previous: ExchangeActionState, formData: FormData): Promise<ExchangeActionState> {
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return { error: "Choose a valid session." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in to continue." };
  const { data: session, error: readError } = await supabase.from("exchange_sessions").select("exchange_id").eq("id", id.data).maybeSingle();
  if (readError) return { error: "Could not load the session. Please try again." };
  if (!session) return { error: rejectionMessages.not_allowed };
  const { data, error } = await supabase.rpc("cancel_exchange_session", { p_session_id: id.data });
  return sessionResult(data, error, session.exchange_id);
}

export async function markExchangeComplete(_previous: ExchangeActionState, formData: FormData): Promise<ExchangeActionState> {
  const id = z.string().uuid().safeParse(formData.get("exchangeId"));
  if (!id.success) return { error: "Choose a valid exchange." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in to continue." };
  const { data, error } = await supabase.rpc("mark_exchange_complete", { p_exchange_id: id.data });
  return sessionResult(data, error, id.data);
}

export async function respondToExchange(formData: FormData): Promise<ExchangeActionState> {
  const parsed = z.object({ exchangeId: z.string().uuid(), action: z.enum(["accept", "decline", "cancel"]) }).safeParse({ exchangeId: formData.get("exchangeId"), action: formData.get("action") });
  if (!parsed.success) return { error: "Choose a valid exchange and response." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in to continue." };
  const { data, error } = await supabase.rpc("respond_to_exchange", { p_exchange_id: parsed.data.exchangeId, p_action: parsed.data.action });
  if (error) return { error: "Could not update the exchange. Please try again." };
  revalidatePath("/exchanges");
  revalidatePath(`/exchanges/${parsed.data.exchangeId}`);
  revalidatePath("/", "layout");
  if (data !== "ok") return { error: rejectionMessages[String(data)] ?? "Could not update the exchange." };
  return { message: "Exchange updated." };
}
