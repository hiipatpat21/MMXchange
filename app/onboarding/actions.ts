"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { profileFields, profileSchema } from "@/lib/profile-validation";

export type SetupState = { error?: string; message?: string } | null;
export async function saveSetupProfile(_previous: SetupState, formData: FormData): Promise<SetupState> {
  const parsed = profileSchema.safeParse(profileFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { error: "Please sign in again." };
  const value = parsed.data;
  const { data, error } = await client.rpc("save_onboarding_profile", {
    p_name: value.displayName, p_college: value.college, p_program: value.program,
    p_year: Number(value.yearLevel), p_bio: value.bio,
  });
  if (error || data !== "ok") return { error: "Could not save your profile. Check your details and try again." };
  revalidatePath("/", "layout");
  redirect("/onboarding/skills");
}
export async function finishSetup(_previous: SetupState, formData: FormData): Promise<SetupState> {
  const parsed = z.enum(["continue", "skip"]).safeParse(formData.get("intent"));
  if (!parsed.success) return { error: "Choose continue or skip." };
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { error: "Please sign in again." };
  const { data, error } = await client.rpc("finish_onboarding");
  if (error || data !== "ok") return { error: "Could not finish setup. Save your profile first, then try again." };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
