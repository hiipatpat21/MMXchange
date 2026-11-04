import Link from "next/link";

export function SessionTabs({ active }: { active: "all" | "registered" | "organized" }) {
  return <nav aria-label="Group sessions" className="section-tabs">
    {[{ key: "all", href: "/sessions", label: "Explore" }, { key: "registered", href: "/sessions/registered", label: "I’m joining" }, { key: "organized", href: "/sessions/organized", label: "I’m hosting" }].map((tab) => <Link key={tab.key} href={tab.href} aria-current={active === tab.key ? "page" : undefined}>{tab.label}</Link>)}
  </nav>;
}
