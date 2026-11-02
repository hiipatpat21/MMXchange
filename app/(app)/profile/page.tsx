import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";

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
  return <><AvatarUpload displayName={profile.display_name} avatarUrl={profile.avatar_url} /><ProfileForm profile={profile} /></>;
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-heading">Your profile</h1>
        <p className="mt-1 text-muted-foreground">
          This is what other students see. Your email and password are never shown.
        </p>
      </div>
      <Suspense fallback={<LoadingState label="Loading your profile..." variant="form" />}>
        <ProfileLoader />
      </Suspense>
    </div>
  );
}
