import Link from "next/link";
import { LearningIllustration } from "@/components/ui/learning-illustration";

export function TwoWays() {
  return (
    <section id="ways-to-learn" className="landing-frame py-16 sm:py-20">
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Two ways to grow.</h2>
      <div className="mt-10 grid items-center gap-6 md:grid-cols-2 md:gap-x-16 md:gap-y-12">
        <LearningIllustration scene="exchange" alt="A pair of students sharing what they know" sizes="(max-width: 767px) 100vw, 45vw" className="mx-auto w-full max-w-sm" />
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold">One partner. Two skills.</h3>
          <p>Teach a skill, learn a skill. Find a student whose skills complement yours, then arrange your exchange together.</p>
          <p className="font-medium text-primary">Both of you teach. Both of you learn.</p>
          <Link href="/discover" className="landing-text-link">Find an exchange partner <span aria-hidden="true">→</span></Link>
        </div>
        <LearningIllustration scene="curious" alt="A student choosing what to learn next" sizes="(max-width: 767px) 100vw, 45vw" className="mx-auto w-full max-w-sm md:col-start-2 md:row-start-2" />
        <div className="space-y-4 md:col-start-1 md:row-start-2">
          <h3 className="text-2xl font-semibold">Learn with a tutor.</h3>
          <p>No skill to offer in return? Browse individual tutors and their listed lesson fees. Paid requests open when payment setup is ready.</p>
          <p className="font-medium text-primary">Pay directly through GCash, upload a receipt, then wait for the tutor to confirm.</p>
          <Link href="/discover?view=browse" className="landing-text-link">Browse tutors <span aria-hidden="true">→</span></Link>
        </div>
      </div>
    </section>
  );
}
