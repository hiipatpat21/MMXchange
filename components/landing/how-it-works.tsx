import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LearningIllustration } from "@/components/ui/learning-illustration";

const steps = [
  { title: "Bring what you know", text: "Add skills you can teach and a few you’re curious about." },
  { title: "Find your people", text: "Meet a partner with complementary skills, or pick a group session." },
  { title: "Make it happen", text: "Plan a time, learn together, and share how it went." },
];

export function HowItWorks() {
  return (
    <section className="landing-start">
      <div className="landing-frame grid items-center gap-8 py-16 sm:py-20 md:grid-cols-[1fr_0.65fr] md:gap-16">
        <div>
          <h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">Curiosity looks good on you.</h2>
          <div className="mt-8 space-y-3">
            {steps.map(({ title, text }, index) => (
              <details key={title} name="getting-started" open={index === 0} className="rounded-2xl bg-white/70 px-5 py-1 text-foreground">
                <summary className="font-semibold">{title}</summary>
                <p className="pb-4 text-base">{text}</p>
              </details>
            ))}
          </div>
          <Button asChild className="mt-6"><Link href="/register">Start sharing your skills <span aria-hidden="true">→</span></Link></Button>
        </div>
        <LearningIllustration scene="curious" alt="A curious student thinking about what to learn next" sizes="(max-width: 767px) 200px, 320px" className="mx-auto w-48 sm:w-64 md:w-full md:max-w-xs" />
      </div>
    </section>
  );
}
