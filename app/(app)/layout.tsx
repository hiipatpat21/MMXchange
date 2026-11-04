import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopbarWithUser } from "@/components/layout/topbar-user";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-16 shrink-0 bg-background" />}>
          <TopbarWithUser />
        </Suspense>
        <main id="main-content" tabIndex={-1} className="app-content mx-auto w-full max-w-[1164px] min-w-0 flex-1 px-4 pb-12 pt-4 outline-none sm:px-6 lg:px-8 lg:pt-6">{children}</main>
      </div>
    </div>
  );
}
