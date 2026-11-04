import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Hero () {
    return (
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 sm:px-8 md:grid-cols-[0.85fr_1.15fr] md:py-20">
            <div className="space-y-6">
                {/*
                <span className="inline-block rounded-full bg-brand-gold px-3 py-1 text-xs font-semibold text-primary">
                    For MMSU students
                </span>
                */}
                <h1 className="max-w-md text-[2.5rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">A skill for a skill.</h1>
                <p className="max-w-prose text-lg text-muted-foreground">
                    You know something worth sharing. Find a learning partner or join a group session in your MMSU student community.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button size="lg" asChild>
                        <Link href="/register">Find your learning people →</Link>
                    </Button>
                    <Link href="#ways-to-learn" className="inline-flex min-h-12 items-center px-2 text-sm font-medium text-foreground underline underline-offset-4">See how it works</Link>
                </div>
            </div>

            <Image
                src="/learning-together.webp"
                alt="Illustration of students sharing drawing, coding, and music skills around a table"
                width={1200}
                height={900}
                priority
                unoptimized
                sizes="(max-width: 767px) 100vw, 60vw"
                className="h-auto w-full object-contain"
            />
        </section>
    )
}
