import { ProfileAvailability } from "@/components/availability/profile-availability";
import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { PageIntro } from "@/components/layout/page-intro";

async function ProfileLoader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, college, program, year_level, bio, avatar_url")
    .eq("id", user.id)
    .single();

  if (error || !profile) return <p role="alert">Could not load your profile. Please reload to try again.</p>;
  return <><ProfileForm profile={profile} /><details className="disclosure"><summary>Profile photo <span className="text-xs font-normal text-muted-foreground">Optional</span></summary><AvatarUpload displayName={profile.display_name} avatarUrl={profile.avatar_url} /></details></>;
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageIntro title="My profile" />
      <Suspense fallback={<LoadingState label="Loading your profile..." variant="form" />}>
        <ProfileLoader />
      </Suspense>
      <Suspense fallback={<LoadingState label="Loading availability..." />}><ProfileAvailability /></Suspense>
    </div>
  );
}
