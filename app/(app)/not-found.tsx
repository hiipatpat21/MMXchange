import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="surface-card mx-auto max-w-xl space-y-5 p-7 sm:p-10">
      <p className="text-sm font-medium text-muted-foreground">Page not found</p>
      <h1 className="page-heading">This page isn&apos;t here.</h1>
      <p className="text-muted-foreground">The link may be incorrect, or this activity may no longer be available to your account.</p>
      <Button asChild><Link href="/dashboard">Back to dashboard</Link></Button>
    </div>
  );
}
