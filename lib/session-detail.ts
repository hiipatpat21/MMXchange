import type { SupabaseClient } from "@supabase/supabase-js";
import { getRegistrationCounts, groupSessionSelect, type GroupSession } from "@/lib/group-sessions";
import { pickOne } from "@/lib/relations";

type DetailRow = GroupSession & {
  skills: { name: string } | { name: string }[] | null;
  organizer: { display_name: string } | { display_name: string }[] | null;
};

export async function loadSessionDetail(supabase: SupabaseClient, id: string, userId: string) {
  const { data, error } = await supabase.from("group_sessions").select(groupSessionSelect).eq("id", id).maybeSingle();
  if (error) throw new Error("Could not load session.");
  if (!data) return null;
  const session = data as DetailRow;
  const [counts, mine] = await Promise.all([
    getRegistrationCounts(supabase, [id]),
    supabase.from("group_session_registrations").select("session_id").eq("session_id", id).eq("profile_id", userId).maybeSingle(),
  ]);
  if (mine.error) throw new Error("Could not load registration.");
  const participants: { id: string; name: string; program: string | null }[] = [];
  let participantsError = false;
  if (session.organizer_id === userId) {
    for (let offset = 0; ; offset += 500) {
      const { data: rows, error: listError } = await supabase.from("group_session_registrations")
        .select("profile_id, profiles!profile_id(display_name, program)")
        .eq("session_id", id).order("created_at").order("profile_id").range(offset, offset + 499);
      if (listError) { participantsError = true; break; }
      for (const row of rows ?? []) {
        const profile = pickOne<{ display_name: string; program: string | null }>(row.profiles);
        participants.push({ id: row.profile_id, name: profile?.display_name ?? "Student", program: profile?.program ?? null });
      }
      if (rows.length < 500) break;
    }
  }
  return { session, registered: counts.get(id) ?? 0, isRegistered: !!mine.data, participants, participantsError, now: Date.now() };
}
