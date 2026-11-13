import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatchesForUser } from "@/lib/matching";

// React cache shares these calls only within the current server render.
// It does not cache one student's data for another student's request.
export const getDashboardContext = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  return { supabase, user };
});

export const getDashboardMatches = cache(async () => {
  const { supabase, user } = await getDashboardContext();
  return getMatchesForUser(supabase, user.id, { limit: 3 });
});

export type DashboardSuggestionInput = { hasTeachingSkill: boolean; hasMatches: boolean; acceptedExchangeId: string | null };
export function chooseDashboardSuggestion(input: DashboardSuggestionInput) {
  if (input.acceptedExchangeId) return { title: "Choose a shared hour", reason: "Your accepted exchange is ready to schedule. Set availability first if you have not already.", href: `/exchanges/${input.acceptedExchangeId}#schedule-session`, label: "Schedule your exchange" };
  if (!input.hasTeachingSkill || !input.hasMatches) return { title: "Find someone to learn from", reason: "Browse tutors without adding skills. A free swap needs complementary skills; individual paid lessons do not need a return skill.", href: "/discover?view=browse", label: "Browse tutors" };
  return { title: "Choose your next learning partner", reason: "Explore students whose skills complement yours.", href: "/discover", label: "Find a partner" };
}
