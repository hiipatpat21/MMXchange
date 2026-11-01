import Link from "next/link";
import type { StudentMatch } from "@/lib/matching";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentIdentity } from "@/components/students/student-card";
import { SkillBadge } from "@/components/students/skill-badge";

export function MatchCard({ match }: { match: StudentMatch }) {
  return (
    <article className="min-w-0 space-y-4 rounded-xl border bg-card p-5">
      <StudentIdentity student={match.profile} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={match.mutual ? "default" : "outline"}>{match.mutual ? "Mutual match" : match.teachesMe.length ? "Can teach you" : "You can teach them"}</Badge>
        <span className="text-sm text-muted-foreground">{match.overlapCount} overlapping {match.overlapCount === 1 ? "skill" : "skills"}</span>
      </div>
      <p className="break-words text-sm">{match.explanation}</p>
      {[{ title: "They can teach you", skills: match.teachesMe }, { title: "You can teach them", skills: match.iTeachThem }].filter((group) => group.skills.length).map((group) => (
        <div key={group.title}>
          <h4 className="mb-2 text-sm font-medium">{group.title}</h4>
          <div className="flex flex-wrap gap-2">{group.skills.map((skill) => <SkillBadge key={skill.id} name={skill.name} />)}</div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-10"><Link href={`/students/${match.profile.id}`}>View profile</Link></Button>
        <Button asChild className="min-h-10"><Link href={`/exchanges/new?to=${match.profile.id}`}>Request exchange</Link></Button>
      </div>
    </article>
  );
}
