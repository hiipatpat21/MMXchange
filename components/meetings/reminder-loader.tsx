import { createClient } from "@/lib/supabase/server";
import { MeetingReminders } from "@/components/meetings/meeting-reminders";
export async function ReminderLoader() {
  const client=await createClient();
  const {data:{user},error}=await client.auth.getUser();
  if(error || !user)return null;
  return <MeetingReminders key={user.id} userId={user.id} />;
}
