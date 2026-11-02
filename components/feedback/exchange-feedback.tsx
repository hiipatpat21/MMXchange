import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { reviewDisclaimer } from "@/lib/feedback";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { ReviewItem } from "@/components/feedback/review-item";

export async function ExchangeFeedback({ exchangeId, submitted }: { exchangeId: string; submitted: boolean | null }) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exchange_reviews").select("id, rating, comment, created_at, reviewer:profiles!reviewer_id(display_name)").eq("exchange_id", exchangeId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(2);
  return <section className="space-y-4 surface-card p-5"><h2 className="text-lg font-semibold">Exchange feedback</h2><p className="text-xs text-muted-foreground">{reviewDisclaimer}</p>
    {submitted === null ? <p role="alert" className="text-sm text-destructive">Could not check your feedback status. Please reload before submitting.</p> : submitted ? <p role="status" className="text-sm text-primary">Thanks for your feedback</p> : <FeedbackForm id={exchangeId} />}
    {error ? <p role="alert" className="text-sm text-destructive">Could not load reviews. Please reload.</p> : data?.length ? <ul className="divide-y">{data.map(row => <ReviewItem key={row.id} name={pickOne<{ display_name: string }>(row.reviewer)?.display_name ?? "Student"} rating={row.rating} comment={row.comment} createdAt={row.created_at} targetType="exchange_review" targetId={row.id} />)}</ul> : <p className="text-sm text-muted-foreground">No reviews yet. Share your experience using the form above.</p>}
  </section>;
}
