import { LoadingState } from "@/components/ui/loading-state";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SessionForm } from "@/components/sessions/session-form";

async function FormLoader() {
  const supabase = await createClient();
  const { data: skills, error } = await supabase.from("skills").select("id, name").order("name");
  if (error) return <p role="alert" className="text-destructive">Could not load skill options. Please reload to try again.</p>;
  return <SessionForm skills={skills ?? []} />;
}

export default function NewSessionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="page-heading">Host a session</h1>
        <p className="mt-1 text-muted-foreground">
          Share what you know with other students. Attendees join as learners, so no swap is needed.
        </p>
      </div>
      <Suspense fallback={<LoadingState label="Loading..." variant="form" />}>
        <FormLoader />
      </Suspense>
    </div>
  );
}
