"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { windowSchema, timeToMinute, calendarDay, availabilityErrors, type AvailabilityState } from "@/lib/availability";

export async function changeAvailability(_previous: AvailabilityState, form: FormData): Promise<AvailabilityState> {
  const command = z.enum(["add", "remove", "unavailable", "available"]).safeParse(form.get("command"));
  if (!command.success) return { error: "Choose a valid availability action." };
  let name: string; let args: Record<string, string | number | boolean>;
  if (command.data === "add") {
    const parsed = windowSchema.safeParse({ weekday: form.get("weekday"), start: form.get("start"), end: form.get("end") });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    name = "add_availability_window"; args = { p_weekday: parsed.data.weekday, p_start: timeToMinute(parsed.data.start)!, p_end: timeToMinute(parsed.data.end)! };
  } else if (command.data === "remove") {
    const parsed = z.string().uuid().safeParse(form.get("id"));
    if (!parsed.success) return { error: "Choose a valid time window." };
    name = "remove_availability_window"; args = { p_id: parsed.data };
  } else {
    const parsed = calendarDay.safeParse(form.get("day"));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    name = "set_unavailable_date"; args = { p_day: parsed.data, p_unavailable: command.data === "unavailable" };
  }
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { error: "Please sign in again." };
  const { data, error } = await client.rpc(name, args);
  if (error) return { error: "Could not save availability. Apply Teacher Prompt 4 SQL on a new deployment, then try again." };
  if (data !== "ok") return { error: availabilityErrors[String(data)] ?? "Could not save availability." };
  revalidatePath("/", "layout");
  return { message: "Availability saved. Existing meetings and reservations are unchanged." };
}
