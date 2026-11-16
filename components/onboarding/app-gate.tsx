import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { loadOnboardingStep, onboardingDestination, type OnboardingStep } from "@/lib/onboarding";

export async function AppGate({ children }: { children: React.ReactNode }) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  let step: OnboardingStep;
  try { step = await loadOnboardingStep(client, user.id); }
  catch {
    return <main className="mx-auto max-w-xl space-y-4 p-6"><h1 className="text-2xl font-semibold">Your setup could not load</h1>
      <p role="alert">Please reload and try again.</p>
      <form action={logout}><Button type="submit" variant="outline">Log out</Button></form></main>;
  }
  if (step !== "complete") redirect(onboardingDestination(step));
  return children;
}
