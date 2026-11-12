"use server";

import { profileFields, profileSchema } from "@/lib/profile-validation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { avatarFileError, isOwnAvatarPath } from "@/lib/avatars";

type ProfileState = { error?: string; message?: string } | null;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse(profileFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be logged in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      college: parsed.data.college || null,
      program: parsed.data.program || null,
      year_level: Number(parsed.data.yearLevel),
      bio: parsed.data.bio || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Could not save your profile. Please try again." };

  revalidatePath("/", "layout");
  return { message: "Profile saved." };
}

export async function saveAvatar(_previous: ProfileState, formData: FormData): Promise<ProfileState> {
  const path = z.string().min(1).max(200).safeParse(formData.get("path"));
  if (!path.success) return { error: "Choose a valid uploaded photo." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in before saving a photo." };
  if (!isOwnAvatarPath(path.data, user.id)) return { error: "Choose a photo from your own uploads." };
  const { data: file, error: fileError } = await supabase.storage.from("avatars").info(path.data);
  if (fileError || !file || avatarFileError({ type: file.contentType ?? "", size: file.size ?? 0 })) return { error: "The uploaded photo is unavailable or does not meet the file limits." };
  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path.data);
  const { data, error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id).select("id");
  if (error || !data?.length) return { error: "Could not save your photo. Please try again." };
  revalidatePath("/", "layout");
  return { message: "Profile photo saved." };
}
