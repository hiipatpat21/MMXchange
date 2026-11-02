"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { MessageState } from "@/lib/messages";

async function post(formData: FormData, announcement: boolean): Promise<MessageState> {
  const parsed = z.object({ id: z.string().uuid(), body: z.string().trim().min(1).max(announcement ? 1000 : 2000) })
    .safeParse({ id: formData.get("id"), body: formData.get("body") });
  if (!parsed.success) return { error: `Enter a message of 1–${announcement ? 1000 : 2000} characters.` };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please log in again." };
  const { id, body } = parsed.data;
  const { error } = await supabase.from(announcement ? "session_announcements" : "exchange_messages").insert(
    announcement ? { session_id: id, author_id: user.id, body } : { exchange_id: id, sender_id: user.id, body },
  );
  if (error) return { error: announcement ? "Could not post. Only the organizer of a published session can announce updates." : "Could not send. Messaging requires an exchange you participate in that is not declined or cancelled." };
  revalidatePath(announcement ? `/sessions/${id}` : `/messages/${id}`);
  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return { message: announcement ? "Announcement posted." : "Message sent." };
}

export async function sendMessage(_previous: MessageState, formData: FormData): Promise<MessageState> { return post(formData, false); }
export async function postAnnouncement(_previous: MessageState, formData: FormData): Promise<MessageState> { return post(formData, true); }

export async function markThreadRead(id: string, through: string): Promise<MessageState> {
  const parsed = z.object({ id: z.string().uuid(), through: z.iso.datetime({ offset: true }) }).safeParse({ id, through });
  if (!parsed.success) return { error: "Invalid conversation." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };
  const { data, error } = await supabase.rpc("mark_exchange_read", { p_exchange_id: id, p_through: through });
  if (error || data !== "ok") return { error: "Could not mark conversation read." };
  revalidatePath("/messages");
  revalidatePath("/", "layout");
  return null;
}
