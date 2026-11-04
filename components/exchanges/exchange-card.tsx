import Link from "next/link";
import { exchangePerspective, type ExchangeRow } from "@/lib/exchanges";
import { formatDateTime } from "@/lib/datetime";
import { StatusBadge } from "@/components/exchanges/status-badge";

export function ExchangeCard({ exchange, userId }: { exchange: ExchangeRow; userId: string }) {
  const view = exchangePerspective(exchange, userId);
  return (
    <Link href={`/exchanges/${exchange.id}`} className="block min-w-0 space-y-3 surface-card p-5 transition-colors hover:border-primary/25 focus-visible:outline-2 focus-visible:outline-primary">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="break-words text-lg font-semibold">{view.otherName}</h2>
        <StatusBadge status={exchange.status} />
      </div>
      <div className="grid gap-3 rounded-xl bg-secondary/50 p-3 text-sm sm:grid-cols-2"><p className="break-words"><span className="mb-1 block text-xs text-muted-foreground">You share</span>{view.youTeach}</p><p className="break-words"><span className="mb-1 block text-xs text-muted-foreground">You learn</span>{view.theyTeach}</p></div>
      <p className="text-sm text-muted-foreground">Requested {formatDateTime(exchange.created_at)}</p>
      <span className="text-sm font-medium text-primary">Continue exchange →</span>
    </Link>
  );
}
