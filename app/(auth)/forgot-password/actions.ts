"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/auth-redirects";

type RecoveryState = { error?: string; message?: string } | null;

export async function requestPasswordReset(_previous: RecoveryState, formData: FormData): Promise<RecoveryState> {
  const email = z.string().trim().email("Enter a valid email address.").max(254).safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  let origin: string;
  try { origin = getSiteUrl(); }
  catch { return { error: "Password recovery is not configured. Please try again later." }; }
  const supabase = await createClient();
  // Always return the same message for valid addresses, including provider errors.
  // Do not expose whether an account exists or an address can receive email.
  try {
    await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
  } catch { /* Keep the response neutral for delivery and network failures too. */ }
  return { message: "If an account exists for that email, we sent a link." };
}
