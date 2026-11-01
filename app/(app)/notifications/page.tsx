import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRecentNotifications, getUnreadCount } from "@/lib/notifications";
import { NotificationOpenForm } from "@/components/notifications/notification-open-form";
import { MarkAllReadForm } from "@/components/notifications/mark-all-read-form";
import { Button } from "@/components/ui/button";

async function NotificationList({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = z.coerce.number().int().min(1).max(10000).safeParse(params.page ?? 1);
  const page = parsed.success ? parsed.data : 1;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  let result: [Awaited<ReturnType<typeof getRecentNotifications>>, number];
  try { result = await Promise.all([getRecentNotifications(31, (page - 1) * 30, supabase), getUnreadCount(supabase)]); }
  catch { return <p role="alert" className="text-destructive">Could not load notifications. Please reload to try again. On a new setup, run the prompt 5 SQL first.</p>; }
  const [items, unread] = result;
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{unread} unread {unread === 1 ? "notification" : "notifications"}</p>
      {unread > 0 && <MarkAllReadForm />}
      {items.length ? <ul className="divide-y overflow-hidden rounded-xl border bg-card">{items.slice(0, 30).map((item) => <li key={item.id}><NotificationOpenForm item={item} /></li>)}</ul> : <div className="space-y-3 rounded-xl border border-dashed p-6"><p className="font-medium">{page === 1 ? "You're all caught up" : "No more notifications"}</p><p className="text-sm text-muted-foreground">New exchange requests and session updates will appear here.</p><Button asChild variant="outline" className="min-h-10"><Link href={page === 1 ? "/discover" : "/notifications"}>{page === 1 ? "Discover students" : "Back to first page"}</Link></Button></div>}
      <nav aria-label="Notification pages" className="flex flex-wrap gap-2">
        {page > 1 && <Button asChild variant="outline" className="min-h-10"><Link href={`/notifications?page=${page - 1}`}>Previous</Link></Button>}
        {items.length > 30 && <Button asChild variant="outline" className="min-h-10"><Link href={`/notifications?page=${page + 1}`}>Next</Link></Button>}
      </nav>
    </div>
  );
}

export default function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <div className="mx-auto max-w-3xl space-y-6"><header><h1 className="text-2xl font-semibold">Notifications</h1><p className="mt-1 text-muted-foreground">Your exchange requests and group-session updates.</p></header><Suspense fallback={<p role="status">Loading notifications...</p>}><NotificationList searchParams={searchParams} /></Suspense></div>;
}
