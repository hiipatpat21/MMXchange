import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadOwnAvailability } from "@/lib/availability-data";
import { weekdays, minuteToTime, meetingDateBounds } from "@/lib/availability";
import { WindowForm } from "@/components/availability/window-form";
import { ExceptionForm, RemoveAvailability } from "@/components/availability/exception-form";
export async function ProfileAvailability() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { windows, dates, error, now } = await loadOwnAvailability(client,user.id);
  if (error) return <section id="availability"><h2 className="text-xl font-semibold">Your availability</h2><p role="alert">Could not load availability. Please reload.</p></section>;
  return <section id="availability" className="space-y-5 scroll-mt-6"><header className="space-y-2"><h2 className="text-2xl font-semibold">When can you meet?</h2></header>
    <div className="space-y-5 rounded-xl border bg-card p-5"><h3 className="text-lg font-semibold">Weekly hours</h3>
      {windows.length ? <ul className="divide-y">{windows.map(row => <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2"><span>{weekdays[row.weekday]} {minuteToTime(row.start_minute)}-{minuteToTime(row.end_minute)}</span><RemoveAvailability id={row.id} label={`Remove ${weekdays[row.weekday]} ${minuteToTime(row.start_minute)} hours`} /></li>)}</ul> : <p>No hours saved.</p>}
      <WindowForm />
    </div><details className="disclosure"><summary>Unavailable dates ({dates.length})</summary><div className="space-y-4 pb-4"><p className="text-sm text-muted-foreground">Existing bookings stay unchanged.</p>{dates.length ? <ul className="divide-y">{dates.map(row => <li key={row.day} className="flex items-center justify-between gap-2 py-2"><span>{row.day}</span><RemoveAvailability day={row.day} label={`Remove unavailable date ${row.day}`} /></li>)}</ul> : <p>No dates blocked.</p>}<ExceptionForm min={meetingDateBounds(now).min} /></div></details>
  </section>;
}
