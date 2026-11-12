import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { loadLearningOptions, PAID_BOOKING_READY } from "@/lib/paid-lessons";
import { PaidRequestForm } from "@/components/lessons/request-form";
import { LoadingState } from "@/components/ui/loading-state";
async function RequestLoader({ searchParams }: { searchParams: Promise<{ offer?: string }> }) {
  const id = z.string().uuid().safeParse((await searchParams).offer);
  if (!id.success) return <p>Choose an offering from a tutor&apos;s profile first.</p>;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  if (!PAID_BOOKING_READY) return <p>Paid lesson requests open after scheduling and payment setup is complete. No payment is due.</p>;
  const { data: offer, error } = await client.from("paid_lesson_offers").select("id, tutor_id, price_centavos").eq("id", id.data).maybeSingle();
  if (error) return <p role="alert">Could not load this offering. Reload to try again.</p>;
  if (!offer || offer.tutor_id === user.id) return <p>This offering is unavailable. Choose another tutor.</p>;
  const options = (await loadLearningOptions(client, user.id, [offer.tutor_id])).get(offer.tutor_id);
  if (!options?.ready || !options.offers.some(row => row.id === offer.id)) return <p>This offering is unavailable. Refresh the tutor&apos;s profile.</p>;
  if (options.mutual) return <p>Your skills match both ways. <Link className="text-primary underline" href={`/exchanges/new?to=${offer.tutor_id}`}>Request a free skill swap</Link>.</p>;
  return <PaidRequestForm offer={offer.id} price={offer.price_centavos} />;
}
export default function NewLessonPage({ searchParams }: { searchParams: Promise<{ offer?: string }> }) {
  return <div className="mx-auto max-w-2xl space-y-6"><h1 className="page-heading">Request a paid lesson</h1><Suspense fallback={<LoadingState label="Loading lesson offering..." />}><RequestLoader searchParams={searchParams} /></Suspense><Link className="inline-flex min-h-11 items-center text-primary underline" href="/discover?view=browse">Back to tutors</Link></div>;
}
