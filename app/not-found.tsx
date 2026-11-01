import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-7 px-5 py-12 text-center outline-none">
      <Logo />
      <h1 className="page-heading">A little off course.</h1>
      <p className="text-muted-foreground">We couldn&apos;t find that page. Return home to find your next learning activity.</p>
      <Button asChild><Link href="/">Back to home</Link></Button>
    </main>
  );
}
