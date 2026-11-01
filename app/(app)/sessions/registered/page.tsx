import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { SessionTabs } from "@/components/sessions/session-tabs";
import { MySessionList } from "@/components/sessions/my-session-list";

export default function RegisteredSessionsPage() {
  return <div className="space-y-6"><header><h1 className="page-heading">My registrations</h1><p className="mt-1 text-muted-foreground">Group sessions you have joined as a learner.</p></header><SessionTabs active="registered" /><Suspense fallback={<LoadingState label="Loading your registrations..." />}><MySessionList mode="registered" /></Suspense></div>;
}
