import type { SupabaseClient } from "@supabase/supabase-js";

export type OnboardingStep = "profile" | "skills" | "complete";
export function onboardingDestination(step: OnboardingStep) {
  return step === "complete" ? "/dashboard" : `/onboarding/${step}`;
}
export async function loadOnboardingStep(client: SupabaseClient, userId: string): Promise<OnboardingStep> {
  const { data, error } = await client.from("profile_onboarding").select("step").eq("profile_id", userId).single();
  if (error || !data || !["profile", "skills", "complete"].includes(data.step)) {
    throw new Error("Could not load setup progress. Reload and try again. If this is a new deployment, apply the Teacher Prompt 2 SQL first.");
  }
  return data.step as OnboardingStep;
}
