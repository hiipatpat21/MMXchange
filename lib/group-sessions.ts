import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { parseManilaInput } from "@/lib/datetime";
import { pickOne } from "@/lib/relations";

export type GroupSessionStatus = "published" | "cancelled" | "completed";
export type SessionDisplayStatus = "Open for registration" | "Full" | "Registration closed" | "Upcoming" | "Completed" | "Cancelled";
export type GroupSession = {
  id: string; organizer_id: string; skill_id: number; title: string; description: string;
  objectives: string | null; prerequisites: string | null; starts_at: string;
  duration_minutes: number; format: "in_person" | "online"; venue: string;
  capacity: number | null; registration_deadline: string | null; status: GroupSessionStatus;
};
type SessionRow = GroupSession & {
  skills: { name: string; category: string } | { name: string; category: string }[] | null;
  organizer: { display_name: string } | { display_name: string }[] | null;
};
export type SessionCardData = GroupSession & { skillName: string | null; organizerName: string | null; registered: number; displayStatus: SessionDisplayStatus };
export type SessionActionState = { error?: string; message?: string } | null;

export const sessionFilterSchema = z.object({
  q: z.string().trim().max(100), category: z.string().max(100),
  format: z.enum(["", "in_person", "online"]),
  date: z.string().refine((value) => !value || !!parseManilaInput(`${value}T00:00`), "Choose a valid date."),
  seats: z.enum(["", "1"]),
});
export type SessionFilters = z.infer<typeof sessionFilterSchema>;
export const groupSessionSelect = "*, skills!skill_id!inner(name, category), organizer:profiles!organizer_id(display_name)";

export function getSessionDisplayStatus(session: Pick<GroupSession, "status" | "starts_at" | "registration_deadline" | "capacity">, registered: number, now: number, participant = false): SessionDisplayStatus {
  if (session.status === "cancelled") return "Cancelled";
  if (session.status === "completed") return "Completed";
  if (Date.parse(session.starts_at) <= now) return "Registration closed";
  if (participant) return "Upcoming";
  if (session.registration_deadline && Date.parse(session.registration_deadline) <= now) return "Registration closed";
  if (session.capacity !== null && registered >= session.capacity) return "Full";
  return "Open for registration";
}

export async function getRegistrationCounts(supabase: SupabaseClient, ids: string[]) {
  const counts = new Map<string, number>();
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await supabase.rpc("registration_counts", { p_session_ids: ids.slice(offset, offset + 100) });
    if (error) throw new Error("Could not load registration counts.");
    for (const row of data as { session_id: string; registered: number }[]) counts.set(row.session_id, Number(row.registered));
  }
  return counts;
}

export async function loadSessionCards(supabase: SupabaseClient, options: {
  organizerId?: string; registeredId?: string; filters?: SessionFilters;
  limit?: number; upcomingOnly?: boolean; availableOnly?: boolean;
  registrationOpenOnly?: boolean; excludeOrganizerId?: string;
} = {}) {
  const now = Date.now();
  const sessions: SessionCardData[] = [];
  const selection = options.registeredId ? `${groupSessionSelect}, group_session_registrations!inner(profile_id)` : groupSessionSelect;
  let query = supabase.from("group_sessions").select(selection);
  if (options.organizerId) query = query.eq("organizer_id", options.organizerId);
  else if (options.registeredId) query = query.eq("group_session_registrations.profile_id", options.registeredId);
  else {
    const filters = options.filters;
    query = query.eq("status", "published").gt("starts_at", new Date(now).toISOString());
    if (filters?.date) query = query.gte("starts_at", parseManilaInput(`${filters.date}T00:00`)!.toISOString());
    if (filters?.q) query = query.ilike("title", `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`);
    if (filters?.category) query = query.eq("skills.category", filters.category);
    if (filters?.format) query = query.eq("format", filters.format);
  }
  if (options.upcomingOnly && (options.organizerId || options.registeredId)) query = query.eq("status", "published").gt("starts_at", new Date(now).toISOString());
  if (options.registrationOpenOnly) query = query.or(`registration_deadline.is.null,registration_deadline.gt.${new Date(now).toISOString()}`);
  if (options.excludeOrganizerId) query = query.neq("organizer_id", options.excludeOrganizerId);
  query = query.order("starts_at").order("id");
  const batchSize = options.limit === undefined ? 200 : 20;
  for (let offset = 0; ; offset += batchSize) {
    const { data, error } = await query.range(offset, offset + batchSize - 1);
    if (error) throw new Error("Could not load sessions.");
    const rows = data as unknown as SessionRow[];
    const counts = await getRegistrationCounts(supabase, rows.map((row) => row.id));
    for (const row of rows) {
      const registered = counts.get(row.id) ?? 0;
      if ((options.availableOnly || options.filters?.seats === "1") && row.capacity !== null && registered >= row.capacity) continue;
      sessions.push({ ...row, registered,
        skillName: pickOne(row.skills)?.name ?? null,
        organizerName: pickOne(row.organizer)?.display_name ?? null,
        displayStatus: getSessionDisplayStatus(row, registered, now, !!options.registeredId),
      });
      // Apply the limit after checking capacity, so full sessions cannot hide
      // an available session farther down the ordered list.
      if (options.limit !== undefined && sessions.length >= options.limit) return { now, sessions };
    }
    if (data.length < batchSize) break;
  }
  return { now, sessions };
}
