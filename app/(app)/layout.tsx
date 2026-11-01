import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopbarWithUser } from "@/components/layout/topbar-user";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Suspense fallback={<div className="h-14 border-b bg-card" />}>
          <TopbarWithUser />
        </Suspense>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}