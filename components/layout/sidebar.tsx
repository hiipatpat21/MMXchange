import { Logo } from "@/components/layout/logo"
import { NavLinks } from "@/components/layout/nav-links"

export function Sidebar () {
    return (
        <aside className = "hidden w-64 shrink-0 flex-col gap-6 border-r bg-card p-4 md:flex">
            <Logo />
            <NavLinks />
        </aside>
    )

}