import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { ratingSummaryText, reviewDisclaimer, type RatingSummary } from "@/lib/feedback";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { ReviewItem } from "@/components/feedback/review-item";

export async function SessionFeedback({ sessionId, userId, eligible }: { sessionId: string; userId: string; eligible: boolean }) {
  const supabase = await createClient();
  const [summary, reviews, mine] = await Promise.all([
    supabase.rpc("get_session_feedback_summary", { p_session_id: sessionId }),
    supabase.from("group_session_feedback").select("profile_id, rating, helpful, comment, created_at, reviewer:profiles!profile_id(display_name)").eq("session_id", sessionId).order("created_at", { ascending: false }).order("profile_id", { ascending: false }).limit(5),
    eligible ? supabase.from("group_session_feedback").select("session_id").eq("session_id", sessionId).eq("profile_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  return <section className="space-y-4 surface-card p-5"><h2 className="text-lg font-semibold">Session feedback</h2><p className="text-xs text-muted-foreground">{reviewDisclaimer}</p>
    {summary.error ? <p role="alert" className="text-sm text-destructive">Could not load the rating summary. Please reload.</p> : <p className="font-medium">{ratingSummaryText((summary.data as RatingSummary[] | null)?.[0])}</p>}
    {eligible && (mine.error ? <p role="alert" className="text-sm text-destructive">Could not check your feedback status. Please reload before submitting.</p> : mine.data ? <p role="status" className="text-sm text-primary">Thanks for your feedback</p> : <FeedbackForm id={sessionId} session />)}
    {reviews.error ? <p role="alert" className="text-sm text-destructive">Could not load feedback. Please reload. On a new setup, run the prompt 9 SQL first.</p> : reviews.data?.length ? <><p className="text-xs text-muted-foreground">Latest five reviews</p><ul className="divide-y">{reviews.data.map(row => <ReviewItem key={row.profile_id} name={pickOne<{ display_name: string }>(row.reviewer)?.display_name ?? "Student"} rating={row.rating} helpful={row.helpful} comment={row.comment} createdAt={row.created_at} targetType="session_feedback" targetId={`${sessionId}:${row.profile_id}`} />)}</ul></> : <p className="text-sm text-muted-foreground">No reviews yet. Registered students can share feedback after completion.</p>}
  </section>;
}
