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

export type DashboardSuggestionInput = {
  hasTeachingSkill: boolean;
  hasMatches: boolean;
  hasRegistration: boolean;
  acceptedExchangeId: string | null;
  hasHosted: boolean;
};

// First applicable rule wins. These rules suggest an action, not a score.
export function chooseDashboardSuggestion(input: DashboardSuggestionInput) {
  if (!input.hasTeachingSkill) return {
    title: "Add a skill you can teach",
    reason: "Offering a skill lets you arrange a mutual exchange with another student.",
    href: "/skills", label: "Add a teaching skill",
  };
  if (!input.hasMatches && !input.hasRegistration) return {
    title: "Try a group learning session",
    reason: "There are no matching students yet, and you have not joined a group session. Group learning does not require a swap.",
    href: "/sessions", label: "Browse group sessions",
  };
  if (input.acceptedExchangeId) return {
    title: "Schedule your first exchange session",
    reason: "You have an accepted exchange that is waiting for a teaching session.",
    href: `/exchanges/${input.acceptedExchangeId}#schedule-session`, label: "Schedule a session",
  };
  if (!input.hasHosted) return {
    title: "Share what you know: host a session",
    reason: "You have a teaching skill and have not hosted a group session yet.",
    href: "/sessions/new", label: "Host a session",
  };
  return {
    title: "Choose your next learning partner",
    reason: "Explore students who share your learning interests whenever you are ready for another exchange.",
    href: "/discover", label: "Discover students",
  };
}
