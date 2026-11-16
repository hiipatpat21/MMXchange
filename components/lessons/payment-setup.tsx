import { createClient } from "@/lib/supabase/server";
import { PaymentUploadForm } from "./payment-forms";
import { PaymentImage } from "./payment-image";
export async function PaymentSetup() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <p role="alert">Sign in to set up payments.</p>;
  const method = await client.from("tutor_payment_methods").select("qr_asset_id, instructions").eq("tutor_id", user.id).maybeSingle();
  if (method.error) return <p role="alert">Could not load payment settings. Please reload.</p>;
  return <section className="space-y-4 rounded-xl border bg-card p-4">
    <h3 className="text-lg font-semibold">Receive payments through GCash</h3>

    {method.data && <PaymentImage client={client} asset={method.data.qr_asset_id} label="Your GCash QR" />}
    <PaymentUploadForm kind="qr" instructions={method.data?.instructions} />
    <p className="text-sm text-muted-foreground">Payments happen in GCash. Never share your PIN or OTP.</p>
  </section>;
}
