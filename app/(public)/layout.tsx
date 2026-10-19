import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"

export default function PublicLayout ({children}: {children: React.ReactNode}) {
    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b bg-background/80">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <Link href="/" aria-label="MMXswap home">
                        <Logo />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" asChild>
                            <Link href="/login">Log in</Link>
                        </Button>
                        <Button asChild>
                            <Link href="/register">Sign up</Link>
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1">{children}</div>

            <footer className="border-t py-6">
                <p className="mx-auto max-w-6xl px-4 text-sm text-muted-foreground">
                    MMXSwap is a student project for MMSU students. It is not an official
                    university service.
                </p>
            </footer>
        </div>
    )
}