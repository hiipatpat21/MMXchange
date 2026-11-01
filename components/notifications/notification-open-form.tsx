"use client";

import { useActionState } from "react";
import { markReadAndGo } from "@/app/(app)/notifications/actions";
import type { NotificationItem } from "@/lib/notifications";
import { formatDateTime } from "@/lib/datetime";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function NotificationOpenForm({ item, inMenu = false }: { item: NotificationItem; inMenu?: boolean }) {
  const [state, action, pending] = useActionState(markReadAndGo, null);
  const button = (
    <button type="submit" disabled={pending} className={`block min-h-11 w-full rounded-lg p-3 text-left focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 ${item.read_at ? "hover:bg-muted" : "bg-primary/5 hover:bg-primary/10"}`}>
      <span className="flex items-start gap-2">
        {!item.read_at && <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
        <span className="min-w-0 space-y-1">
          <span className={`block break-words text-sm ${item.read_at ? "font-medium" : "font-semibold"}`}>{!item.read_at && <span className="sr-only">Unread: </span>}{item.title}</span>
          {item.body && <span className={`block whitespace-pre-line break-words text-sm text-muted-foreground ${inMenu ? "line-clamp-2" : ""}`}>{item.body}</span>}
          <span className="block text-xs text-muted-foreground">{formatDateTime(item.created_at)}</span>
          {pending && <span role="status" className="block text-xs">Opening...</span>}
        </span>
      </span>
    </button>
  );
  return (
    <form action={action} className="min-w-0">
      <input type="hidden" name="notificationId" value={item.id} />
      {inMenu ? <DropdownMenuItem asChild onSelect={(event) => event.preventDefault()}>{button}</DropdownMenuItem> : button}
      {state?.error && <p role="alert" className="px-3 py-2 text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
