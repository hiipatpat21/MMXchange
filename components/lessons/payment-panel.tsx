import Link from "next/link";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { formatPhp } from "@/lib/paid-lessons";
import { formatDateTime } from "@/lib/datetime";
import { paymentLabels, loadLessonPaymentDetails } from "@/lib/lesson-payments";
import { PaymentDecision, PaymentUploadForm } from "./payment-forms";
import { PaymentImage } from "./payment-image";

export async function PaymentPanel({ id, page: rawPage }: { id: string; page?: string }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <p role="alert">Sign in to view this payment.</p>;
  const page = z.coerce.number().int().min(1).max(10000).catch(1).parse(rawPage ?? 1);
  const { request, payment, booking, history, now } = await loadLessonPaymentDetails(client, id, page);
  if ([request, payment, booking, history].some(result => result.error)) return <p role="alert">Could not load payment details. Refresh to try again.</p>;
  const r = request.data, p = payment.data, b = booking.data;
  if (!r || ![r.learner_id, r.tutor_id].includes(user.id) || !p) return null;
  const tutor = r.tutor_id === user.id;
  const open = r.status === "accepted" && b?.status === "reserved" && Date.parse(b.starts_at) > now;
  const rows = history.data?.slice(0, 5) ?? [];
  const instructions = p.qr_asset_id ? <div className="space-y-3"><PaymentImage client={client} asset={p.qr_asset_id} label="Agreed GCash QR" />{p.instructions_snapshot && <p className="whitespace-pre-wrap break-words">{p.instructions_snapshot}</p>}<p className="text-sm text-muted-foreground">Payment details are fixed for this lesson.</p></div> : open ? <PaymentDecision id={id} command="prepare" /> : <p className="text-sm">{p.status === "confirmed" ? "This older payment has no saved QR. Contact your tutor if you need its payment details." : "Reserve a shared hour before paying."}</p>;
  return <section id="payment" className="space-y-5 rounded-xl border bg-card p-5">
    <div className="space-y-1"><h2 className="text-xl font-semibold">Lesson payment</h2><p className="font-semibold text-primary">{formatPhp(p.amount_centavos)} · {paymentLabels[p.status] ?? "Not requested"}</p>{b && <p className="text-sm">{formatDateTime(b.starts_at)} (Philippine time)</p>}</div>
    <p className="text-sm text-muted-foreground">{tutor ? "Check your GCash balance before confirming payment." : "Pay in GCash, then upload your receipt. Never share your PIN or OTP."}</p>
    {b?.status === "reserved" && <p className="text-sm">Time reserved. Waiting for tutor payment confirmation.</p>}
    {p.qr_asset_id && (tutor || p.status === "confirmed" || r.status !== "accepted") ? <details className="disclosure"><summary>Agreed payment instructions</summary>{instructions}</details> : instructions}
    {open && !tutor && ["awaiting_receipt", "rejected"].includes(p.status) && <PaymentUploadForm kind="receipt" id={id} />}
    <details className="disclosure" open={p.status === "submitted" || p.status === "rejected"}><summary>Receipt and decision history</summary><div className="space-y-5 pb-3">
      {rows.length ? rows.map(row => <article key={row.id} className="space-y-2 border-b pb-4 last:border-0"><p className="font-medium">{row.status === "submitted" ? "Submitted · Awaiting tutor confirmation" : row.status === "rejected" ? "Rejected by tutor" : "Payment received by tutor"}</p><p className="text-sm text-muted-foreground">Submitted {formatDateTime(row.created_at)}{row.reviewed_at && ` · Reviewed ${formatDateTime(row.reviewed_at)}`}</p><PaymentImage client={client} asset={row.asset_id} label="Submitted receipt" />{row.rejection_reason && <p className="whitespace-pre-wrap break-words">Tutor’s reason: {row.rejection_reason}</p>}</article>) : <p>No receipts on this page. {page === 1 ? "The learner can upload one after reserving a time." : "Return to the previous page."}</p>}
      <nav aria-label="Receipt history pages" className="flex flex-wrap gap-4">{page > 1 && <Link className="text-primary underline" href={`/lessons/${id}?receiptsPage=${page - 1}#payment`}>Newer receipts</Link>}{(history.data?.length ?? 0) > 5 && <Link className="text-primary underline" href={`/lessons/${id}?receiptsPage=${page + 1}#payment`}>Older receipts</Link>}</nav>
    </div></details>
    {open && tutor && p.status === "submitted" && p.latest_receipt_id && <div className="space-y-4"><PaymentDecision id={id} receipt={p.latest_receipt_id} command="confirm" /><details className="disclosure"><summary>Reject this receipt</summary><PaymentDecision id={id} receipt={p.latest_receipt_id} command="reject" /></details></div>}
    <p className="text-sm text-muted-foreground">Arrange refunds directly with your partner. MMXchange does not issue refunds.</p>
  </section>;
}
