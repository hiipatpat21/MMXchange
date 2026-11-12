import { createClient } from "@/lib/supabase/server";
import { PaymentUploadForm } from "./payment-forms";
import { PaymentImage } from "./payment-image";
export async function PaymentSetup() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <p role="alert">Sign in to set up payments.</p>;
  const method = await client.from("tutor_payment_methods").select("qr_asset_id, instructions").eq("tutor_id", user.id).maybeSingle();
  if (method.error) return <p role="alert">Could not load payment setup. Apply Prompt 5 SQL, then refresh.</p>;
  return <section className="space-y-4 rounded-xl border bg-card p-4">
    <h3 className="text-lg font-semibold">Receive payments through GCash</h3>
    <p className="text-sm text-muted-foreground">Upload your QR before reserving paid lessons. Learners pay outside MMXchange. Changing it affects future payment requests only.</p>
    {method.data && <PaymentImage client={client} asset={method.data.qr_asset_id} label="Your GCash QR" />}
    <PaymentUploadForm kind="qr" instructions={method.data?.instructions} />
    <p className="text-sm text-muted-foreground">Never share your GCash login, PIN or OTP. MMXchange does not process transfers.</p>
  </section>;
}
