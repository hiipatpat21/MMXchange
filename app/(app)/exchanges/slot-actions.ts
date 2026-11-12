"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { calendarDay, availabilityErrors } from "@/lib/availability";
export type SlotResult = { slots: string[]; code?: string; error?: string };
export async function getSharedSlots(input: { kind: "exchange" | "paid"; id: string; day: string; exclude?: string }): Promise<SlotResult> {
  const parsed = z.object({ kind: z.enum(["exchange", "paid"]), id: z.string().uuid(), day: calendarDay, exclude: z.string().uuid().optional() }).safeParse(input);
  if (!parsed.success) return { slots: [], error: "Choose a valid date and learning request." };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { slots: [], error: "Please sign in again." };
  const d = parsed.data;
  const { data, error } = await client.rpc("shared_learning_slots", { p_kind: d.kind, p_id: d.id, p_day: d.day, p_exclude: d.exclude ?? null });
  if (error || !Array.isArray(data) || !data.length) return { slots: [], error: "Could not load shared times. Apply Teacher Prompt 4 SQL on a new deployment, then try again." };
  const code = String(data[0].code);
  if (code !== "ok") return { slots: [], code, error: availabilityErrors[code] ?? "Could not load shared times." };
  const rows = z.array(z.object({ code: z.literal("ok"), starts_at: z.iso.datetime({ offset: true }) })).safeParse(data);
  if (!rows.success) return { slots: [], error: "Could not read available times. Please refresh." };
  return { slots: rows.data.map(row => row.starts_at), code: "ok" };
}
