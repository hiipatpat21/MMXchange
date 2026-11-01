"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const addSchema = z.object({
  skillId: z.coerce.number().int().positive(),
  kind: z.enum(["teach", "learn"]),
});

export async function addSkill(formData: FormData) {
  const parsed = addSchema.safeParse({
    skillId: formData.get("skillId"),
    kind: formData.get("kind"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("profile_skills").insert({
    profile_id: user.id,
    skill_id: parsed.data.skillId,
    kind: parsed.data.kind,
  });
  if (error) console.error("addSkill failed:", error.message);

  revalidatePath("/skills");
}

export async function removeSkill(formData: FormData) {
  const parsed = z.coerce.number().int().positive().safeParse(formData.get("skillId"));
  if (!parsed.success) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("profile_skills")
    .delete()
    .eq("profile_id", user.id)
    .eq("skill_id", parsed.data);
  if (error) console.error("removeSkill failed:", error.message);

  revalidatePath("/skills");
}