import type { SupabaseClient } from "@supabase/supabase-js";

// Compare teaching skills with learning wishes in both directions.
// Both directions overlapping means a mutual match. Rank mutual matches first,
// then by the total overlap count, then newest profile. There is no percentage.
// Fetch only skill rows that overlap the current student's choices, not every
// student's skills. Apply the display limit AFTER ranking all candidates.
export type StudentProfile = {
  id: string;
  display_name: string;
  college: string | null;
  program: string | null;
  year_level: number | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type MatchSkill = { id: number; name: string };
export type ProfileSkill = { profile_id: string; skill_id: number; kind: "teach" | "learn" };
export type StudentMatch = {
  profile: StudentProfile;
  teachesMe: MatchSkill[];
  iTeachThem: MatchSkill[];
  mutual: boolean;
  overlapCount: number;
  explanation: string;
};

const profileColumns = "id, display_name, college, program, year_level, bio, avatar_url, created_at";

function skillNames(skills: MatchSkill[]): string {
  const names = skills.map((skill) => skill.name);
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function buildMatches(
  userId: string,
  mySkills: ProfileSkill[],
  candidateSkills: ProfileSkill[],
  profiles: StudentProfile[],
  skills: MatchSkill[],
): StudentMatch[] {
  const teachIds = new Set(mySkills.filter((row) => row.profile_id === userId && row.kind === "teach").map((row) => row.skill_id));
  const learnIds = new Set(mySkills.filter((row) => row.profile_id === userId && row.kind === "learn").map((row) => row.skill_id));
  const skillMap = new Map(skills.map((skill) => [skill.id, skill]));
  const grouped = new Map<string, { teach: Set<number>; learn: Set<number> }>();
  for (const row of candidateSkills) {
    if (row.profile_id === userId) continue;
    const group = grouped.get(row.profile_id) ?? { teach: new Set<number>(), learn: new Set<number>() };
    if (row.kind === "teach" && learnIds.has(row.skill_id)) group.teach.add(row.skill_id);
    if (row.kind === "learn" && teachIds.has(row.skill_id)) group.learn.add(row.skill_id);
    grouped.set(row.profile_id, group);
  }
  const namedSkills = (ids: Set<number>) => [...ids].map((id) => skillMap.get(id)).filter((skill): skill is MatchSkill => !!skill).sort((a, b) => a.name.localeCompare(b.name));
  const matches: StudentMatch[] = [];
  for (const profile of profiles) {
    const group = grouped.get(profile.id);
    if (!group) continue;
    const teachesMe = namedSkills(group.teach);
    const iTeachThem = namedSkills(group.learn);
    if (!teachesMe.length && !iTeachThem.length) continue;
    const mutual = teachesMe.length > 0 && iTeachThem.length > 0;
    const name = profile.display_name;
    const explanation = mutual
      ? `Great match! You can teach ${skillNames(iTeachThem)}, and ${name} can teach ${skillNames(teachesMe)}.`
      : teachesMe.length
        ? `${name} can teach ${skillNames(teachesMe)}, which you want to learn.`
        : `You can teach ${skillNames(iTeachThem)}, which ${name} wants to learn.`;
    matches.push({ profile, teachesMe, iTeachThem, mutual, overlapCount: teachesMe.length + iTeachThem.length, explanation });
  }
  return matches.sort((a, b) => Number(b.mutual) - Number(a.mutual) || b.overlapCount - a.overlapCount || Date.parse(b.profile.created_at) - Date.parse(a.profile.created_at) || a.profile.id.localeCompare(b.profile.id));
}

// Paginate filtered rows so Supabase's response-size limit cannot silently
// drop candidates before the ranking is calculated.
async function loadSkillRows(supabase: SupabaseClient, userId: string, kind?: "teach" | "learn", ids?: number[]) {
  const rows: ProfileSkill[] = [];
  if (ids && ids.length === 0) return rows;
  for (let offset = 0; ; offset += 500) {
    let query = supabase.from("profile_skills").select("profile_id, skill_id, kind").order("profile_id").order("skill_id").range(offset, offset + 499);
    query = kind ? query.neq("profile_id", userId).eq("kind", kind).in("skill_id", ids!) : query.eq("profile_id", userId);
    const { data, error } = await query;
    if (error) throw new Error("Could not load matching skills. Please try again.");
    rows.push(...(data as ProfileSkill[]));
    if (data.length < 500) return rows;
  }
}

export async function getMatchesForUser(supabase: SupabaseClient, userId: string, options?: { limit?: number }) {
  const mine = await loadSkillRows(supabase, userId);
  if (!mine.length) return { hasSkills: false, matches: [] as StudentMatch[] };
  const [teachers, learners] = await Promise.all([
    loadSkillRows(supabase, userId, "teach", mine.filter((row) => row.kind === "learn").map((row) => row.skill_id)),
    loadSkillRows(supabase, userId, "learn", mine.filter((row) => row.kind === "teach").map((row) => row.skill_id)),
  ]);
  const candidates = [...teachers, ...learners];
  const ids = [...new Set(candidates.map((row) => row.profile_id))];
  if (!ids.length) return { hasSkills: true, matches: [] as StudentMatch[] };
  const profiles: StudentProfile[] = [];
  // Small batches keep candidate IDs from making an oversized request URL.
  for (let offset = 0; offset < ids.length; offset += 100) {
    const { data, error } = await supabase.from("profiles").select(profileColumns).in("id", ids.slice(offset, offset + 100));
    if (error) throw new Error("Could not load matching students. Please try again.");
    profiles.push(...data);
  }
  const { data: skills, error } = await supabase.from("skills").select("id, name").in("id", [...new Set(mine.map((row) => row.skill_id))]);
  if (error) throw new Error("Could not load skill names. Please try again.");
  const matches = buildMatches(userId, mine, candidates, profiles, skills);
  return { hasSkills: true, matches: options?.limit === undefined ? matches : matches.slice(0, options.limit) };
}
