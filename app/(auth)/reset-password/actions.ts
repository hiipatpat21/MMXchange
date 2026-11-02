"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRecoveryContext, recoveryCookieName } from "@/lib/recovery";

type ResetState = { error?: string; message?: string } | null;

export async function resetPassword(_previous: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = z.object({
    password: z.string().min(8, "Use at least 8 characters.").max(128, "Use no more than 128 characters."),
    confirm: z.string(),
  }).refine((data) => data.password === data.confirm, { message: "The passwords do not match.", path: ["confirm"] }).safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createClient();
  const recovery = await getRecoveryContext(supabase);
  if (!recovery.allowed || !recovery.user) return { error: "Open a new password reset link before changing your password." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Could not set this password. Try a different password or request a new link." };
  (await cookies()).delete(recoveryCookieName);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
