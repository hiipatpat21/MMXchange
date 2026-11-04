import Link from "next/link";
import type { StudentProfile } from "@/lib/matching";
import { Button } from "@/components/ui/button";
import { StudentAvatar } from "@/components/students/student-avatar";

export function StudentIdentity({ student, heading = "h3" }: { student: Pick<StudentProfile, "display_name" | "college" | "program" | "year_level" | "avatar_url">; heading?: "h2" | "h3" }) {
  const Heading = heading;
  return (
    <div className="flex min-w-0 items-start gap-3">
      <StudentAvatar name={student.display_name} url={student.avatar_url} />
      <div className="min-w-0 space-y-1 break-words">
        <Heading className="text-lg font-semibold">{student.display_name}</Heading>
        <p className="text-sm text-muted-foreground">{[student.college, student.program, student.year_level ? `Year ${student.year_level}` : null].filter(Boolean).join(" · ") || "No academic details added yet."}</p>
      </div>
    </div>
  );
}

export function StudentCard({ student }: { student: StudentProfile }) {
  return (
    <article className="min-w-0 space-y-4 surface-card p-5 transition-colors hover:border-primary/25">
      <StudentIdentity student={student} />
      {student.bio && <p className="line-clamp-3 break-words text-sm text-muted-foreground">{student.bio}</p>}
      <Button asChild variant="outline" className="min-h-11"><Link href={`/students/${student.id}`}>View profile<span className="sr-only"> of {student.display_name}</span></Link></Button>
    </article>
  );
}
