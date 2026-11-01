import { getDashboardContext } from "@/lib/dashboard";
import { getRecentNotifications, getUnreadCount } from "@/lib/notifications";
import { NotificationOpenForm } from "@/components/notifications/notification-open-form";
import { DashboardSection, DashboardEmpty, DashboardError } from "@/components/dashboard/dashboard-section";

export async function DashboardNotifications() {
  const { supabase } = await getDashboardContext();
  let result: [number, Awaited<ReturnType<typeof getRecentNotifications>>];
  try { result = await Promise.all([getUnreadCount(supabase), getRecentNotifications(3, 0, supabase, { unreadOnly: true })]); }
  catch { return <DashboardError title="Notifications" />; }
  const [unread, items] = result;
  return (
    <DashboardSection title="Notifications" href="/notifications" actionLabel="View all">
      <p className="text-sm text-muted-foreground">{unread} unread {unread === 1 ? "notification" : "notifications"}</p>
      {!items.length ? <DashboardEmpty message="You're all caught up. Your notification history is available whenever you need it." href="/notifications" label="View notification history" /> : <>
        <ul className="space-y-2">{items.map((item) => <li key={item.id}><NotificationOpenForm item={item} /></li>)}</ul>
      </>}
    </DashboardSection>
  );
}
