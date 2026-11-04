"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { emailDomainAllowed, getSiteUrl } from "@/lib/auth-redirects";
import { recoveryCookieName } from "@/lib/recovery";

type AuthState = { error?: string; message?: string } | null;

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

const registerSchema = z.object({
  displayName: z.string().trim().min(2, "Name must be at least 2 characters.").max(50),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password." };
  (await cookies()).delete(recoveryCookieName);
  redirect("/dashboard");
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!emailDomainAllowed(parsed.data.email, process.env.ALLOWED_EMAIL_DOMAINS)) {
    return { error: "Please use an email address from a domain allowed by this project." };
  }

  let origin: string;
  try { origin = getSiteUrl(); }
  catch { return { error: "Registration is not configured. Please try again later." }; }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });
  if (error) return { error: "Could not create your account. Please check your details and try again later." };

  // If email confirmation is on, there is no session yet.
  if (!data.session) return { message: "Check your email to confirm your account." };

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(recoveryCookieName);
  redirect("/login");
}
