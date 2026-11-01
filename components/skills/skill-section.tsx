import { X } from "lucide-react";
import { addSkill, removeSkill } from "@/app/(app)/skills/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Skill = { id: number; name: string; category: string };

export function SkillSection({
  title,
  description,
  kind,
  chosen,
  available,
}: {
  title: string;
  description: string;
  kind: "teach" | "learn";
  chosen: Skill[];
  available: Skill[];
}) {
  return (
    <section className="space-y-4 surface-card p-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {chosen.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here yet. Add a skill below.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {chosen.map((skill) => (
            <li
              key={skill.id}
              className="flex min-w-0 max-w-full items-center gap-1 rounded-full bg-primary/10 pl-4 pr-1 text-sm text-primary"
            >
              <span className="min-w-0 break-words">{skill.name}</span>
              <form action={removeSkill}>
                <input type="hidden" name="skillId" value={skill.id} />
                <button
                  type="submit"
                  aria-label={`Remove ${skill.name}`}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <X className="size-4" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {available.length ? <form action={addSkill} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="kind" value={kind} />
        <div className="min-w-0 flex-1 basis-40 space-y-2">
        <Label htmlFor={`skill-${kind}`}>Add a skill</Label>
        <select
          id={`skill-${kind}`}
          name="skillId"
          required
          defaultValue=""
          aria-label={`Add to: ${title}`}
          className="h-11 w-full min-w-0 rounded-xl border border-input bg-card px-3 text-base sm:text-sm"
        >
          <option value="" disabled>
            Choose a skill
          </option>
          {available.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        </div>
        <Button type="submit">Add</Button>
      </form> : <p className="text-sm text-muted-foreground">All available skills are already in your lists. Remove one to change how you use it.</p>}
    </section>
  );
}
