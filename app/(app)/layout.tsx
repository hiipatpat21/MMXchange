import { AppGate } from "@/components/onboarding/app-gate";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopbarWithUser } from "@/components/layout/topbar-user";
import { ReminderLoader } from "@/components/meetings/reminder-loader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-6">Loading your learning space...</p>}><AppGate>
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-16 shrink-0 bg-background" />}>
          <TopbarWithUser />
        </Suspense>
        <main id="main-content" tabIndex={-1} className="app-content mx-auto w-full max-w-[1164px] min-w-0 flex-1 px-4 pb-12 pt-4 outline-none sm:px-6 lg:px-8 lg:pt-6"><Suspense fallback={null}><ReminderLoader /></Suspense>{children}</main>
      </div>
    </div>
    </AppGate></Suspense>
  );
}
