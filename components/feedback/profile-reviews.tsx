import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { ratingSummaryText, reviewDisclaimer, type RatingSummary } from "@/lib/feedback";
import { ReviewItem } from "@/components/feedback/review-item";

export async function ProfileReviews({ profileId }: { profileId: string }) {
  const supabase = await createClient();
  const [summary, reviews] = await Promise.all([
    supabase.rpc("get_rating_summary", { p_profile_id: profileId }),
    supabase.from("exchange_reviews").select("id, rating, comment, created_at, reviewer:profiles!reviewer_id(display_name)").eq("reviewee_id", profileId).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(5),
  ]);
  return <section className="space-y-3 surface-card p-5"><h2 className="text-lg font-semibold">Exchange reviews</h2><p className="text-xs text-muted-foreground">{reviewDisclaimer}</p>
    {summary.error ? <p role="alert" className="text-sm text-destructive">Could not load the rating summary. Please reload.</p> : <p className="font-medium">{ratingSummaryText((summary.data as RatingSummary[] | null)?.[0])}</p>}
    {reviews.error ? <p role="alert" className="text-sm text-destructive">Could not load reviews. Please reload. On a new setup, run the prompt 9 SQL first.</p> : reviews.data?.length ? <><p className="text-xs text-muted-foreground">Latest five reviews</p><ul className="divide-y">{reviews.data.map(row => <ReviewItem key={row.id} name={pickOne<{ display_name: string }>(row.reviewer)?.display_name ?? "Student"} rating={row.rating} comment={row.comment} createdAt={row.created_at} targetType="exchange_review" targetId={row.id} />)}</ul></> : <p className="text-sm text-muted-foreground">No student experiences shared yet. <Link href="/discover" className="text-primary underline">Find an exchange partner</Link></p>}
  </section>;
}
