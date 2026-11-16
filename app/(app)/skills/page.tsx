import { OfferSettings } from "@/components/lessons/offer-settings";
import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { SkillsLoader } from "@/components/skills/skills-loader";
import { PageIntro } from "@/components/layout/page-intro";

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageIntro title="My skills" description="Add skills for free swaps or paid teaching. Optional for learners." />
      <Suspense fallback={<LoadingState label="Loading your skills..." />}>
        <SkillsLoader />
      </Suspense>
      <Suspense fallback={<LoadingState label="Loading paid teaching offers..." />}><OfferSettings /></Suspense>
    </div>
  );
}
