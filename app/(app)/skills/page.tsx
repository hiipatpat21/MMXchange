import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { SkillsLoader } from "@/components/skills/skills-loader";
import { PageIntro } from "@/components/layout/page-intro";

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageIntro title="What’s your thing?" description="Something to share. Something to discover. Your two lists bring the right people together." />
      <Suspense fallback={<LoadingState label="Loading your skills..." />}>
        <SkillsLoader />
      </Suspense>
    </div>
  );
}
