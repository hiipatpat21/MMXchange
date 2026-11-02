-- Phase 2: new SQL only. Earlier schema history is in lib/supabase/schema.sql.
create table if not exists public.exchange_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  learn_skill_id bigint not null references public.skills(id),
  teach_skill_id bigint not null references public.skills(id),
  message text not null check (char_length(btrim(message)) between 10 and 500),
  format text not null check (format in ('in_person', 'online', 'either')),
  availability text check (char_length(availability) <= 300),
  notes text check (char_length(notes) <= 500),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'scheduled', 'completed', 'declined', 'cancelled')),
  requester_completed_at timestamptz,
  recipient_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id)
);

create index if not exists exchange_requests_recipient_status_idx
  on public.exchange_requests(recipient_id, status);
create index if not exists exchange_requests_requester_status_idx
  on public.exchange_requests(requester_id, status);
create index if not exists exchange_requests_learn_skill_idx
  on public.exchange_requests(learn_skill_id);
create index if not exists exchange_requests_teach_skill_idx
  on public.exchange_requests(teach_skill_id);
-- Canonical ordering makes A -> B and B -> A the same pair.
create unique index if not exists exchange_requests_active_pair_idx
  on public.exchange_requests(least(requester_id, recipient_id), greatest(requester_id, recipient_id))
  where status in ('pending', 'accepted', 'scheduled');

alter table public.exchange_requests enable row level security;
drop policy if exists "Participants can read exchanges" on public.exchange_requests;
create policy "Participants can read exchanges"
  on public.exchange_requests for select to authenticated
  using (requester_id = (select auth.uid()) or recipient_id = (select auth.uid()));

revoke all on public.exchange_requests from public, anon, authenticated;
grant select on public.exchange_requests to authenticated;

create or replace function public.create_exchange_request(
  p_recipient uuid, p_learn_skill bigint, p_teach_skill bigint,
  p_message text, p_format text, p_availability text, p_notes text
)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null then return 'not_logged_in'; end if;
  if p_recipient is null then return 'recipient_not_found'; end if;
  if p_recipient = v_user then return 'self_request'; end if;
  if p_message is null or char_length(btrim(p_message)) not between 10 and 500
     or p_format is null or p_format not in ('in_person', 'online', 'either')
     or char_length(coalesce(p_availability, '')) > 300
     or char_length(coalesce(p_notes, '')) > 500
     or p_learn_skill is null or p_teach_skill is null
  then return 'invalid_input'; end if;
  if not exists (select 1 from public.profiles where id = v_user)
    then return 'profile_not_found'; end if;
  if not exists (select 1 from public.profiles where id = p_recipient)
    then return 'recipient_not_found'; end if;

  -- Keep these teaching rows from being removed during this transaction.
  perform 1 from public.profile_skills
    where profile_id = p_recipient and skill_id = p_learn_skill and kind = 'teach'
    for share;
  if not found then return 'recipient_does_not_teach'; end if;
  perform 1 from public.profile_skills
    where profile_id = v_user and skill_id = p_teach_skill and kind = 'teach'
    for share;
  if not found then return 'you_do_not_teach'; end if;

  -- The unique index also protects against concurrent/opposite requests.
  insert into public.exchange_requests (
    requester_id, recipient_id, learn_skill_id, teach_skill_id,
    message, format, availability, notes
  ) values (
    v_user, p_recipient, p_learn_skill, p_teach_skill,
    btrim(p_message), p_format, nullif(btrim(p_availability), ''), nullif(btrim(p_notes), '')
  ) returning id into v_id;
  return 'ok:' || v_id::text;
exception when unique_violation then
  return 'duplicate_active';
end;
$$;

create or replace function public.respond_to_exchange(p_exchange_id uuid, p_action text)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_exchange public.exchange_requests%rowtype;
  v_status text;
begin
  if v_user is null then return 'not_logged_in'; end if;
  if p_action is null or p_action not in ('accept', 'decline', 'cancel')
    then return 'invalid_action'; end if;
  select * into v_exchange from public.exchange_requests
    where id = p_exchange_id for update;
  if not found then return 'not_found'; end if;
  if v_user <> v_exchange.requester_id and v_user <> v_exchange.recipient_id
    then return 'not_allowed'; end if;

  if v_exchange.status = 'pending' then
    if p_action in ('accept', 'decline') then
      if v_user <> v_exchange.recipient_id then return 'not_allowed'; end if;
      v_status := case when p_action = 'accept' then 'accepted' else 'declined' end;
    elsif p_action = 'cancel' then
      if v_user <> v_exchange.requester_id then return 'not_allowed'; end if;
      v_status := 'cancelled';
    end if;
  elsif v_exchange.status = 'accepted' and p_action = 'cancel' then
    v_status := 'cancelled';
  else
    return 'invalid_transition';
  end if;
  update public.exchange_requests set status = v_status, updated_at = now()
    where id = p_exchange_id;
  return 'ok';
end;
$$;

revoke execute on function public.create_exchange_request(uuid, bigint, bigint, text, text, text, text) from public, anon;
grant execute on function public.create_exchange_request(uuid, bigint, bigint, text, text, text, text) to authenticated;
revoke execute on function public.respond_to_exchange(uuid, text) from public, anon;
grant execute on function public.respond_to_exchange(uuid, text) to authenticated;

