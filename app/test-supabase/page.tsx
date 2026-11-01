import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";

async function SkillsList() {
  const supabase = await createClient();
  const { data: skills, error } = await supabase
    .from("skills")
    .select("name, category")
    .order("name");

  if (error) {
    return <pre className="p-6 text-red-600">Error: {error.message}</pre>;
  }

  return (
    <ul className="space-y-1 p-6">
      {skills.map((s) => (
        <li key={s.name}>
          {s.name} <span className="text-muted-foreground">({s.category})</span>
        </li>
      ))}
    </ul>
  );
}

export default function TestSupabasePage() {
  return (
    <Suspense fallback={<p className="p-6">Loading skills...</p>}>
      <SkillsList />
    </Suspense>
  );
}