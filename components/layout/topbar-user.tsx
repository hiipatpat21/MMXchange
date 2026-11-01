import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";

export async function TopbarWithUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "Student";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name ?? "Student";
  }

  return <Topbar displayName={displayName} />;
}