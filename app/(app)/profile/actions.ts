"use server";

import { colleges } from "@/lib/mmsu-programs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { avatarFileError, isOwnAvatarPath } from "@/lib/avatars";

type ProfileState = { error?: string; message?: string } | null;

const profileSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(50),
  college: z.string().trim().max(100),
  program: z.string().trim().max(100),
  yearLevel: z.string(),
  bio: z.string().trim().max(300, "Bio must be 300 characters or fewer."),
});

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const parsed = profileSchema.safeParse({
    displayName: String(formData.get("displayName") ?? ""),
    college: String(formData.get("college") ?? ""),
    program: String(formData.get("program") ?? ""),
    yearLevel: String(formData.get("yearLevel") ?? ""),
    bio: String(formData.get("bio") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const year = parsed.data.yearLevel === "" ? null : Number(parsed.data.yearLevel);
  if (year !== null && !(Number.isInteger(year) && year >= 1 && year <= 4)) {
    return { error: "Choose a valid year level." };
  }

  const collegeEntry = colleges.find((c) => c.name === parsed.data.college);
    if (parsed.data.college && !collegeEntry) {
    return { error: "Choose a valid college." };
    }
    if (parsed.data.program && !collegeEntry?.programs.includes(parsed.data.program)) {
    return { error: "Choose a program that belongs to your college." };
    }

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
      year_level: year,
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
