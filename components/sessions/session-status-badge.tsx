import type { SessionDisplayStatus } from "@/lib/group-sessions";
import { Badge } from "@/components/ui/badge";

export function SessionStatusBadge({ status }: { status: SessionDisplayStatus }) {
  return <Badge variant={status === "Cancelled" ? "destructive" : "outline"} className={`h-auto max-w-full whitespace-normal py-1 ${status === "Open for registration" || status === "Completed" ? "border-transparent bg-primary/10 text-primary" : ""}`}>{status}</Badge>;
}
