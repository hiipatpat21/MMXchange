import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SessionTabs({ active }: { active: "all" | "registered" | "organized" }) {
  return <nav aria-label="Group sessions" className="flex flex-wrap gap-2">
    {[{ key: "all", href: "/sessions", label: "All sessions" }, { key: "registered", href: "/sessions/registered", label: "My registrations" }, { key: "organized", href: "/sessions/organized", label: "My sessions" }].map((tab) => <Button key={tab.key} asChild variant={active === tab.key ? "default" : "outline"} className="min-h-11"><Link href={tab.href} aria-current={active === tab.key ? "page" : undefined}>{tab.label}</Link></Button>)}
  </nav>;
}
