import { Logo } from "@/components/layout/logo"
import { NavLinks } from "@/components/layout/nav-links"
import Link from "next/link"

export function Sidebar () {
    return (
        <aside aria-label="Main navigation" className="sidebar-scroll sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 overflow-y-auto px-4 py-6 lg:flex">
            <Link href="/dashboard" aria-label="MMXchange dashboard" className="rounded-xl px-2 focus-visible:outline-2 focus-visible:outline-primary"><Logo /></Link>
            <NavLinks />
            <div className="mt-auto px-3 pt-6"><p className="text-sm font-medium">A little give. A little grow.</p><p className="mt-2 text-xs text-muted-foreground">Your skills could be someone else&apos;s next discovery.</p></div>
        </aside>
    )

}
