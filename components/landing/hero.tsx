import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LearningIllustration } from "@/components/ui/learning-illustration";

export function Hero() {
  return (
    <section className="landing-hero">
      <div className="landing-frame grid items-center gap-8 py-12 sm:py-16 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
        <div className="space-y-6">
          <h1 className="max-w-md text-[2.75rem] font-bold leading-[1.04] tracking-tight sm:text-5xl lg:text-[4.5rem]">A skill for<br />a skill.</h1>
          <p className="max-w-md text-lg">Share what you know. Learn something new. Find a partner or a group session in your MMSU student community.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" asChild><Link href="/register">Find a learning partner <span aria-hidden="true">→</span></Link></Button>
            <Link href="#ways-to-learn" className="inline-flex min-h-12 items-center px-2 text-sm font-medium underline underline-offset-4">Explore the two ways</Link>
          </div>
        </div>
        <LearningIllustration scene="exchange" alt="Two students exchanging drawing and coding skills at a table" priority sizes="(max-width: 767px) 100vw, 55vw" className="mx-auto w-full max-w-xl" />
      </div>
    </section>
  );
}
