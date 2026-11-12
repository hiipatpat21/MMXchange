"use client";
import { Button } from "@/components/ui/button";
export default function SetupError({ reset }: { reset: () => void }) {
  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Setup could not load</h1><p role="alert">Please try again. If this is a new deployment, the project owner needs to apply the Teacher Prompt 2 SQL.</p><Button onClick={reset}>Try again</Button></div>;
}
