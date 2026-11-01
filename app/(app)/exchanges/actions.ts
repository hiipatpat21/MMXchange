"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ExchangeActionState } from "@/lib/exchanges";

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
  redirect(`/exchanges/${id.data}`);
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
  if (data !== "ok") return { error: rejectionMessages[String(data)] ?? "Could not update the exchange." };
  return { message: "Exchange updated." };
}
