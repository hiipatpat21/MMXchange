import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/relations";
import { OfferForm } from "@/components/lessons/offer-form";
import { PaymentSetup } from "@/components/lessons/payment-setup";
export async function OfferSettings() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const [skills, offers] = await Promise.all([
    client.from("profile_skills").select("skill_id, skills(name)").eq("profile_id", user.id).eq("kind", "teach"),
    client.from("paid_lesson_offers").select("skill_id, price_centavos, enabled, skills(name)").eq("tutor_id", user.id),
  ]);
  if (skills.error || offers.error) return <p role="alert">Could not load paid offerings. Apply Teacher Prompt 3 SQL on a new deployment, then reload.</p>;
  const ids = [...new Set([...(skills.data ?? []).map(row => row.skill_id), ...(offers.data ?? []).map(row => row.skill_id)])];
  return <details className="disclosure"><summary>Paid teaching offers (optional)</summary><div className="space-y-4 pb-4">
    <p className="text-sm text-muted-foreground">Set a fixed fee from PHP 0.01 to 10,000.00 per one-hour lesson. Add your GCash QR before reserving a lesson. You can withdraw an offering; accepted fees stay unchanged.</p>
    <PaymentSetup />
    {ids.length ? ids.map(id => { const skill = skills.data?.find(row => row.skill_id === id); const offer = offers.data?.find(row => row.skill_id === id); return <OfferForm key={id} skill={id} name={pickOne<{ name: string }>(skill?.skills ?? offer?.skills)?.name ?? "Skill"} price={offer?.price_centavos} enabled={offer?.enabled} teaching={!!skill} />; }) : <p>Add a skill you can teach above to offer paid lessons. Learners can leave skills empty.</p>}
  </div></details>;
}
