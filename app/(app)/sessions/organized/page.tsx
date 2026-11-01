import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { SessionTabs } from "@/components/sessions/session-tabs";
import { MySessionList } from "@/components/sessions/my-session-list";

export default function OrganizedSessionsPage() {
  return <div className="space-y-6"><header><h1 className="page-heading">My sessions</h1><p className="mt-1 text-muted-foreground">Manage the group sessions you host.</p></header><SessionTabs active="organized" /><Suspense fallback={<LoadingState label="Loading your sessions..." />}><MySessionList mode="organized" /></Suspense></div>;
}
