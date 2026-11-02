import Link from "next/link";
import { RecoveryForm } from "@/app/(auth)/forgot-password/recovery-form";

export default function ForgotPasswordPage() {
  return <section className="surface-card space-y-6 p-6 sm:p-8">
    <header className="space-y-3"><h1 className="text-3xl font-semibold tracking-tight">Forgot your password?</h1><p className="text-sm text-muted-foreground">Enter your email to request a reset link. Open the link in this same browser.</p></header>
    <RecoveryForm />
    <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline">Back to log in</Link>
  </section>;
}
