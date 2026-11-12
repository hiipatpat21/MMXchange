import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadOnboardingStep, onboardingDestination } from "@/lib/onboarding";
async function ResumeSetup() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  return redirect(onboardingDestination(await loadOnboardingStep(client, user.id)));
}
export default function OnboardingPage() {
  return <Suspense fallback={<p>Finding your next step...</p>}><ResumeSetup /></Suspense>;
}
