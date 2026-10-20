import { ArrowLeftRight, Users } from "lucide-react";

const ways = [
  {
    title: "One-on-one exchange",
    text: "Teach a skill, learn a skill. We match you with a student whose skills complement yours, and you arrange sessions together.",
    note: "Mutual: both of you teach and learn.",
    icon: ArrowLeftRight,
  },
  {
    title: "Group learning session",
    text: "Join a workshop or tutoring session hosted by a student who knows the topic, or host one yourself.",
    note: "Open: attend as a learner, no swap required.",
    icon: Users,
  },
];

export function TwoWays () {
    return (
        <section className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-3xl font-bold">Two ways to learn</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
                {ways.map(({ title, text, note, icon: Icon }) => (
                    <div key={title} className="rounded-xl border bg-card p-6">
                        <div className="flex size-11 items-center justify-center rounded-lg bg-brand-gold text-primary">
                            <Icon className="size-5"/>  
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">{title}</h3>
                        <p className="mt-2 text-muted-foreground">{text}</p>
                        <p className="mt-4 text-sm font-medium text-primary">{note}</p>
                    </div>
                ))}
            </div>
        </section >
    )
}