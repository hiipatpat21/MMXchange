
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-section";
import { DashboardGreeting } from "@/components/dashboard/greeting";
import { ProfileChecklist } from "@/components/dashboard/profile-checklist";
import { RecommendedMatches } from "@/components/dashboard/recommended-matches";
import { PendingRequests } from "@/components/dashboard/pending-requests";
import { LearningAgenda } from "@/components/dashboard/learning-agenda";
import { SuggestedNextStep } from "@/components/dashboard/suggested-next-step";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Suspense fallback={<h1 className="page-heading">Your learning space</h1>}><DashboardGreeting /></Suspense>
        <p className="text-sm text-muted-foreground">A little learning, a little sharing. What&apos;s next for you?</p>
      </header>
      <Suspense fallback={null}><ProfileChecklist /></Suspense>
      <div className="dashboard-grid">
        <div className="dashboard-main"><Suspense fallback={<DashboardSkeleton title="Your next step" />}><SuggestedNextStep /></Suspense></div>
        <div className="dashboard-side"><Suspense fallback={<DashboardSkeleton title="Requests" />}><PendingRequests /></Suspense></div>
        <div className="dashboard-half"><Suspense fallback={<DashboardSkeleton title="Coming up" />}><LearningAgenda /></Suspense></div>
        <div className="dashboard-half"><Suspense fallback={<DashboardSkeleton title="People to learn with" />}><RecommendedMatches /></Suspense></div>
      </div>
    </div>
  );
}
