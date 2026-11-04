import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { StudentAvatar } from "@/components/students/student-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/layout/logo";
import { NavLinks } from "@/components/layout/nav-links";
import { LogoutMenuItem } from "@/components/layout/logout-menu-item";
import type { NotificationItem } from "@/lib/notifications";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Topbar({ displayName, avatarUrl, profileError, unreadCount, notifications, notificationsError }: { displayName: string; avatarUrl: string | null; profileError: boolean; unreadCount: number | null; notifications: NotificationItem[]; notificationsError: boolean }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 bg-background px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 max-w-[85vw] p-5">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="mt-6 flex flex-col gap-6">
            <Logo />
            <NavLinks closeOnNavigate />
          </div>
        </SheetContent>
      </Sheet>
      <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm text-muted-foreground">MMXchange <span className="ml-2 hidden sm:inline">/ Your learning space</span></Link>
      </div>

      <div className="flex items-center gap-2">
      <NotificationBell unreadCount={unreadCount} notifications={notifications} error={notificationsError} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-11 rounded-full p-0" aria-label="Account menu">
            <StudentAvatar name={displayName} url={avatarUrl} className="size-10" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{displayName}</DropdownMenuLabel>
          {profileError && <p role="alert" className="max-w-56 px-2 py-1 text-xs text-destructive">Could not load your profile name. Reload to try again.</p>}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile">My Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/skills">My Skills</Link>
          </DropdownMenuItem>
          <LogoutMenuItem />
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
