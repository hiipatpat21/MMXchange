import { getDashboardContext } from "@/lib/dashboard";

export async function DashboardGreeting() {
  const { supabase, user } = await getDashboardContext();
  const { data, error } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  if (error || !data) return <p role="alert" className="text-sm text-destructive">Could not load your greeting. Reload to try again.</p>;
  return <p className="break-words text-muted-foreground">Welcome, {data.display_name}. Find your next learning activity below.</p>;
}
