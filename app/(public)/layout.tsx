import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"

export default function PublicLayout ({children}: {children: React.ReactNode}) {
    return (
        <div className="public-page flex min-h-screen flex-col">
            <header className="bg-card">
                <div className="landing-frame flex min-h-20 items-center justify-between gap-2 py-3">
                    <Link href="/" aria-label="MMXchange home" className="inline-flex min-h-11 items-center rounded-lg">
                        <Logo />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild className="px-3 sm:px-4">
                            <Link href="/login">Log in</Link>
                        </Button>
                        <Button asChild className="px-3 sm:px-4">
                            <Link href="/register">Sign up</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>

            <footer className="bg-card py-8">
                <p className="landing-frame text-sm text-muted-foreground">
                    MMXchange is a student project for MMSU students. It is not an official
                    university service.
                </p>
            </footer>
        </div>
    )
}
