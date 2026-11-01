import type { ExchangeStatus } from "@/lib/exchanges";
import { Badge } from "@/components/ui/badge";

const styles: Record<ExchangeStatus, string> = {
  pending: "bg-brand-gold text-primary",
  accepted: "bg-primary/10 text-primary",
  scheduled: "bg-primary text-primary-foreground",
  completed: "border-primary bg-background text-primary",
  declined: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: ExchangeStatus }) {
  return <Badge variant="outline" className={styles[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}
