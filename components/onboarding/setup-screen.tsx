import Image from "next/image";

export function SetupScreen({ step, children }: { step: "profile" | "skills"; children: React.ReactNode }) {
  const isProfile = step === "profile";
  return <div className="grid items-start gap-7 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
    <aside className="grid grid-cols-[minmax(0,1fr)_88px] items-center gap-4 lg:block lg:space-y-5">
      <nav aria-label="Setup progress"><ol className="flex flex-col gap-3 text-sm">
        <li aria-current={isProfile ? "step" : undefined} className={isProfile ? "font-semibold text-primary" : "text-muted-foreground"}>1. Profile{!isProfile && " (saved)"}</li>
        <li aria-current={!isProfile ? "step" : undefined} className={!isProfile ? "font-semibold text-primary" : "text-muted-foreground"}>2. Skills (optional)</li>
      </ol></nav>
      <Image src={`/illustrations/onboarding-${step}.webp`} alt="" width={768} height={768} sizes="(min-width: 1024px) 300px, 88px" className="h-22 w-22 object-contain lg:h-auto lg:w-full" priority />
      <p className="hidden text-base leading-relaxed text-muted-foreground lg:block">{isProfile ? "A familiar face. A shared interest. Your next learning connection starts here." : "Everyone has a starting point. Add what feels right, or explore first."}</p>
    </aside>
    <section className="min-w-0 space-y-6">
      <header className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{isProfile ? "Let's get to know you" : "What would you like to learn?"}</h1>
      <p className="max-w-xl text-base leading-relaxed text-muted-foreground">{isProfile ? "Tell other students a little about yourself. Your photo and introduction are optional." : "Skills are optional. A free swap needs skills you both want to learn from each other. Without a mutual match, learning will use paid lessons as they become available."}</p></header>
      {children}
    </section>
  </div>;
}
