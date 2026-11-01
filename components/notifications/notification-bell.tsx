import Link from "next/link";
import { Bell } from "lucide-react";
import type { NotificationItem } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NotificationOpenForm } from "@/components/notifications/notification-open-form";

export function NotificationBell({ unreadCount, notifications, error }: { unreadCount: number | null; notifications: NotificationItem[]; error: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-10" aria-label={unreadCount === null ? "Notifications, unread count unavailable" : `Notifications, ${unreadCount} unread`}>
          <Bell className="size-5" />
          {unreadCount !== null && unreadCount > 0 && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-gold px-1 text-xs font-semibold text-primary">{unreadCount > 9 ? "9+" : unreadCount}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70dvh] w-80 max-w-[calc(100vw-2rem)] overflow-y-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {error ? <p role="alert" className="p-3 text-sm text-destructive">Could not load notifications. Reload to try again.</p> : notifications.length ? notifications.map((item) => <NotificationOpenForm key={item.id} item={item} inMenu />) : <p className="p-3 text-sm text-muted-foreground">You&apos;re all caught up.</p>}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/notifications" className="min-h-10">View all notifications</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
