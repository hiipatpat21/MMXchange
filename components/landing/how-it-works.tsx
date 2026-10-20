import { Search, Users, ArrowLeftRight, BookOpen, TrendingUp } from "lucide-react";

const steps = [
    { title: "Find", text: "List what you can teach and what you want to learn.", icon: Search },
    { title: "Match", text: "See students whose skills complement yours.", icon: Users },
    { title: "Swap", text: "Send a request and agree on what to exchange.", icon: ArrowLeftRight },
    { title: "Learn", text: "Meet up in person or online and teach each other.", icon: BookOpen },
    { title: "Grow", text: "Share feedback and host sessions of your own.", icon: TrendingUp },
]
export function HowItWorks() {
    return (
        <section className="bg-muted/40 py-16">
            <div className="mx-auto max-w-6xl px-4">
                <h2 className="text-center text-3xl font-bold">How MMXchange works</h2>
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                    {steps.map(({ title, text, icon: Icon }) => (
                        <div key={title} className="rounded-xl border bg-card p-5">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Icon className="size-5" />
                            </div>
                            <h3 className="mt-4 font-semibold">{title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}