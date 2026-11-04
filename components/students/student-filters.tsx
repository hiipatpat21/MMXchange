import Link from "next/link";
import { colleges } from "@/lib/mmsu-programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type StudentFilters = { q: string; category: string; skill: string; college: string };
export type FilterSkill = { id: number; name: string; category: string };
const selectClass = "h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-base sm:text-sm focus-visible:outline-2 focus-visible:outline-primary";

export function StudentFiltersForm({ filters, skills }: { filters: StudentFilters; skills: FilterSkill[] }) {
  const categories = [...new Set(skills.map((skill) => skill.category))].sort();
  return (
    <form action="/discover" method="get" className="filter-panel space-y-4" key={JSON.stringify(filters)}>
      <input type="hidden" name="view" value="browse" />
      <div className="min-w-0 space-y-2">
        <Label htmlFor="q">Student name</Label>
        <Input id="q" name="q" defaultValue={filters.q} maxLength={100} placeholder="Search by name" className="h-10" />
      </div>
      <details open={!!(filters.category || filters.skill || filters.college)}><summary className="text-sm font-medium">More filters</summary><div className="grid gap-4 py-3 sm:grid-cols-2"><div className="min-w-0 space-y-2">
        <Label htmlFor="category">Teaching category</Label>
        <select id="category" name="category" defaultValue={filters.category} className={selectClass}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="skill">Skill they can teach</Label>
        <select id="skill" name="skill" defaultValue={filters.skill} className={selectClass}>
          <option value="">All skills</option>
          {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
        </select>
      </div>
      <div className="min-w-0 space-y-2">
        <Label htmlFor="college">College</Label>
        <select id="college" name="college" defaultValue={filters.college} className={selectClass}>
          <option value="">All colleges</option>
          {colleges.map((college) => <option key={college.name} value={college.name}>{college.name}</option>)}
        </select>
      </div>
      </div></details>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="min-h-11">Apply filters</Button>
        <Button asChild variant="ghost" className="min-h-11"><Link href="/discover?view=browse">Clear filters</Link></Button>
      </div>
    </form>
  );
}
