import Link from "next/link"
import { Logo } from "@/components/layout/logo"
import { LearningIllustration } from "@/components/ui/learning-illustration"

export default function AuthLayout({children}: {children: React.ReactNode}) {
    return (
        <main id="main-content" tabIndex={-1} className="grid min-h-dvh bg-background outline-none lg:grid-cols-2">
            <aside className="auth-story sticky top-0 hidden h-dvh flex-col justify-center gap-6 self-start px-12 py-10 lg:flex"><LearningIllustration scene="group" alt="Students exchanging ideas over a notebook and laptop" sizes="50vw" priority className="mx-auto max-h-[50dvh] w-full max-w-xl" /><p className="text-3xl font-semibold tracking-tight">A little give. A little grow.</p><p className="max-w-md text-base">Someone out there wants to learn what you know.</p></aside>
            <div className="flex min-h-dvh flex-col items-center gap-6 px-5 py-8 sm:px-10 sm:py-10">
            <Link href="/" aria-label="MMXchange home" className="inline-flex min-h-11 items-center rounded-lg">
                <Logo />
            </Link>
            <div className="w-full max-w-md">{children}</div>
            <p className="mt-auto max-w-sm pt-6 text-center text-xs text-muted-foreground">A student learning community. Not an official university service.</p>
            </div>
        </main>
    )
}
