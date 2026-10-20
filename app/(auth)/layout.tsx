import Link from "next/link"
import { Logo } from "@/components/layout/logo"

export default function AuthLayout({children}: {children: React.ReactNode}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
            <Link href="/" aria-label="MMXchange home">
                <Logo />
            </Link>
            <div className="w-full max-w-sm">{children}</div>
        </div>
    )
}