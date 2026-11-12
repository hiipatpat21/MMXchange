import { paymentImageUrl } from "@/lib/payment-images";
import type { SupabaseClient } from "@supabase/supabase-js";
export async function PaymentImage({ client, asset, label }: { client: SupabaseClient; asset: string; label: string }) {
  const url = await paymentImageUrl(client, asset);
  if (!url) return <p role="alert" className="text-sm text-destructive">Could not load this private image. Refresh to try again.</p>;
  return <a href={url} target="_blank" rel="noreferrer" className="block w-fit max-w-full space-y-2 text-sm text-primary underline">
    {/* Private signed images bypass the public Next.js image optimization cache. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt={label} referrerPolicy="no-referrer" className="max-h-72 w-auto max-w-full rounded-lg border bg-white object-contain" />
    <span>Open {label.toLowerCase()} in a new tab</span>
  </a>;
}
