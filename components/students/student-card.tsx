import Link from "next/link";
import type { StudentProfile } from "@/lib/matching";
import { Button } from "@/components/ui/button";

export function StudentIdentity({ student, heading = "h3" }: { student: Pick<StudentProfile, "display_name" | "college" | "program" | "year_level">; heading?: "h2" | "h3" }) {
  const Heading = heading;
  const initials = student.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{initials}</span>
      <div className="min-w-0 space-y-1 break-words">
        <Heading className="text-lg font-semibold">{student.display_name}</Heading>
        <p className="text-sm text-muted-foreground">{[student.college, student.program, student.year_level ? `Year ${student.year_level}` : null].filter(Boolean).join(" · ") || "No academic details added yet."}</p>
      </div>
    </div>
  );
}

export function StudentCard({ student }: { student: StudentProfile }) {
  return (
    <article className="min-w-0 space-y-4 surface-card p-5 transition-shadow hover:shadow-sm">
      <StudentIdentity student={student} />
      {student.bio && <p className="line-clamp-3 break-words text-sm text-muted-foreground">{student.bio}</p>}
      <Button asChild variant="outline" className="min-h-11"><Link href={`/students/${student.id}`}>View profile<span className="sr-only"> of {student.display_name}</span></Link></Button>
    </article>
  );
}
