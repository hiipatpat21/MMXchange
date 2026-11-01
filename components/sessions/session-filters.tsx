import Link from "next/link";
import type { SessionFilters } from "@/lib/group-sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const selectClass = "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-base sm:text-sm focus-visible:outline-2 focus-visible:outline-primary";

export function SessionFiltersForm({ filters, categories }: { filters: SessionFilters; categories: string[] }) {
  return <form action="/sessions" method="get" key={JSON.stringify(filters)} className="grid gap-4 surface-card p-5 sm:grid-cols-2">
    <div className="min-w-0 space-y-2"><Label htmlFor="q">Session title</Label><Input id="q" name="q" maxLength={100} defaultValue={filters.q} className="h-10" /></div>
    <div className="min-w-0 space-y-2"><Label htmlFor="category">Category</Label><select id="category" name="category" defaultValue={filters.category} className={selectClass}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></div>
    <div className="min-w-0 space-y-2"><Label htmlFor="format">Format</Label><select id="format" name="format" defaultValue={filters.format} className={selectClass}><option value="">All formats</option><option value="in_person">In person</option><option value="online">Online</option></select></div>
    <div className="min-w-0 space-y-2"><Label htmlFor="date">On or after (Philippine date)</Label><Input id="date" name="date" type="date" defaultValue={filters.date} className="h-10" /></div>
    <div className="sm:col-span-2"><Label htmlFor="seats" className="flex min-h-11 cursor-pointer items-center gap-3"><input id="seats" name="seats" type="checkbox" value="1" defaultChecked={filters.seats === "1"} className="size-5 accent-primary focus-visible:outline-2 focus-visible:outline-primary" />Only with available seats</Label></div>
    <div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" className="min-h-11">Apply filters</Button><Button asChild variant="outline" className="min-h-11"><Link href="/sessions">Clear filters</Link></Button></div>
  </form>;
}
