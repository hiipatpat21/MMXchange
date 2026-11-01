"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sessionSchema, readSessionForm } from "@/lib/session-validation";
import { getRegistrationCounts, type SessionActionState } from "@/lib/group-sessions";

function refreshSessions(id?: string) {
  for (const path of ["/sessions", "/sessions/registered", "/sessions/organized"]) revalidatePath(path);
  if (id) {
    revalidatePath(`/sessions/${id}`);
    revalidatePath(`/sessions/${id}/edit`);
  }
}

const rejectionMessages: Record<string, string> = {
  not_logged_in: "You need to be logged in.",
  not_found: "This session no longer exists.",
  not_open: "This session is no longer published. Reload to see its status.",
  not_organizer: "Only the organizer can change this session.",
  is_organizer: "You are the organizer of this session.",
  closed: "Registration is closed for this session.",
  already_registered: "You are already registered.",
  full: "Sorry, this session is full.",
  too_early: "You can complete the session after its start time.",
  capacity_too_low: "The participant limit cannot be below the number already registered.",
  past_date: "Choose a future start time in Philippine time.",
  invalid_input: "Check the session details and try again.",
  invalid_skill: "Choose an available skill or topic.",
};

function mutationResult(data: unknown, error: { message: string } | null, id: string): SessionActionState {
  if (error) return { error: "Could not update the session. Please try again." };
  refreshSessions(id);
  return data === "ok" ? { message: "Session updated." } : { error: rejectionMessages[String(data)] ?? "Could not update the session." };
}

export async function createSession(_previous: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const parsed = sessionSchema.safeParse(readSessionForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "You need to be logged in." };
  const { data, error } = await supabase.from("group_sessions").insert({
    organizer_id: user.id, skill_id: d.skillId, title: d.title, description: d.description,
    objectives: d.objectives || null, prerequisites: d.prerequisites || null, starts_at: d.startsAt,
    duration_minutes: d.durationMinutes, format: d.format, venue: d.venue,
    capacity: d.capacity, registration_deadline: d.deadline,
  }).select("id").single();
  if (error || !data) return { error: "Could not create the session. Please try again." };
  refreshSessions(data.id);
  redirect(`/sessions/${data.id}`);
}

export async function updateSession(_previous: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const parsed = sessionSchema.safeParse(readSessionForm(formData));
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return { error: "Invalid session." };
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "You need to be logged in." };
  const { data: current, error: readError } = await supabase.from("group_sessions").select("id, status").eq("id", id.data).eq("organizer_id", user.id).maybeSingle();
  if (readError) return { error: "Could not load the session. Please try again." };
  if (!current) return { error: rejectionMessages.not_organizer };
  if (current.status !== "published") return { error: rejectionMessages.not_open };
  const d = parsed.data;
  let counts: Map<string, number>;
  try { counts = await getRegistrationCounts(supabase, [id.data]); }
  catch { return { error: "Could not check the registered count. Please try again." }; }
  if (d.capacity !== null && d.capacity < (counts.get(id.data) ?? 0)) return { error: rejectionMessages.capacity_too_low };
  // The function repeats the count while holding the registration lock.
  const { data, error } = await supabase.rpc("update_group_session", {
    p_session_id: id.data, p_title: d.title, p_skill_id: d.skillId, p_description: d.description,
    p_objectives: d.objectives || null, p_prerequisites: d.prerequisites || null,
    p_starts_at: d.startsAt, p_duration_minutes: d.durationMinutes, p_format: d.format,
    p_venue: d.venue, p_capacity: d.capacity, p_registration_deadline: d.deadline,
  });
  const result = mutationResult(data, error, id.data);
  if (result?.error) return result;
  redirect(`/sessions/${id.data}`);
}

export async function registerForSession(_previous: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return { error: "Invalid session." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "You need to be logged in." };
  const { data, error } = await supabase.rpc("register_for_session", { p_session_id: id.data });
  const result = mutationResult(data, error, id.data);
  return result?.error ? result : { message: "You are registered!" };
}

export async function cancelRegistration(_previous: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return { error: "Invalid session." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "You need to be logged in." };
  const { data, error } = await supabase.from("group_session_registrations").delete().eq("session_id", id.data).eq("profile_id", user.id).select("session_id");
  if (error || !data?.length) return { error: "Could not cancel. The session may have already started." };
  refreshSessions(id.data);
  return { message: "Registration cancelled." };
}

export async function cancelSession(_previous: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return { error: "Invalid session." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "You need to be logged in." };
  const { data, error } = await supabase.rpc("cancel_group_session", { p_session_id: id.data });
  return mutationResult(data, error, id.data);
}

export async function completeSession(_previous: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return { error: "Invalid session." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "You need to be logged in." };
  const { data, error } = await supabase.rpc("complete_group_session", { p_session_id: id.data });
  return mutationResult(data, error, id.data);
}
