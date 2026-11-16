import Link from "next/link";
import { getDashboardContext } from "@/lib/dashboard";
import { loadHome } from "@/lib/home";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { LearningIllustration } from "@/components/ui/learning-illustration";
import { RefreshButton } from "@/components/messages/refresh-button";
import { MeetingLocation } from "@/components/meetings/meeting-location";

export async function HomeOverview() {
  const { supabase, user } = await getDashboardContext();
  const data = await loadHome(supabase,user.id);
  const [next, ...later] = data.meetings;
  return <div className="space-y-6">
    <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="next-meeting-heading">
      <h2 id="next-meeting-heading" className="text-lg font-semibold">Your next meeting</h2>
      {data.meetingError ? <><p role="alert">Could not load your meetings. Refresh to try again.</p><RefreshButton /></> : next ? <>
        <p className="break-words text-2xl font-semibold">{next.title}</p><p className="text-lg font-medium text-primary">{formatDateTime(next.at)}</p><p className="text-sm text-muted-foreground">{next.kind} · Confirmed · Philippine time</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><Button asChild><Link href={next.href}>View meeting details</Link></Button>
          {next.format && next.venue && <MeetingLocation format={next.format} venue={next.venue} state="confirmed" editHref={next.href} />}</div>
        {!!later.length && <details className="disclosure"><summary>More upcoming meetings</summary><ul className="divide-y">{later.map(row => <li key={row.id}><Link className="flex min-h-11 flex-wrap justify-between gap-2 py-3 text-sm" href={row.href}><span className="break-words font-medium">{row.title}</span><span>{formatDateTime(row.at)}</span></Link></li>)}</ul></details>}
      </> : <div className="flex items-center gap-4"><div className="min-w-0 flex-1 space-y-3"><p>No confirmed meetings yet.</p><Button asChild><Link href="/discover">Find a tutor</Link></Button></div><LearningIllustration scene="curious" className="w-20 shrink-0 sm:w-24" sizes="96px" /></div>}
    </section>
    <section className="space-y-3 rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="attention-heading">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 id="attention-heading" className="text-lg font-semibold">Needs your attention</h2><Link href="/exchanges" className="inline-flex min-h-11 items-center text-sm text-primary underline">My learning</Link></div>
      {data.taskError ? <><p role="alert">Could not load requests and payments. Refresh to try again.</p><RefreshButton /></> : data.tasks.length ? <ul className="divide-y">{data.tasks.map(row => <li key={row.id}><Link href={row.href} className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"><span className="min-w-0 break-words font-medium">{row.title}</span><span className="text-sm text-primary underline">{row.label}</span></Link></li>)}</ul> : <p className="text-sm text-muted-foreground">Nothing to review.</p>}
    </section>
    {data.availabilityError ? <p role="alert">Could not check your availability. <Link className="text-primary underline" href="/profile#availability">Open availability settings</Link>.</p> : !data.hasAvailability && <aside className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary p-4"><p className="text-sm">No availability set.</p><Link href="/profile#availability" className="inline-flex min-h-11 items-center font-medium text-primary underline">Set availability</Link></aside>}
  </div>;
}
