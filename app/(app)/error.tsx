"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="surface-card mx-auto max-w-xl space-y-5 p-7 sm:p-10">
      <h1 className="page-heading">Let&apos;s try that again.</h1>
      <p className="text-muted-foreground">This page could not load. Your learning space is still here—try again or head back to your dashboard.</p>
      <div className="flex flex-wrap gap-3"><Button onClick={reset}>Try again</Button><Button asChild variant="outline"><Link href="/dashboard">Back to dashboard</Link></Button></div>
    </div>
  );
}
