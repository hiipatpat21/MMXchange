import { Suspense } from "react";
import { SessionTabs } from "@/components/sessions/session-tabs";
import { MySessionList } from "@/components/sessions/my-session-list";

export default function RegisteredSessionsPage() {
  return <div className="space-y-6"><header><h1 className="text-2xl font-semibold">My registrations</h1><p className="mt-1 text-muted-foreground">Group sessions you have joined as a learner.</p></header><SessionTabs active="registered" /><Suspense fallback={<p role="status">Loading your registrations...</p>}><MySessionList mode="registered" /></Suspense></div>;
}
