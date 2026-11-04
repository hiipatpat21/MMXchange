import { getDashboardContext } from "@/lib/dashboard";

export async function DashboardGreeting() {
  const { supabase, user } = await getDashboardContext();
  const { data, error } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  if (error || !data) return <><h1 className="page-heading">Your learning space</h1><p role="alert" className="text-sm text-destructive">Could not load your greeting. Reload to try again.</p></>;
  return <h1 className="page-heading break-words">Good to see you, {data.display_name.trim().split(/\s+/)[0]}.</h1>;
}
