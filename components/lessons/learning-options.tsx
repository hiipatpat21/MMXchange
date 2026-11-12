import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPhp, type PairOptions } from "@/lib/paid-lessons";
export function LearningOptions({ tutorId, options, skillNames = {} }: { tutorId: string; options: PairOptions; skillNames?: Record<number, string> }) {
  if (options.mutual) return <div className="space-y-2"><p className="text-sm text-muted-foreground">Your skills match in both directions. This is a free swap.</p><Button asChild><Link href={`/exchanges/new?to=${tutorId}&learn=${options.teachesMe[0].id}&teach=${options.iTeachThem[0].id}`}>Request skill swap</Link></Button></div>;
  return <div className="space-y-3"><p className="text-sm text-muted-foreground">A free swap needs complementary skills in both directions.</p>
    {!options.offers.length ? <p className="text-sm">No paid lesson is available from this tutor.</p> : <>
      <ul className="space-y-2">{options.offers.map(offer => <li key={offer.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{skillNames[offer.skill_id] ?? offer.skill_name ?? "Paid lesson"} <strong>{formatPhp(offer.price_centavos)}</strong> / hour</span>{options.ready && <Button asChild variant="outline"><Link href={`/lessons/new?offer=${offer.id}`}>Request paid lesson</Link></Button>}</li>)}</ul>
      {!options.ready && <p className="text-sm text-muted-foreground">Paid requests open after scheduling and payment setup is complete.</p>}
    </>}
  </div>;
}
