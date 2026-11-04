
const ways = [
  {
    title: "One-on-one exchange",
    text: "Teach a skill, learn a skill. We match you with a student whose skills complement yours, and you arrange sessions together.",
    note: "Mutual: both of you teach and learn.",
  },
  {
    title: "Group learning session",
    text: "Join a workshop or tutoring session hosted by a student who knows the topic, or host one yourself.",
    note: "Open: attend as a learner, no swap required.",
  },
];

export function TwoWays () {
    return (
        <section id="ways-to-learn" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Two ways to grow.</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
                {ways.map(({ title, text, note }) => (
                    <div key={title} className="surface-card p-6">
                        <h3 className="text-xl font-semibold">{title}</h3>
                        <p className="mt-2 text-muted-foreground">{text}</p>
                        <p className="mt-4 text-sm font-medium text-primary">{note}</p>
                    </div>
                ))}
            </div>
        </section >
    )
}
