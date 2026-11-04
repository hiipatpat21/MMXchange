const steps = [
    { title: "Bring what you know", text: "Add skills you can teach and a few you’re curious about." },
    { title: "Find your people", text: "Meet a partner with complementary skills, or pick a group session." },
    { title: "Make it happen", text: "Plan a time, learn together, and share how it went." },
]
export function HowItWorks() {
    return (
        <section className="bg-secondary/60 py-16">
            <div className="mx-auto max-w-6xl px-4">
                <h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">Start with a little curiosity.</h2>
                <div className="mt-10 grid gap-8 md:grid-cols-3">
                    {steps.map(({ title, text }) => (
                        <div key={title}>
                            <h3 className="text-xl font-medium">{title}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
