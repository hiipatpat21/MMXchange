"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Compass, ArrowLeftRight, MessageCircle, MessagesSquare } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/discover", label: "Find a tutor", icon: Compass },
  { href: "/exchanges", label: "My learning", icon: ArrowLeftRight },
  { href: "/messages", label: "Messages", icon: MessageCircle },
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
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(href + "/") || (href === "/exchanges" && pathname?.startsWith("/lessons"));
        const link = (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary",
              active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} />
            {label}
          </Link>
        );
        return closeOnNavigate ? <SheetClose key={href} asChild>{link}</SheetClose> : link;
      })}
      <details className="mt-4" open={pathname?.startsWith("/forum") || undefined}>
        <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-3 text-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary">More</summary>
        {closeOnNavigate ? <SheetClose asChild><Link href="/forum" aria-current={pathname?.startsWith("/forum") ? "page" : undefined} className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-muted"><MessagesSquare className="size-4" aria-hidden="true" />Forum</Link></SheetClose> : <Link href="/forum" aria-current={pathname?.startsWith("/forum") ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-muted", pathname?.startsWith("/forum") && "bg-secondary font-semibold")}><MessagesSquare className="size-4" aria-hidden="true" />Forum</Link>}
      </details>
    </nav>
  );
}
