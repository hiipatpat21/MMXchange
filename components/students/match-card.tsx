import Link from "next/link";
import type { StudentMatch } from "@/lib/matching";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudentIdentity } from "@/components/students/student-card";
import { SkillBadge } from "@/components/students/skill-badge";
import { StudentAvatar } from "@/components/students/student-avatar";

export function MatchCard({ match, compact = false }: { match: StudentMatch; compact?: boolean }) {
  if (compact) return <Link href={`/students/${match.profile.id}`} className="dashboard-row gap-3"><StudentAvatar name={match.profile.display_name} url={match.profile.avatar_url} className="size-10 shrink-0" /><span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{match.profile.display_name}</span><span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{match.explanation}</span></span><span aria-hidden="true" className="text-primary">→</span></Link>;
  return (
    <article className="min-w-0 space-y-4 surface-card p-5">
      <StudentIdentity student={match.profile} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={match.mutual ? "default" : "outline"}>{match.mutual ? "Mutual match" : match.teachesMe.length ? "Can teach you" : "You can teach them"}</Badge>
      </div>
      <p className="break-words text-sm">{match.explanation}</p>
      <details className="rounded-xl bg-secondary/50 px-4"><summary className="text-sm font-medium">Skills you can exchange ({match.overlapCount})</summary><div className="space-y-3 pb-4">{[{ title: "They can teach you", skills: match.teachesMe }, { title: "You can teach them", skills: match.iTeachThem }].filter((group) => group.skills.length).map((group) => (
        <div key={group.title}>
          <h4 className="mb-2 text-sm font-medium">{group.title}</h4>
          <div className="flex flex-wrap gap-2">{group.skills.map((skill) => <SkillBadge key={skill.id} name={skill.name} />)}</div>
        </div>
      ))}</div></details>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="min-h-11"><Link href={`/students/${match.profile.id}`}>View profile</Link></Button>
        <Button asChild variant="ghost" className="min-h-11"><Link href={`/exchanges/new?to=${match.profile.id}`}>Request exchange →</Link></Button>
      </div>
    </article>
  );
}
