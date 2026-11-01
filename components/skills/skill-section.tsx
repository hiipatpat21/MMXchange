import { X } from "lucide-react";
import { addSkill, removeSkill } from "@/app/(app)/skills/actions";
import { Button } from "@/components/ui/button";

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
    <section className="space-y-4 rounded-xl border bg-card p-6">
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
              className="flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-1 text-sm text-primary"
            >
              {skill.name}
              <form action={removeSkill}>
                <input type="hidden" name="skillId" value={skill.id} />
                <button
                  type="submit"
                  aria-label={`Remove ${skill.name}`}
                  className="rounded-full p-1 hover:bg-primary/20"
                >
                  <X className="size-3" />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={addSkill} className="flex gap-2">
        <input type="hidden" name="kind" value={kind} />
        <select
          name="skillId"
          required
          defaultValue=""
          aria-label={`Add to: ${title}`}
          className="h-9 flex-1 rounded-md border bg-background px-3 text-sm"
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
        <Button type="submit">Add</Button>
      </form>
    </section>
  );
}