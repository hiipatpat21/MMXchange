"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { forumPostSchema, forumCommentSchema, type ForumState } from "@/lib/forum";

export async function createPost(_previous: ForumState, formData: FormData): Promise<ForumState> {
  const parsed = forumPostSchema.safeParse({ title: formData.get("title"), category: formData.get("category"), body: formData.get("body") });
  if (!parsed.success) return { error: "Choose a category, a title of 5–120 characters, and a post of 10–5,000 characters." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please log in again." };
  const { data, error } = await supabase.from("forum_posts").insert({ ...parsed.data, author_id: user.id }).select("id").single();
  if (error || !data) return { error: "Could not create your post. Please try again." };
  revalidatePath("/forum");
  redirect(`/forum/${data.id}`);
}

export async function addComment(_previous: ForumState, formData: FormData): Promise<ForumState> {
  const parsed = forumCommentSchema.safeParse({ postId: formData.get("postId"), body: formData.get("body") });
  if (!parsed.success) return { error: "Enter a comment of 1–2,000 characters for a valid post." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please log in again." };
  const { error } = await supabase.from("forum_comments").insert({ post_id: parsed.data.postId, author_id: user.id, body: parsed.data.body });
  if (error) return { error: "Could not post your comment. The post may have been removed; please refresh." };
  revalidatePath("/forum");
  revalidatePath(`/forum/${parsed.data.postId}`);
  revalidatePath("/", "layout");
  return { message: "Comment posted. If this discussion has several pages, use Last page to see recent replies." };
}

export async function deleteForumItem(_previous: ForumState, formData: FormData): Promise<ForumState> {
  const parsed = z.object({ id: z.string().uuid(), kind: z.enum(["post", "comment"]) }).safeParse({ id: formData.get("id"), kind: formData.get("kind") });
  if (!parsed.success) return { error: "Invalid post or comment." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please log in again." };
  const { id, kind } = parsed.data;
  // Select the deleted row so an RLS-filtered no-op is never reported as success.
  if (kind === "post") {
    const { data, error } = await supabase.from("forum_posts").delete().eq("id", id).eq("author_id", user.id).select("id").maybeSingle();
    if (error || !data) return { error: "Could not delete this post. Only its author can delete it." };
    revalidatePath("/forum");
    revalidatePath(`/forum/${id}`);
    redirect("/forum");
  }
  const { data, error } = await supabase.from("forum_comments").delete().eq("id", id).eq("author_id", user.id).select("id, post_id").maybeSingle();
  if (error || !data) return { error: "Could not delete this comment. Only its author can delete it." };
  revalidatePath("/forum");
  revalidatePath(`/forum/${data.post_id}`);
  return { message: "Comment deleted." };
}
