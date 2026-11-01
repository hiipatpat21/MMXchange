"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { notificationDestination } from "@/lib/notifications";

export type NotificationActionState = { error?: string; message?: string } | null;

export async function markReadAndGo(_previous: NotificationActionState, formData: FormData): Promise<NotificationActionState> {
  const id = z.string().uuid().safeParse(formData.get("notificationId"));
  if (!id.success) return { error: "Choose a valid notification." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in to open notifications." };
  const { data: item, error: readError } = await supabase.from("notifications")
    .select("id, link, read_at").eq("id", id.data).eq("recipient_id", user.id).maybeSingle();
  if (readError) return { error: "Could not load this notification. Please try again." };
  if (!item) return { error: "This notification could not be found." };
  if (!item.read_at) {
    const { error } = await supabase.from("notifications")
      .update({ read_at: new Date().toISOString() }).eq("id", id.data).eq("recipient_id", user.id)
      .is("read_at", null).select("id");
    // Another tab may have marked it read between our select and update.
    if (error) return { error: "Could not mark this notification as read. Please try again." };
  }
  revalidatePath("/", "layout");
  redirect(notificationDestination(item.link));
}

export async function markAllAsRead(_previous: NotificationActionState, formData: FormData): Promise<NotificationActionState> {
  const parsed = z.object({ action: z.literal("mark_all") }).safeParse({ action: formData.get("action") });
  if (!parsed.success) return { error: "Choose a valid notification action." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please sign in to manage notifications." };
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id).is("read_at", null);
  if (error) return { error: "Could not mark notifications as read. Please try again." };
  revalidatePath("/", "layout");
  return { message: "All notifications marked as read." };
}
