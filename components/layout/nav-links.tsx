"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, CalendarDays, ArrowLeftRight, Bell, MessageCircle, MessagesSquare, UserRound, BookOpen } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/discover", label: "Find a partner", icon: Compass },
  { href: "/sessions", label: "Group sessions", icon: CalendarDays },
  { href: "/exchanges", label: "Exchanges", icon: ArrowLeftRight },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/forum", label: "Forum", icon: MessagesSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/skills", label: "My skills", icon: BookOpen },
  { href: "/profile", label: "My profile", icon: UserRound },
];

export function NavLinks({ closeOnNavigate = false }: { closeOnNavigate?: boolean }) {
  return (
    <Suspense fallback={<NavigationLinks pathname={null} closeOnNavigate={closeOnNavigate} />}>
      <ActiveNavLinks closeOnNavigate={closeOnNavigate} />
    </Suspense>
  );
}

function ActiveNavLinks({ closeOnNavigate }: { closeOnNavigate: boolean }) {
  return <NavigationLinks pathname={usePathname()} closeOnNavigate={closeOnNavigate} />;
}

function NavigationLinks({ pathname, closeOnNavigate }: { pathname: string | null; closeOnNavigate: boolean }) {
  return (
    <nav aria-label="Workspace pages" className="flex flex-col gap-1.5">
      {links.map(({ href, label, icon: Icon }, index) => {
        const active = pathname === href || pathname?.startsWith(href + "/");
        const link = (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary",
              (index === 4 || index === 7) && "mt-5",
              active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} />
            {label}
          </Link>
        );
        return closeOnNavigate ? <SheetClose key={href} asChild>{link}</SheetClose> : link;
      })}
    </nav>
  );
}
