import Link from "next/link"
import { Logo } from "@/components/layout/logo"

export default function AuthLayout({children}: {children: React.ReactNode}) {
    return (
        <main id="main-content" tabIndex={-1} className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background px-4 py-10 outline-none sm:py-16">
            <Link href="/" aria-label="MMXchange home" className="inline-flex min-h-11 items-center rounded-lg">
                <Logo />
            </Link>
            <div className="w-full max-w-md">{children}</div>
            <p className="max-w-sm text-center text-xs text-muted-foreground">A student learning community. Not an official university service.</p>
        </main>
    )
}
