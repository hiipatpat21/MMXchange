import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadOnboardingStep, onboardingDestination } from "@/lib/onboarding";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { SkillsLoader } from "@/components/skills/skills-loader";
import { SetupScreen } from "@/components/onboarding/setup-screen";
import { FinishForm } from "@/components/onboarding/finish-form";
import { LoadingState } from "@/components/ui/loading-state";

async function SetupLoader({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  if (step !== "profile" && step !== "skills") notFound();
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const current = await loadOnboardingStep(client, user.id);
  if (current !== step) redirect(onboardingDestination(current));
  if (step === "skills") return <SetupScreen step="skills"><FinishForm /><SkillsLoader onboarding /></SetupScreen>;
  const { data: profile, error } = await client.from("profiles").select("display_name, college, program, year_level, bio, avatar_url").eq("id", user.id).single();
  if (error || !profile) return <p role="alert">Could not load your profile. Reload to try again.</p>;
  return <SetupScreen step="profile"><ProfileForm profile={profile} onboarding />
    <details className="disclosure"><summary>Profile photo (optional)</summary><AvatarUpload displayName={profile.display_name} avatarUrl={profile.avatar_url} /></details>
  </SetupScreen>;
}
export default function SetupPage({ params }: { params: Promise<{ step: string }> }) {
  return <Suspense fallback={<LoadingState label="Loading your setup..." variant="form" />}><SetupLoader params={params} /></Suspense>;
}
