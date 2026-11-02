"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const addSchema = z.object({
  skillId: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  kind: z.enum(["teach", "learn"]),
});

type SkillState = { error?: string; message?: string } | null;

export async function addSkill(_previous: SkillState, formData: FormData): Promise<SkillState> {
  const parsed = addSchema.safeParse({
    skillId: formData.get("skillId"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) return { error: "Choose a valid skill and list." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { error } = await supabase.from("profile_skills").insert({
    profile_id: user.id,
    skill_id: parsed.data.skillId,
    kind: parsed.data.kind,
  });
  if (error) return { error: error.code === "23505" ? "That skill is already in one of your lists." : "Could not add this skill. Please try again." };

  revalidatePath("/skills");
  revalidatePath("/dashboard");
  revalidatePath("/discover");
  revalidatePath(`/students/${user.id}`);
  return { message: "Skill added." };
}

export async function removeSkill(_previous: SkillState, formData: FormData): Promise<SkillState> {
  const parsed = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).safeParse(formData.get("skillId"));
  if (!parsed.success) return { error: "Choose a valid skill." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { data, error } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", user.id)
    .eq("skill_id", parsed.data).select("skill_id");
  if (error || !data?.length) return { error: "Could not remove this skill. Please refresh and try again." };

  revalidatePath("/skills");
  revalidatePath("/dashboard");
  revalidatePath("/discover");
  revalidatePath(`/students/${user.id}`);
  return { message: "Skill removed." };
}
