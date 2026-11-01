import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { getUnreadCount, getRecentNotifications, type NotificationItem } from "@/lib/notifications";

export async function TopbarWithUser() {
  const supabase = await createClient();
  const {
    data: { user }, error: authError,
  } = await supabase.auth.getUser();

  let displayName = "Student";
  let profileError = false;
  let unreadCount: number | null = null;
  let notifications: NotificationItem[] = [];
  let notificationsError = !!authError || !user;
  if (user) {
    const [profile, count, recent] = await Promise.allSettled([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      getUnreadCount(supabase),
      getRecentNotifications(5, 0, supabase),
    ]);
    if (profile.status === "fulfilled") displayName = profile.value.data?.display_name ?? "Student";
    profileError = profile.status === "rejected" || !!profile.value.error || !profile.value.data;
    if (count.status === "fulfilled") unreadCount = count.value;
    if (recent.status === "fulfilled") notifications = recent.value;
    notificationsError = count.status === "rejected" || recent.status === "rejected";
  }

  return <Topbar displayName={displayName} profileError={profileError} unreadCount={unreadCount} notifications={notifications} notificationsError={notificationsError} />;
}
