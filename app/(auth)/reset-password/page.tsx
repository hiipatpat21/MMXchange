import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getRecoveryContext } from "@/lib/recovery";
import { ResetForm } from "@/app/(auth)/reset-password/reset-form";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";

async function RecoveryLoader() {
  const supabase = await createClient();
  const recovery = await getRecoveryContext(supabase);
  if (!recovery.allowed) return <div className="space-y-4"><p role="alert" className="text-sm text-destructive">Open a valid reset link in the browser that requested it. The reset form is available for 15 minutes after opening the link.</p>{recovery.user ? <form action={logout}><Button type="submit" variant="outline">Sign out to request another link</Button></form> : <Button asChild variant="outline"><Link href="/forgot-password">Request another link</Link></Button>}</div>;
  return <ResetForm />;
}

export default function ResetPasswordPage() {
  return <section className="surface-card space-y-6 p-6 sm:p-8"><header className="space-y-3"><h1 className="text-3xl font-semibold tracking-tight">Choose a new password.</h1><p className="text-sm text-muted-foreground">Set a password for the account from your reset link.</p></header><Suspense fallback={<LoadingState label="Checking your reset link..." variant="form" />}><RecoveryLoader /></Suspense></section>;
}
