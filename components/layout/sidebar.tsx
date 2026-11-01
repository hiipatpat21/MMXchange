import { Logo } from "@/components/layout/logo"
import { NavLinks } from "@/components/layout/nav-links"
import Link from "next/link"

export function Sidebar () {
    return (
        <aside aria-label="Main navigation" className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 border-r bg-card px-4 py-6 md:flex lg:w-64">
            <Link href="/dashboard" aria-label="MMXchange dashboard" className="rounded-xl px-2 focus-visible:outline-2 focus-visible:outline-primary"><Logo /></Link>
            <p className="px-3 text-xs font-semibold tracking-widest text-muted-foreground">YOUR WORKSPACE</p>
            <NavLinks />
            <div className="mt-auto border-t px-3 pt-5"><p className="text-sm font-medium">A little knowledge goes a long way.</p><p className="mt-1 text-xs text-muted-foreground">Learn and share with fellow students.</p></div>
        </aside>
    )

}
