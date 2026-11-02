import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function getUnreadCount(client?: SupabaseClient): Promise<number> {
  const supabase = client ?? await createClient();
  const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  if (error) throw new Error("Could not load unread notifications.");
  return count ?? 0;
}

export async function getRecentNotifications(limit = 5, offset = 0, client?: SupabaseClient, options?: { unreadOnly?: boolean }): Promise<NotificationItem[]> {
  const supabase = client ?? await createClient();
  let query = supabase.from("notifications").select("id, type, title, body, link, read_at, created_at");
  if (options?.unreadOnly) query = query.is("read_at", null);
  const { data, error } = await query
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw new Error("Could not load notifications.");
  return data as NotificationItem[];
}

// Allow only implemented, local UUID detail routes; never follow arbitrary URLs.
export function notificationDestination(link: string | null): string {
  return link && /^\/(exchanges|sessions|messages|forum)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(link) ? link : "/notifications";
}
