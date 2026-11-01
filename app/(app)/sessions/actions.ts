"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseManilaInput } from "@/lib/datetime";

type SessionFormState = { error?: string } | null;

const sessionSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(100, "Title must be 100 characters or fewer."),
  skillId: z.coerce.number().int().positive("Choose a skill or topic."),
  description: z.string().trim().min(10, "Description must be at least 10 characters.").max(1000, "Description must be 1000 characters or fewer."),
  objectives: z.string().trim().max(500, "Learning objectives must be 500 characters or fewer."),
  prerequisites: z.string().trim().max(500, "Requirements must be 500 characters or fewer."),
  startsAt: z.string(),
  durationMinutes: z.coerce.number().int().min(15, "Duration is too short.").max(480, "Duration is too long."),
  format: z.enum(["in_person", "online"], { message: "Choose a format." }),
  venue: z.string().trim().min(2, "Enter a venue or meeting details.").max(200, "Venue must be 200 characters or fewer."),
  capacity: z.string(),
  deadline: z.string(),
});

export async function createSession(
  _prev: SessionFormState,
  formData: FormData
): Promise<SessionFormState> {
  const text = (name: string) => String(formData.get(name) ?? "");

  const parsed = sessionSchema.safeParse({
    title: text("title"),
    skillId: text("skillId"),
    description: text("description"),
    objectives: text("objectives"),
    prerequisites: text("prerequisites"),
    startsAt: text("startsAt"),
    durationMinutes: text("durationMinutes"),
    format: text("format"),
    venue: text("venue"),
    capacity: text("capacity"),
    deadline: text("deadline"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const startsAt = parseManilaInput(d.startsAt);
  if (!startsAt) return { error: "Choose a valid date and start time." };
  if (startsAt.getTime() <= Date.now()) {
    return { error: "The session must start in the future." };
  }

  let deadline: Date | null = null;
  if (d.deadline) {
    deadline = parseManilaInput(d.deadline);
    if (!deadline) return { error: "Choose a valid registration deadline." };
    if (deadline.getTime() > startsAt.getTime()) {
      return { error: "The registration deadline must be before the session starts." };
    }
  }

  let capacity: number | null = null;
  if (d.capacity !== "") {
    capacity = Number(d.capacity);
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 500) {
      return { error: "Capacity must be a whole number from 1 to 500." };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { data, error } = await supabase
    .from("group_sessions")
    .insert({
      organizer_id: user.id,
      skill_id: d.skillId,
      title: d.title,
      description: d.description,
      objectives: d.objectives || null,
      prerequisites: d.prerequisites || null,
      starts_at: startsAt.toISOString(),
      duration_minutes: d.durationMinutes,
      format: d.format,
      venue: d.venue,
      capacity,
      registration_deadline: deadline ? deadline.toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Could not create the session. Please try again." };

  revalidatePath("/sessions");
  redirect(`/sessions/${data.id}`);

}

type ActionState = { error?: string; message?: string } | null;

const rejectionMessages: Record<string, string> = {
  not_logged_in: "You need to be logged in.",
  not_found: "This session no longer exists.",
  not_open: "This session is not open for registration.",
  is_organizer: "You're the organizer of this session.",
  closed: "Registration is closed for this session.",
  already_registered: "You're already registered.",
  full: "Sorry, this session is full.",
};

export async function registerForSession(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return { error: "Invalid session." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_for_session", {
    p_session_id: id.data,
  });
  if (error) return { error: "Could not register. Please try again." };

  revalidatePath(`/sessions/${id.data}`);
  revalidatePath("/sessions");

  if (data === "ok") return { message: "You're registered!" };
  return { error: rejectionMessages[data as string] ?? "Could not register." };
}

export async function cancelRegistration(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return { error: "Invalid session." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { data, error } = await supabase
    .from("group_session_registrations")
    .delete()
    .eq("session_id", id.data)
    .eq("profile_id", user.id)
    .select("session_id");

  if (error || !data || data.length === 0) {
    return { error: "Could not cancel. The session may have already started." };
  }

  revalidatePath(`/sessions/${id.data}`);
  revalidatePath("/sessions");
  return { message: "Registration cancelled." };
}

export async function cancelSession(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("sessionId"));
  if (!id.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("group_sessions")
    .update({ status: "cancelled" })
    .eq("id", id.data)
    .eq("organizer_id", user.id)
    .eq("status", "published");
  if (error) console.error("cancelSession failed:", error.message);

  revalidatePath(`/sessions/${id.data}`);
  revalidatePath("/sessions");
}