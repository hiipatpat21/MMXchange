import { Badge } from "@/components/ui/badge";

export function SkillBadge({ name }: { name: string }) {
  return <Badge variant="secondary" className="h-auto max-w-full whitespace-normal break-words py-1">{name}</Badge>;
}
