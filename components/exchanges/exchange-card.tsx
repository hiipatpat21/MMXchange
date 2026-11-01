import Link from "next/link";
import { exchangePerspective, type ExchangeRow } from "@/lib/exchanges";
import { formatDateTime } from "@/lib/datetime";
import { StatusBadge } from "@/components/exchanges/status-badge";

export function ExchangeCard({ exchange, userId }: { exchange: ExchangeRow; userId: string }) {
  const view = exchangePerspective(exchange, userId);
  return (
    <Link href={`/exchanges/${exchange.id}`} className="block min-w-0 space-y-3 rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm focus-visible:outline-2 focus-visible:outline-primary">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="break-words text-lg font-semibold">Exchange with {view.otherName}</h2>
        <StatusBadge status={exchange.status} />
      </div>
      <div className="space-y-1 break-words text-sm"><p>You teach: {view.youTeach}</p><p>They teach: {view.theyTeach}</p></div>
      <p className="text-sm text-muted-foreground">Requested {formatDateTime(exchange.created_at)}</p>
      <span className="text-sm font-medium text-primary">View exchange</span>
    </Link>
  );
}
