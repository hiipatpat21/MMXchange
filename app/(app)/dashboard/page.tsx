import { Suspense } from "react";
import { HomeOverview } from "@/components/dashboard/home-overview";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-section";
import { RefreshButton } from "@/components/messages/refresh-button";
export default function DashboardPage() {
  return <div className="mx-auto max-w-3xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div className="space-y-2"><h1 className="page-heading">Home</h1><p className="text-muted-foreground">Your next meeting and what needs you.</p></div><RefreshButton /></header>
    <Suspense fallback={<><DashboardSkeleton title="Your next meeting" /><DashboardSkeleton title="Needs your attention" /></>}><HomeOverview /></Suspense>
  </div>;
}
