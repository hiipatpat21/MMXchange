import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const recoveryCookieName = "mmx-recovery-session";
export const recoveryCookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const,
  path: "/", maxAge: 15 * 60,
};

export async function getRecoveryBinding(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !data || data.claims.sub !== user.id || typeof data.claims.session_id !== "string") return null;
  return { user, value: `${user.id}:${data.claims.session_id}` };
}

// A short-lived UI gate set only after a successful recovery-code exchange.
// Supabase authentication still authorizes the password change for this user.
export async function getRecoveryContext(supabase: SupabaseClient) {
  const binding = await getRecoveryBinding(supabase);
  const marker = (await cookies()).get(recoveryCookieName)?.value;
  return { user: binding?.user ?? null, allowed: !!binding && marker === binding.value };
}