-- Prompt 3: exchange scheduling and completion. Run only from this marker.
create table if not exists public.exchange_sessions (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchange_requests(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id),
  skill_id bigint not null references public.skills(id),
  starts_at timestamptz not null check (isfinite(starts_at)),
  duration_minutes int not null check (duration_minutes between 15 and 480),
  format text not null check (format in ('in_person', 'online')),
  venue text not null check (char_length(btrim(venue)) between 2 and 200),
  notes text check (char_length(notes) <= 500),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists exchange_sessions_exchange_idx on public.exchange_sessions(exchange_id);
create index if not exists exchange_sessions_starts_idx on public.exchange_sessions(starts_at);
create index if not exists exchange_sessions_teacher_idx on public.exchange_sessions(teacher_id);
create index if not exists exchange_sessions_skill_idx on public.exchange_sessions(skill_id);
create index if not exists exchange_sessions_creator_idx on public.exchange_sessions(created_by);
alter table public.exchange_sessions enable row level security;
drop policy if exists "Participants can read exchange sessions" on public.exchange_sessions;
create policy "Participants can read exchange sessions"
  on public.exchange_sessions for select to authenticated using (
    exists (select 1 from public.exchange_requests e where e.id = exchange_id
      and (e.requester_id = (select auth.uid()) or e.recipient_id = (select auth.uid())))
  );
revoke all on public.exchange_sessions from public, anon, authenticated;
grant select on public.exchange_sessions to authenticated;

create or replace function public.schedule_exchange_session(
  p_exchange_id uuid, p_teacher_id uuid, p_skill_id bigint,
  p_starts_at timestamptz, p_duration int, p_format text, p_venue text, p_notes text
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_exchange public.exchange_requests%rowtype;
begin
  if v_user is null then return 'not_logged_in'; end if;
  select * into v_exchange from public.exchange_requests where id = p_exchange_id for update;
  if not found then return 'not_found'; end if;
  if v_user not in (v_exchange.requester_id, v_exchange.recipient_id) then return 'not_allowed'; end if;
  if v_exchange.status not in ('accepted', 'scheduled') then return 'invalid_transition'; end if;
  if p_teacher_id is null or p_skill_id is null or not (
    (p_teacher_id = v_exchange.requester_id and p_skill_id = v_exchange.teach_skill_id)
    or (p_teacher_id = v_exchange.recipient_id and p_skill_id = v_exchange.learn_skill_id)
  ) then return 'invalid_teacher_skill'; end if;
  if p_starts_at is null or not isfinite(p_starts_at) or p_starts_at <= now() then return 'past_date'; end if;
  if p_duration is null or p_duration not between 15 and 480
    or p_format is null or p_format not in ('in_person', 'online')
    or p_venue is null or char_length(btrim(p_venue)) not between 2 and 200
    or char_length(coalesce(p_notes, '')) > 500 then return 'invalid_input'; end if;
  insert into public.exchange_sessions(exchange_id, teacher_id, skill_id, starts_at, duration_minutes, format, venue, notes, created_by)
    values (p_exchange_id, p_teacher_id, p_skill_id, p_starts_at, p_duration, p_format, btrim(p_venue), nullif(btrim(p_notes), ''), v_user);
  update public.exchange_requests set status = 'scheduled', requester_completed_at = null,
    recipient_completed_at = null, updated_at = now() where id = p_exchange_id;
  return 'ok';
end;
$$;

create or replace function public.reschedule_exchange_session(
  p_session_id uuid, p_starts_at timestamptz, p_duration int, p_format text, p_venue text, p_notes text
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_exchange_id uuid;
  v_exchange public.exchange_requests%rowtype;
  v_session public.exchange_sessions%rowtype;
begin
  if v_user is null then return 'not_logged_in'; end if;
  select exchange_id into v_exchange_id from public.exchange_sessions where id = p_session_id;
  if not found then return 'not_found'; end if;
  -- Always lock the parent first; every mutation uses the same lock order.
  select * into v_exchange from public.exchange_requests where id = v_exchange_id for update;
  if not found then return 'not_found'; end if;
  if v_user not in (v_exchange.requester_id, v_exchange.recipient_id) then return 'not_allowed'; end if;
  if v_exchange.status not in ('accepted', 'scheduled') then return 'invalid_transition'; end if;
  select * into v_session from public.exchange_sessions where id = p_session_id for update;
  if not found then return 'not_found'; end if;
  if v_session.status <> 'scheduled' then return 'session_not_scheduled'; end if;
  if p_starts_at is null or not isfinite(p_starts_at) or p_starts_at <= now() then return 'past_date'; end if;
  if p_duration is null or p_duration not between 15 and 480
    or p_format is null or p_format not in ('in_person', 'online')
    or p_venue is null or char_length(btrim(p_venue)) not between 2 and 200
    or char_length(coalesce(p_notes, '')) > 500 then return 'invalid_input'; end if;
  update public.exchange_sessions set starts_at = p_starts_at, duration_minutes = p_duration,
    format = p_format, venue = btrim(p_venue), notes = nullif(btrim(p_notes), ''), updated_at = now()
    where id = p_session_id;
  update public.exchange_requests set requester_completed_at = null, recipient_completed_at = null,
    updated_at = now() where id = v_exchange_id;
  return 'ok';
end;
$$;

create or replace function public.cancel_exchange_session(p_session_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_exchange_id uuid;
  v_exchange public.exchange_requests%rowtype;
  v_session public.exchange_sessions%rowtype;
begin
  if v_user is null then return 'not_logged_in'; end if;
  select exchange_id into v_exchange_id from public.exchange_sessions where id = p_session_id;
  if not found then return 'not_found'; end if;
  select * into v_exchange from public.exchange_requests where id = v_exchange_id for update;
  if not found then return 'not_found'; end if;
  if v_user not in (v_exchange.requester_id, v_exchange.recipient_id) then return 'not_allowed'; end if;
  if v_exchange.status not in ('accepted', 'scheduled') then return 'invalid_transition'; end if;
  select * into v_session from public.exchange_sessions where id = p_session_id for update;
  if not found then return 'not_found'; end if;
  if v_session.status <> 'scheduled' then return 'session_not_scheduled'; end if;
  update public.exchange_sessions set status = 'cancelled', updated_at = now() where id = p_session_id;
  update public.exchange_requests set
    status = case when exists (select 1 from public.exchange_sessions where exchange_id = v_exchange_id and status = 'scheduled') then 'scheduled' else 'accepted' end,
    requester_completed_at = null, recipient_completed_at = null, updated_at = now()
    where id = v_exchange_id;
  return 'ok';
end;
$$;

create or replace function public.mark_exchange_complete(p_exchange_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_exchange public.exchange_requests%rowtype;
begin
  if v_user is null then return 'not_logged_in'; end if;
  select * into v_exchange from public.exchange_requests where id = p_exchange_id for update;
  if not found then return 'not_found'; end if;
  if v_user not in (v_exchange.requester_id, v_exchange.recipient_id) then return 'not_allowed'; end if;
  if v_exchange.status = 'completed' then return 'ok'; end if;
  if v_exchange.status <> 'scheduled' then return 'invalid_transition'; end if;
  if not exists (select 1 from public.exchange_sessions where exchange_id = p_exchange_id
    and status <> 'cancelled' and starts_at <= now()) then return 'too_early'; end if;
  update public.exchange_requests set
    requester_completed_at = case when v_user = requester_id then coalesce(requester_completed_at, now()) else requester_completed_at end,
    recipient_completed_at = case when v_user = recipient_id then coalesce(recipient_completed_at, now()) else recipient_completed_at end,
    updated_at = now() where id = p_exchange_id returning * into v_exchange;
  if v_exchange.requester_completed_at is not null and v_exchange.recipient_completed_at is not null then
    update public.exchange_requests set status = 'completed', updated_at = now() where id = p_exchange_id;
    update public.exchange_sessions set status = 'completed', updated_at = now()
      where exchange_id = p_exchange_id and status <> 'cancelled';
  end if;
  return 'ok';
end;
$$;

create or replace function public.respond_to_exchange(p_exchange_id uuid, p_action text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_exchange public.exchange_requests%rowtype;
  v_status text;
begin
  if v_user is null then return 'not_logged_in'; end if;
  if p_action is null or p_action not in ('accept', 'decline', 'cancel') then return 'invalid_action'; end if;
  select * into v_exchange from public.exchange_requests where id = p_exchange_id for update;
  if not found then return 'not_found'; end if;
  if v_user not in (v_exchange.requester_id, v_exchange.recipient_id) then return 'not_allowed'; end if;
  if v_exchange.status = 'pending' then
    if p_action in ('accept', 'decline') then
      if v_user <> v_exchange.recipient_id then return 'not_allowed'; end if;
      v_status := case when p_action = 'accept' then 'accepted' else 'declined' end;
    else
      if v_user <> v_exchange.requester_id then return 'not_allowed'; end if;
      v_status := 'cancelled';
    end if;
  elsif v_exchange.status in ('accepted', 'scheduled') and p_action = 'cancel' then
    v_status := 'cancelled';
  else return 'invalid_transition'; end if;
  if v_status = 'cancelled' then
    update public.exchange_sessions set status = 'cancelled', updated_at = now()
      where exchange_id = p_exchange_id and status = 'scheduled';
  end if;
  update public.exchange_requests set status = v_status, requester_completed_at = null,
    recipient_completed_at = null, updated_at = now() where id = p_exchange_id;
  return 'ok';
end;
$$;

revoke execute on function public.schedule_exchange_session(uuid, uuid, bigint, timestamptz, int, text, text, text) from public, anon;
grant execute on function public.schedule_exchange_session(uuid, uuid, bigint, timestamptz, int, text, text, text) to authenticated;
revoke execute on function public.reschedule_exchange_session(uuid, timestamptz, int, text, text, text) from public, anon;
grant execute on function public.reschedule_exchange_session(uuid, timestamptz, int, text, text, text) to authenticated;
revoke execute on function public.cancel_exchange_session(uuid) from public, anon;
grant execute on function public.cancel_exchange_session(uuid) to authenticated;
revoke execute on function public.mark_exchange_complete(uuid) from public, anon;
grant execute on function public.mark_exchange_complete(uuid) to authenticated;
revoke execute on function public.respond_to_exchange(uuid, text) from public, anon;
grant execute on function public.respond_to_exchange(uuid, text) to authenticated;

-- Prompt 4: group-session editing, completion and cancellation.
create or replace function public.complete_group_session(p_session_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.group_sessions%rowtype;
begin
  if v_user is null then return 'not_logged_in'; end if;
  select * into v_session from public.group_sessions where id = p_session_id for update;
  if not found then return 'not_found'; end if;
  if v_session.organizer_id <> v_user then return 'not_organizer'; end if;
  if v_session.status <> 'published' then return 'not_open'; end if;
  if v_session.starts_at > now() then return 'too_early'; end if;
  update public.group_sessions set status = 'completed' where id = p_session_id;
  return 'ok';
end;
$$;

create or replace function public.update_group_session(
  p_session_id uuid, p_title text, p_skill_id bigint, p_description text,
  p_objectives text, p_prerequisites text, p_starts_at timestamptz,
  p_duration_minutes int, p_format text, p_venue text, p_capacity int,
  p_registration_deadline timestamptz
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.group_sessions%rowtype;
  v_count bigint;
begin
  if v_user is null then return 'not_logged_in'; end if;
  select * into v_session from public.group_sessions where id = p_session_id for update;
  if not found then return 'not_found'; end if;
  if v_session.organizer_id <> v_user then return 'not_organizer'; end if;
  if v_session.status <> 'published' then return 'not_open'; end if;
  if p_starts_at is null or not isfinite(p_starts_at) or p_starts_at <= now() then return 'past_date'; end if;
  if p_title is null or char_length(btrim(p_title)) not between 3 and 100
    or p_description is null or char_length(btrim(p_description)) not between 10 and 1000
    or char_length(coalesce(p_objectives, '')) > 500
    or char_length(coalesce(p_prerequisites, '')) > 500
    or p_duration_minutes is null or p_duration_minutes not between 15 and 480
    or p_format is null or p_format not in ('in_person', 'online')
    or p_venue is null or char_length(btrim(p_venue)) not between 2 and 200
    or (p_capacity is not null and p_capacity not between 1 and 500)
    or (p_registration_deadline is not null and
      (not isfinite(p_registration_deadline) or p_registration_deadline > p_starts_at))
  then return 'invalid_input'; end if;
  if p_skill_id is null or not exists (select 1 from public.skills where id = p_skill_id)
    then return 'invalid_skill'; end if;
  -- register_for_session locks this same session row before counting seats.
  select count(*) into v_count from public.group_session_registrations where session_id = p_session_id;
  if p_capacity is not null and p_capacity < v_count then return 'capacity_too_low'; end if;
  update public.group_sessions set title = btrim(p_title), skill_id = p_skill_id,
    description = btrim(p_description), objectives = nullif(btrim(p_objectives), ''),
    prerequisites = nullif(btrim(p_prerequisites), ''), starts_at = p_starts_at,
    duration_minutes = p_duration_minutes, format = p_format, venue = btrim(p_venue),
    capacity = p_capacity, registration_deadline = p_registration_deadline
    where id = p_session_id and organizer_id = v_user;
  return 'ok';
end;
$$;

create or replace function public.cancel_group_session(p_session_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_session public.group_sessions%rowtype;
begin
  if v_user is null then return 'not_logged_in'; end if;
  select * into v_session from public.group_sessions where id = p_session_id for update;
  if not found then return 'not_found'; end if;
  if v_session.organizer_id <> v_user then return 'not_organizer'; end if;
  if v_session.status <> 'published' then return 'not_open'; end if;
  update public.group_sessions set status = 'cancelled' where id = p_session_id;
  return 'ok';
end;
$$;

-- All updates now go through functions, including capacity/status changes.
revoke update on public.group_sessions from public, anon, authenticated;
drop policy if exists "Organizers can update their own sessions" on public.group_sessions;
drop policy if exists "Students can create their own sessions" on public.group_sessions;
create policy "Students can create their own sessions"
  on public.group_sessions for insert to authenticated
  with check (organizer_id = (select auth.uid()) and status = 'published'
    and isfinite(starts_at) and starts_at > now()
    and (registration_deadline is null or
      (isfinite(registration_deadline) and registration_deadline <= starts_at)));
revoke execute on function public.complete_group_session(uuid) from public, anon;
grant execute on function public.complete_group_session(uuid) to authenticated;
revoke execute on function public.update_group_session(uuid, text, bigint, text, text, text, timestamptz, int, text, text, int, timestamptz) from public, anon;
grant execute on function public.update_group_session(uuid, text, bigint, text, text, text, timestamptz, int, text, text, int, timestamptz) to authenticated;
revoke execute on function public.cancel_group_session(uuid) from public, anon;
grant execute on function public.cancel_group_session(uuid) to authenticated;

-- Prompt 5: private in-app notifications created by real database events.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (char_length(type) between 1 and 80),
  title text not null check (char_length(title) between 1 and 160),
  body text check (char_length(body) <= 1000),
  link text check (char_length(link) <= 300 and link ~ '^/[a-zA-Z0-9/_?=&%.-]*$' and link !~ '^//'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_read_created_idx
  on public.notifications(recipient_id, read_at, created_at desc);
create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);
alter table public.notifications enable row level security;
drop policy if exists "Students can read their own notifications" on public.notifications;
create policy "Students can read their own notifications"
  on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
drop policy if exists "Students can mark their own notifications read" on public.notifications;
create policy "Students can mark their own notifications read"
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.create_notification(
  p_recipient uuid, p_type text, p_title text, p_body text, p_link text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_recipient is null then return; end if;
  -- Explicit receipts: registration confirms to the learner; completion goes to both.
  if p_recipient = auth.uid() and p_type not in ('group_registration_confirmed', 'exchange_completed') then return; end if;
  insert into public.notifications(recipient_id, type, title, body, link)
    values (p_recipient, p_type, p_title, p_body, p_link);
end;
$$;
revoke execute on function public.create_notification(uuid, text, text, text, text) from public, anon, authenticated;

create or replace function public.notify_exchange_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_link text := '/exchanges/' || new.id::text;
begin
  if tg_op = 'INSERT' then
    select left(display_name, 120) into v_name from public.profiles where id = new.requester_id;
    perform public.create_notification(new.recipient_id, 'exchange_requested', 'New exchange request', coalesce(v_name, 'A student') || ' wants to swap skills with you.', v_link);
  elsif old.status is distinct from new.status then
    if new.status in ('accepted', 'declined') then
      perform public.create_notification(new.requester_id, 'exchange_' || new.status,
        case when new.status = 'accepted' then 'Request accepted' else 'Request declined' end,
        'Your exchange request was ' || new.status || '.', v_link);
    elsif new.status = 'cancelled' then
      perform public.create_notification(new.requester_id, 'exchange_cancelled', 'Exchange cancelled', 'This exchange has been cancelled.', v_link);
      perform public.create_notification(new.recipient_id, 'exchange_cancelled', 'Exchange cancelled', 'This exchange has been cancelled.', v_link);
    elsif new.status = 'completed' then
      perform public.create_notification(new.requester_id, 'exchange_completed', 'Exchange completed', 'Both students have confirmed completion.', v_link);
      perform public.create_notification(new.recipient_id, 'exchange_completed', 'Exchange completed', 'Both students have confirmed completion.', v_link);
    end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_exchange_change() from public, anon, authenticated;
drop trigger if exists exchange_notification on public.exchange_requests;
create trigger exchange_notification after insert or update of status on public.exchange_requests
  for each row execute function public.notify_exchange_change();

create or replace function public.notify_exchange_session_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_exchange public.exchange_requests%rowtype;
  v_type text;
  v_title text;
begin
  if tg_op = 'INSERT' then
    v_type := 'exchange_session_scheduled'; v_title := 'Session scheduled';
  elsif new.status = 'cancelled' and old.status is distinct from new.status then
    v_type := 'exchange_session_cancelled'; v_title := 'Session cancelled';
  elsif new.status = 'scheduled' and old.starts_at is distinct from new.starts_at then
    v_type := 'exchange_session_rescheduled'; v_title := 'Session rescheduled';
  else return new; end if;
  select * into v_exchange from public.exchange_requests where id = new.exchange_id;
  perform public.create_notification(v_exchange.requester_id, v_type, v_title, 'Open your exchange to see the session details.', '/exchanges/' || new.exchange_id::text);
  perform public.create_notification(v_exchange.recipient_id, v_type, v_title, 'Open your exchange to see the session details.', '/exchanges/' || new.exchange_id::text);
  return new;
end;
$$;
revoke execute on function public.notify_exchange_session_change() from public, anon, authenticated;
drop trigger if exists exchange_session_notification on public.exchange_sessions;
create trigger exchange_session_notification after insert or update of starts_at, status on public.exchange_sessions
  for each row execute function public.notify_exchange_session_change();

create or replace function public.notify_group_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_session public.group_sessions%rowtype;
  v_link text := '/sessions/' || new.session_id::text;
begin
  select * into v_session from public.group_sessions where id = new.session_id;
  perform public.create_notification(new.profile_id, 'group_registration_confirmed', 'You''re registered', 'You registered for ' || v_session.title || '.', v_link);
  perform public.create_notification(v_session.organizer_id, 'group_registration_added', 'New registration for ' || v_session.title, 'A student has registered for your session.', v_link);
  return new;
end;
$$;
revoke execute on function public.notify_group_registration() from public, anon, authenticated;
drop trigger if exists group_registration_notification on public.group_session_registrations;
create trigger group_registration_notification after insert on public.group_session_registrations
  for each row execute function public.notify_group_registration();

create or replace function public.notify_group_session_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_type text;
  v_title text;
  v_recipient uuid;
begin
  if old.status is distinct from new.status and new.status = 'cancelled' then
    v_type := 'group_session_cancelled'; v_title := 'Session cancelled';
  elsif old.status is distinct from new.status and new.status = 'completed' then
    v_type := 'group_session_completed'; v_title := 'Session completed — share your feedback';
  elsif old.status = 'published' and new.status = 'published' and (
    old.starts_at is distinct from new.starts_at or old.venue is distinct from new.venue
    or old.format is distinct from new.format or old.registration_deadline is distinct from new.registration_deadline
  ) then
    v_type := 'group_session_updated'; v_title := 'Session details updated';
  else return new; end if;
  for v_recipient in select profile_id from public.group_session_registrations where session_id = new.id loop
    perform public.create_notification(v_recipient, v_type, v_title, new.title, '/sessions/' || new.id::text);
  end loop;
  return new;
end;
$$;
revoke execute on function public.notify_group_session_change() from public, anon, authenticated;
drop trigger if exists group_session_notification on public.group_sessions;
create trigger group_session_notification after update of status, starts_at, venue, format, registration_deadline on public.group_sessions
  for each row execute function public.notify_group_session_change();

-- Prompt 7: public profile photos, private write access to each user's folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- storage.objects already has RLS enabled by Supabase Storage.
drop policy if exists "Public avatar photos" on storage.objects;
create policy "Public avatar photos" on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars');
drop policy if exists "Students upload their own avatar" on storage.objects;
create policy "Students upload their own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Students update their own avatar" on storage.objects;
create policy "Students update their own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Students delete their own avatar" on storage.objects;
create policy "Students delete their own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

grant select on storage.objects to anon;
grant select, insert, update, delete on storage.objects to authenticated;

-- Prompt 8: exchange conversations and organizer announcements (no Realtime).
create table if not exists public.exchange_messages (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchange_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create table if not exists public.exchange_message_reads (
  exchange_id uuid not null references public.exchange_requests(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (exchange_id, profile_id)
);
create table if not exists public.session_announcements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.group_sessions(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists exchange_messages_thread_idx on public.exchange_messages(exchange_id, created_at desc, id desc);
create index if not exists exchange_messages_sender_idx on public.exchange_messages(sender_id);
create index if not exists exchange_message_reads_profile_idx on public.exchange_message_reads(profile_id);
create index if not exists session_announcements_feed_idx on public.session_announcements(session_id, created_at desc, id desc);
create index if not exists session_announcements_author_idx on public.session_announcements(author_id);
alter table public.exchange_messages enable row level security;
alter table public.exchange_message_reads enable row level security;
alter table public.session_announcements enable row level security;

drop policy if exists "Participants read messages" on public.exchange_messages;
create policy "Participants read messages" on public.exchange_messages for select to authenticated
  using (exists (select 1 from public.exchange_requests e where e.id = exchange_id and (select auth.uid()) in (e.requester_id, e.recipient_id)));
drop policy if exists "Participants send messages" on public.exchange_messages;
create policy "Participants send messages" on public.exchange_messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and exists (select 1 from public.exchange_requests e where e.id = exchange_id
    and (select auth.uid()) in (e.requester_id, e.recipient_id) and e.status in ('pending','accepted','scheduled','completed')));
drop policy if exists "Read own conversation receipts" on public.exchange_message_reads;
create policy "Read own conversation receipts" on public.exchange_message_reads for select to authenticated
  using (profile_id = (select auth.uid()));
drop policy if exists "Insert own conversation receipts" on public.exchange_message_reads;
create policy "Insert own conversation receipts" on public.exchange_message_reads for insert to authenticated
  with check (profile_id = (select auth.uid()) and exists (select 1 from public.exchange_requests e where e.id = exchange_id and (select auth.uid()) in (e.requester_id,e.recipient_id)));
drop policy if exists "Update own conversation receipts" on public.exchange_message_reads;
create policy "Update own conversation receipts" on public.exchange_message_reads for update to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
drop policy if exists "Attendees read announcements" on public.session_announcements;
create policy "Attendees read announcements" on public.session_announcements for select to authenticated
  using (exists (select 1 from public.group_sessions s where s.id = session_id and s.organizer_id = (select auth.uid()))
    or exists (select 1 from public.group_session_registrations r where r.session_id = session_announcements.session_id and r.profile_id = (select auth.uid())));
drop policy if exists "Organizers post announcements" on public.session_announcements;
create policy "Organizers post announcements" on public.session_announcements for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (select 1 from public.group_sessions s where s.id = session_id
    and s.organizer_id = (select auth.uid()) and s.status = 'published'));
revoke all on public.exchange_messages, public.exchange_message_reads, public.session_announcements from public, anon, authenticated;
grant select, insert on public.exchange_messages, public.session_announcements to authenticated;
grant select, insert on public.exchange_message_reads to authenticated;
grant update (last_read_at) on public.exchange_message_reads to authenticated;

-- Parent row locks serialize sending with cancellation and notification deduplication.
create or replace function public.guard_exchange_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_exchange public.exchange_requests%rowtype;
begin
  select * into v_exchange from public.exchange_requests where id = new.exchange_id for update;
  if auth.uid() is null or new.sender_id <> auth.uid()
    or auth.uid() not in (v_exchange.requester_id,v_exchange.recipient_id)
    or v_exchange.id is null or v_exchange.status not in ('pending','accepted','scheduled','completed') then
    raise exception 'Messaging is not available' using errcode = '42501';
  end if;
  new.body := btrim(new.body);
  new.created_at := clock_timestamp();
  return new;
end;
$$;
revoke execute on function public.guard_exchange_message() from public, anon, authenticated;
drop trigger if exists guard_exchange_message on public.exchange_messages;
create trigger guard_exchange_message before insert on public.exchange_messages for each row execute function public.guard_exchange_message();

create or replace function public.notify_exchange_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_recipient uuid; v_link text := '/messages/' || new.exchange_id::text;
begin
  select case when requester_id = new.sender_id then recipient_id else requester_id end into v_recipient
    from public.exchange_requests where id = new.exchange_id;
  if not exists (select 1 from public.notifications where recipient_id = v_recipient and type = 'exchange_message' and link = v_link and read_at is null) then
    perform public.create_notification(v_recipient, 'exchange_message', 'New message', 'Your exchange partner sent you a message.', v_link);
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_exchange_message() from public, anon, authenticated;
drop trigger if exists notify_exchange_message on public.exchange_messages;
create trigger notify_exchange_message after insert on public.exchange_messages for each row execute function public.notify_exchange_message();

create or replace function public.guard_session_announcement()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_session public.group_sessions%rowtype;
begin
  select * into v_session from public.group_sessions where id = new.session_id for update;
  if auth.uid() is null or new.author_id <> auth.uid() or v_session.id is null
    or v_session.organizer_id <> auth.uid() or v_session.status <> 'published' then
    raise exception 'Only the organizer of a published session may post' using errcode = '42501';
  end if;
  new.body := btrim(new.body);
  new.created_at := clock_timestamp();
  return new;
end;
$$;
revoke execute on function public.guard_session_announcement() from public, anon, authenticated;
drop trigger if exists guard_session_announcement on public.session_announcements;
create trigger guard_session_announcement before insert on public.session_announcements for each row execute function public.guard_session_announcement();

create or replace function public.notify_session_announcement()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_name text; v_student uuid;
begin
  select display_name into v_name from public.profiles where id = new.author_id;
  for v_student in select profile_id from public.group_session_registrations where session_id = new.session_id loop
    perform public.create_notification(v_student, 'session_announcement', left('Announcement from ' || coalesce(v_name,'the organizer'),160),
      'Open the session to read the update.', '/sessions/' || new.session_id::text);
  end loop;
  return new;
end;
$$;
revoke execute on function public.notify_session_announcement() from public, anon, authenticated;
drop trigger if exists notify_session_announcement on public.session_announcements;
create trigger notify_session_announcement after insert on public.session_announcements for each row execute function public.notify_session_announcement();

-- Mark only messages actually loaded; a later arriving message stays unread.
create or replace function public.mark_exchange_read(p_exchange_id uuid, p_through timestamptz)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (select 1 from public.exchange_requests where id = p_exchange_id and auth.uid() in (requester_id,recipient_id)) then return 'not_allowed'; end if;
  if p_through is null or p_through > clock_timestamp() then return 'invalid_time'; end if;
  insert into public.exchange_message_reads(exchange_id,profile_id,last_read_at) values (p_exchange_id,auth.uid(),p_through)
    on conflict (exchange_id,profile_id) do update set last_read_at = greatest(public.exchange_message_reads.last_read_at,excluded.last_read_at);
  return 'ok';
end;
$$;
revoke execute on function public.mark_exchange_read(uuid,timestamptz) from public, anon;
grant execute on function public.mark_exchange_read(uuid,timestamptz) to authenticated;

-- Security invoker: the caller's RLS still applies to every joined table.
create or replace function public.list_exchange_conversations(p_offset integer default 0)
returns table(exchange_id uuid,other_name text,last_body text,activity_at timestamptz,unread boolean)
language sql stable security invoker set search_path = '' as $$
  select e.id, p.display_name, m.body, coalesce(m.created_at,e.created_at),
    coalesce(m.sender_id <> auth.uid() and (r.last_read_at is null or m.created_at > r.last_read_at),false)
  from public.exchange_requests e
  join public.profiles p on p.id = case when e.requester_id = auth.uid() then e.recipient_id else e.requester_id end
  left join lateral (select body,created_at,sender_id from public.exchange_messages where exchange_id = e.id order by created_at desc,id desc limit 1) m on true
  left join public.exchange_message_reads r on r.exchange_id = e.id and r.profile_id = auth.uid()
  where auth.uid() in (e.requester_id,e.recipient_id) and e.status in ('pending','accepted','scheduled','completed')
  order by coalesce(m.created_at,e.created_at) desc,e.id desc
  limit 31 offset greatest(0,least(coalesce(p_offset,0),300000));
$$;
revoke execute on function public.list_exchange_conversations(integer) from public, anon;
grant execute on function public.list_exchange_conversations(integer) to authenticated;

-- Prompt 9: separate exchange reviews, group feedback, and private reports.
create table if not exists public.exchange_reviews (
  id uuid primary key default gen_random_uuid(),
  exchange_id uuid not null references public.exchange_requests(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (exchange_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);
create table if not exists public.group_session_feedback (
  session_id uuid not null references public.group_sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  helpful boolean not null,
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  primary key (session_id, profile_id)
);
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('exchange_review','session_feedback','forum_post','forum_comment','session')),
  target_id text not null check (char_length(target_id) between 1 and 100),
  reason text not null check (char_length(btrim(reason)) between 5 and 500),
  status text not null default 'open' check (status in ('open','reviewed','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists exchange_reviews_reviewee_created_idx on public.exchange_reviews(reviewee_id, created_at desc, id desc);
create index if not exists exchange_reviews_reviewer_idx on public.exchange_reviews(reviewer_id);
create index if not exists group_feedback_session_created_idx on public.group_session_feedback(session_id, created_at desc, profile_id desc);
create index if not exists group_feedback_profile_idx on public.group_session_feedback(profile_id);
create index if not exists reports_reporter_idx on public.reports(reporter_id);
create index if not exists reports_status_created_idx on public.reports(status, created_at desc);
alter table public.exchange_reviews enable row level security;
alter table public.group_session_feedback enable row level security;
alter table public.reports enable row level security;
drop policy if exists "Students read exchange reviews" on public.exchange_reviews;
create policy "Students read exchange reviews" on public.exchange_reviews for select to authenticated using (true);
drop policy if exists "Students read session feedback" on public.group_session_feedback;
create policy "Students read session feedback" on public.group_session_feedback for select to authenticated using (true);
drop policy if exists "Students read own reports" on public.reports;
create policy "Students read own reports" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
drop policy if exists "Students submit own reports" on public.reports;
create policy "Students submit own reports" on public.reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');
revoke all on public.exchange_reviews, public.group_session_feedback, public.reports from public, anon, authenticated;
grant select on public.exchange_reviews, public.group_session_feedback to authenticated;
grant select, insert on public.reports to authenticated;

create or replace function public.submit_exchange_review(p_exchange_id uuid, p_rating integer, p_comment text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_exchange public.exchange_requests%rowtype; v_comment text := nullif(btrim(p_comment),'');
begin
  if v_user is null then return 'not_authenticated'; end if;
  if p_rating is null or p_rating not between 1 and 5 or char_length(v_comment) > 500 then return 'invalid_input'; end if;
  select * into v_exchange from public.exchange_requests where id = p_exchange_id for update;
  if not found then return 'not_found'; end if;
  if v_user not in (v_exchange.requester_id,v_exchange.recipient_id) then return 'not_allowed'; end if;
  if v_exchange.status <> 'completed' then return 'not_completed'; end if;
  insert into public.exchange_reviews(exchange_id,reviewer_id,reviewee_id,rating,comment)
    values (p_exchange_id,v_user,case when v_user = v_exchange.requester_id then v_exchange.recipient_id else v_exchange.requester_id end,p_rating,v_comment)
    on conflict (exchange_id,reviewer_id) do nothing;
  if not found then return 'already_reviewed'; end if;
  return 'ok';
end;
$$;
revoke execute on function public.submit_exchange_review(uuid,integer,text) from public, anon;
grant execute on function public.submit_exchange_review(uuid,integer,text) to authenticated;

create or replace function public.submit_session_feedback(p_session_id uuid, p_rating integer, p_helpful boolean, p_comment text)
returns text language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_session public.group_sessions%rowtype; v_comment text := nullif(btrim(p_comment),'');
begin
  if v_user is null then return 'not_authenticated'; end if;
  if p_rating is null or p_rating not between 1 and 5 or p_helpful is null or char_length(v_comment) > 500 then return 'invalid_input'; end if;
  select * into v_session from public.group_sessions where id = p_session_id for update;
  if not found then return 'not_found'; end if;
  if v_session.organizer_id = v_user then return 'is_organizer'; end if;
  if v_session.status <> 'completed' then return 'not_completed'; end if;
  if not exists (select 1 from public.group_session_registrations where session_id = p_session_id and profile_id = v_user) then return 'not_registered'; end if;
  insert into public.group_session_feedback(session_id,profile_id,rating,helpful,comment)
    values (p_session_id,v_user,p_rating,p_helpful,v_comment) on conflict (session_id,profile_id) do nothing;
  if not found then return 'already_submitted'; end if;
  return 'ok';
end;
$$;
revoke execute on function public.submit_session_feedback(uuid,integer,boolean,text) from public, anon;
grant execute on function public.submit_session_feedback(uuid,integer,boolean,text) to authenticated;

create or replace function public.notify_exchange_review()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.create_notification(new.reviewee_id,'exchange_review','New review','Your exchange partner shared feedback.','/exchanges/' || new.exchange_id::text);
  return new;
end;
$$;
revoke execute on function public.notify_exchange_review() from public, anon, authenticated;
drop trigger if exists notify_exchange_review on public.exchange_reviews;
create trigger notify_exchange_review after insert on public.exchange_reviews for each row execute function public.notify_exchange_review();

create or replace function public.get_rating_summary(p_profile_id uuid)
returns table(average numeric,review_count bigint) language sql stable security invoker set search_path = '' as $$
  select avg(rating)::numeric,count(*) from public.exchange_reviews where reviewee_id = p_profile_id;
$$;
revoke execute on function public.get_rating_summary(uuid) from public, anon;
grant execute on function public.get_rating_summary(uuid) to authenticated;

create or replace function public.get_session_feedback_summary(p_session_id uuid)
returns table(average numeric,review_count bigint) language sql stable security invoker set search_path = '' as $$
  select avg(rating)::numeric,count(*) from public.group_session_feedback where session_id = p_session_id;
$$;
revoke execute on function public.get_session_feedback_summary(uuid) from public, anon;
grant execute on function public.get_session_feedback_summary(uuid) to authenticated;

-- Prompt 10: learning forum posts, replies, and reply notifications.
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('programming','design','academics','career','creative','resources','general')),
  title text not null check (char_length(btrim(title)) between 5 and 120),
  body text not null check (char_length(btrim(body)) between 10 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists forum_posts_category_created_idx on public.forum_posts(category, created_at desc, id desc);
create index if not exists forum_posts_author_created_idx on public.forum_posts(author_id, created_at desc, id desc);
create index if not exists forum_posts_created_idx on public.forum_posts(created_at desc, id desc);
create index if not exists forum_comments_post_created_idx on public.forum_comments(post_id, created_at, id);
create index if not exists forum_comments_author_idx on public.forum_comments(author_id);
alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;
drop policy if exists "Students read forum posts" on public.forum_posts;
create policy "Students read forum posts" on public.forum_posts for select to authenticated using (true);
drop policy if exists "Students create own forum posts" on public.forum_posts;
create policy "Students create own forum posts" on public.forum_posts for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors update forum posts" on public.forum_posts;
create policy "Authors update forum posts" on public.forum_posts for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "Authors delete forum posts" on public.forum_posts;
create policy "Authors delete forum posts" on public.forum_posts for delete to authenticated using (author_id = (select auth.uid()));
drop policy if exists "Students read forum replies" on public.forum_comments;
create policy "Students read forum replies" on public.forum_comments for select to authenticated using (true);
drop policy if exists "Students create own forum replies" on public.forum_comments;
create policy "Students create own forum replies" on public.forum_comments for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists "Authors update forum replies" on public.forum_comments;
create policy "Authors update forum replies" on public.forum_comments for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists "Authors delete forum replies" on public.forum_comments;
create policy "Authors delete forum replies" on public.forum_comments for delete to authenticated using (author_id = (select auth.uid()));
revoke all on public.forum_posts, public.forum_comments from public, anon, authenticated;
grant select, insert, delete on public.forum_posts, public.forum_comments to authenticated;
-- Authors can edit content but cannot change ownership, IDs, parent posts, or timestamps.
grant update (title, category, body) on public.forum_posts to authenticated;
grant update (body) on public.forum_comments to authenticated;

create or replace function public.stamp_forum_post()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.title := btrim(new.title);
  new.body := btrim(new.body);
  if tg_op = 'INSERT' then
    new.created_at := clock_timestamp();
    new.updated_at := new.created_at;
  else
    new.updated_at := clock_timestamp();
  end if;
  return new;
end;
$$;
revoke execute on function public.stamp_forum_post() from public, anon, authenticated;
drop trigger if exists stamp_forum_post on public.forum_posts;
create trigger stamp_forum_post before insert or update on public.forum_posts for each row execute function public.stamp_forum_post();

create or replace function public.stamp_forum_comment()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.body := btrim(new.body);
  new.created_at := clock_timestamp();
  return new;
end;
$$;
revoke execute on function public.stamp_forum_comment() from public, anon, authenticated;
drop trigger if exists stamp_forum_comment on public.forum_comments;
create trigger stamp_forum_comment before insert on public.forum_comments for each row execute function public.stamp_forum_comment();

create or replace function public.notify_forum_reply()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_author uuid; v_title text;
begin
  select author_id,title into v_author,v_title from public.forum_posts where id = new.post_id;
  if v_author is not null and v_author <> new.author_id then
    perform public.create_notification(v_author,'forum_reply','New reply to your post',v_title,'/forum/' || new.post_id::text);
  end if;
  return new;
end;
$$;
revoke execute on function public.notify_forum_reply() from public, anon, authenticated;
drop trigger if exists notify_forum_reply on public.forum_comments;
create trigger notify_forum_reply after insert on public.forum_comments for each row execute function public.notify_forum_reply();
