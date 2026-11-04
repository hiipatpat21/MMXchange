import Link from "next/link"
import { Logo } from "@/components/layout/logo"
import Image from "next/image"

export default function AuthLayout({children}: {children: React.ReactNode}) {
    return (
        <main id="main-content" tabIndex={-1} className="grid min-h-dvh bg-background outline-none lg:grid-cols-2">
            <aside className="hidden flex-col justify-center gap-6 bg-secondary/60 px-12 py-10 lg:flex"><Image src="/learning-together.webp" alt="Students learning art, coding and music together" width={1200} height={900} sizes="50vw" priority unoptimized className="h-auto w-full" /><p className="text-3xl font-medium tracking-tight">A little give. A little grow.</p><p className="max-w-md text-muted-foreground">Someone out there wants to learn what you know.</p></aside>
            <div className="flex flex-col items-center justify-center gap-6 px-5 py-10 sm:px-10">
            <Link href="/" aria-label="MMXchange home" className="inline-flex min-h-11 items-center rounded-lg">
                <Logo />
            </Link>
            <div className="w-full max-w-md">{children}</div>
            <p className="max-w-sm text-center text-xs text-muted-foreground">A student learning community. Not an official university service.</p>
            </div>
        </main>
    )
}
