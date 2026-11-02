"use client";

import { useEffect, useState } from "react";
import { markThreadRead } from "@/app/(app)/messages/actions";
import { Button } from "@/components/ui/button";

// Writes happen after opening the page, never during a Server Component render.
export function MarkThreadRead({ id, through }: { id: string; through: string }) {
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    markThreadRead(id, through).then(result => { if (active) setError(!!result?.error); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, through]);
  if (!error) return null;
  return <div role="alert" className="text-sm text-destructive">Could not mark this conversation read. <Button variant="outline" onClick={async () => {
    try { const result = await markThreadRead(id, through); setError(!!result?.error); }
    catch { setError(true); }
  }}>Try again</Button></div>;
}
