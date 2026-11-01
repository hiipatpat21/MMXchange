
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-section";
import { DashboardGreeting } from "@/components/dashboard/greeting";
import { ProfileChecklist } from "@/components/dashboard/profile-checklist";
import { RecommendedMatches } from "@/components/dashboard/recommended-matches";
import { PendingRequests } from "@/components/dashboard/pending-requests";
import { UpcomingExchanges } from "@/components/dashboard/upcoming-exchanges";
import { UpcomingGroups } from "@/components/dashboard/upcoming-groups";
import { RegisteredSessions } from "@/components/dashboard/registered-sessions";
import { HostedSessions } from "@/components/dashboard/hosted-sessions";
import { DashboardNotifications } from "@/components/dashboard/notifications";
import { YourSkills } from "@/components/dashboard/your-skills";
import { SuggestedNextStep } from "@/components/dashboard/suggested-next-step";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="page-heading">Dashboard</h1>
        <Suspense fallback={<div role="status" aria-label="Loading greeting" className="h-5 w-2/3 animate-pulse rounded bg-muted" />}><DashboardGreeting /></Suspense>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Suspense fallback={<DashboardSkeleton title="Complete your profile" />}><ProfileChecklist /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="Suggested next step" />}><SuggestedNextStep /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="Pending requests" />}><PendingRequests /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="Upcoming one-on-one sessions" />}><UpcomingExchanges /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="My registered sessions" />}><RegisteredSessions /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="Sessions you're hosting" />}><HostedSessions /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="Recommended matches" />}><RecommendedMatches /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="Upcoming group sessions" />}><UpcomingGroups /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="Notifications" />}><DashboardNotifications /></Suspense>
        <Suspense fallback={<DashboardSkeleton title="Your skills" />}><YourSkills /></Suspense>
      </div>
    </div>
  );
}
