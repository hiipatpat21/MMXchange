import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Hero () {
    return (
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:gap-16">
            <div className="space-y-6">
                {/*
                <span className="inline-block rounded-full bg-brand-gold px-3 py-1 text-xs font-semibold text-primary">
                    For MMSU students
                </span>
                */}
                <p className="text-sm font-semibold text-primary">A student learning community</p>
                <h1 className="text-[2.625rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
                    Learn something new.{" "}
                    <span className="text-primary">Share what you know.</span>
                </h1>
                <p className="max-w-prose text-lg text-muted-foreground">
                    Swap skills one-on-one with a fellow student, or join a group session
                    hosted by someone who knows the topic.
                </p>
                <div className="flex flex-wrap gap-3">
                    <Button size="lg" asChild>
                        <Link href="/register">Get started</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/login">I already have an account</Link>
                    </Button>
                </div>
            </div>

            <Image
                src="/fem-hall.png"
                alt="Front view of the MMSU FEM Hall"
                width={1600}
                height={900}
                className="h-auto w-full rounded-2xl border object-cover shadow-sm"
            />
        </section>
    )
}
