import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Hero () {
    return (
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
            <div className="space-y-6">
                {/*
                <span className="inline-block rounded-full bg-brand-gold px-3 py-1 text-xs font-semibold text-primary">
                    For MMSU students
                </span>
                */}
                <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                    Everyone has something to teach.{" "}
                    <span className="text-primary">Everyone has something to learn.</span>
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
                className="h-auto w-full rounded-xl object-cover shadow-lg"
            />
        </section>
    )
}