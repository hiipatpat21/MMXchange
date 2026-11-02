"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/(auth)/forgot-password/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RecoveryForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  return <form action={action} className="space-y-5">
    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="email" maxLength={254} required /></div>
    {state?.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state?.message && <p role="status" className="text-sm text-primary">{state.message}</p>}
    <Button type="submit" disabled={pending} className="w-full">{pending ? "Sending..." : "Send reset link"}</Button>
  </form>;
}
