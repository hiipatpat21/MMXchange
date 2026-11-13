"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { feedbackError, reviewSchema, reportSchema, type FeedbackState } from "@/lib/feedback";

export async function submitExchangeReview(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const parsed = reviewSchema.safeParse({ id: formData.get("id"), rating: formData.get("rating"), comment: formData.get("comment") ?? "" });
  if (!parsed.success) return { error: "Choose a rating from 1 to 5 and keep your comment within 500 characters." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please log in again." };
  const { data, error } = await supabase.rpc("submit_exchange_review", { p_exchange_id: parsed.data.id, p_rating: parsed.data.rating, p_comment: parsed.data.comment });
  if (error || data !== "ok") return { error: feedbackError(error ? null : data) };
  revalidatePath(`/exchanges/${parsed.data.id}`);
  revalidatePath("/students/[id]", "page");
  revalidatePath("/", "layout");
  return { message: "Thanks for your feedback" };
}

export async function submitReport(_previous: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const parsed = reportSchema.safeParse({ targetType: formData.get("targetType"), targetId: formData.get("targetId"), reason: formData.get("reason") });
  if (!parsed.success) return { error: "Enter a reason of 5–500 characters for a valid item." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Please log in again." };
  const { targetType, targetId, reason } = parsed.data;
  const table = targetType === "exchange_review" ? "exchange_reviews" : targetType === "forum_post" ? "forum_posts" : "forum_comments";
  const request = supabase.from(table).select("id").eq("id", targetId).maybeSingle();
  const { data: target, error: targetError } = await request;
  if (targetError || !target) return { error: "Could not find this item. Please refresh and try again." };
  const { error } = await supabase.from("reports").insert({ reporter_id: user.id, target_type: targetType, target_id: targetId, reason });
  if (error) return { error: "Could not submit the report. Please try again." };
  return { message: "Report submitted. Thank you for letting us know." };
}
