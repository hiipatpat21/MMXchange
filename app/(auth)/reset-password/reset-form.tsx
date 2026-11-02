"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/(auth)/reset-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetForm() {
  const [state, action, pending] = useActionState(resetPassword, null);
  return <form action={action} className="space-y-5">
    <div className="space-y-2"><Label htmlFor="password">New password</Label><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} aria-describedby="password-hint" required /><p id="password-hint" className="text-sm text-muted-foreground">Use at least 8 characters.</p></div>
    <div className="space-y-2"><Label htmlFor="confirm">Confirm new password</Label><Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></div>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    <Button type="submit" disabled={pending} className="w-full">{pending ? "Saving..." : "Set new password"}</Button>
  </form>;
}
