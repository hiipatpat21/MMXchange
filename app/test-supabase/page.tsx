import { LoadingState } from "@/components/ui/loading-state";
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
    <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-3xl space-y-6 px-5 py-10 outline-none">
      <h1 className="page-heading">Connection check</h1>
      <Suspense fallback={<LoadingState label="Loading skills..." />}>
        <SkillsList />
      </Suspense>
    </main>
  );
}
