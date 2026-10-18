"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Compass,
    CalendarDays,
    ArrowLeftRight,
    MessageCircle,
    MessageSquare,
    Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/sessions", label: "Group Sessions", icon: CalendarDays },
  { href: "/exchanges", label: "Exchanges", icon: ArrowLeftRight },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/forum", label: "Forum", icon: MessageSquare },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function NavLinks () {
    const pathname = usePathname()
    // if the user is at localhost:3000/sessions, pathname is "/sessions"

    return (
        <nav className="flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon}) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                    <Link
                        key={href}
                        href={href}
                        className = {cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Icon className = "size-4" />
                        {label}
                    </Link>
                )
            })}
        </nav>
    )
}