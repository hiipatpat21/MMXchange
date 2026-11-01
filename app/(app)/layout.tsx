import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopbarWithUser } from "@/components/layout/topbar-user";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="sticky top-0 z-30 h-18 border-b bg-card" />}>
          <TopbarWithUser />
        </Suspense>
        <main id="main-content" tabIndex={-1} className="app-content mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-7 outline-none sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
