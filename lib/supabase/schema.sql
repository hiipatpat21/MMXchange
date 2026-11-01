--skills
create table public.skills (
  id bigint generated always as identity primary key,
  name text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);

alter table public.skills enable row level security;

create policy "Skills are readable by everyone"
  on public.skills for select
  using (true);

grant usage on schema public to anon, authenticated;
grant select on public.skills to anon, authenticated;

insert into public.skills (name, category) values
  ('Python', 'Programming and technology'),
  ('Web Development', 'Programming and technology'),
  ('Graphic Design', 'Graphic design and digital art'),
  ('Video Editing', 'Video editing and photography'),
  ('Photography', 'Video editing and photography'),
  ('Blender', '3D modeling and animation'),
  ('Public Speaking', 'Writing and communication'),
  ('Guitar', 'Music and performing arts'),
  ('Entrepreneurship', 'Business and entrepreneurship'),
  ('Calculus', 'Academic subjects');



--profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  college text,
  program text,
  year_level smallint check (year_level between 1 and 6),
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Logged-in students can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Students can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

grant select, update on public.profiles to authenticated;

-- Auto-create a profile whenever someone signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


--pick skills
create table public.profile_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id bigint not null references public.skills (id) on delete cascade,
  kind text not null check (kind in ('teach', 'learn')),
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id)
);

create index profile_skills_skill_kind_idx
  on public.profile_skills (skill_id, kind);

alter table public.profile_skills enable row level security;

create policy "Logged-in students can view all profile skills"
  on public.profile_skills for select
  to authenticated
  using (true);

create policy "Students can add their own skills"
  on public.profile_skills for insert
  to authenticated
  with check (profile_id = (select auth.uid()));

create policy "Students can remove their own skills"
  on public.profile_skills for delete
  to authenticated
  using (profile_id = (select auth.uid()));

grant select, insert, delete on public.profile_skills to authenticated;

--group sessions
create table public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  skill_id bigint not null references public.skills (id),
  title text not null check (char_length(title) between 3 and 100),
  description text not null check (char_length(description) between 10 and 1000),
  objectives text check (char_length(objectives) <= 500),
  prerequisites text check (char_length(prerequisites) <= 500),
  starts_at timestamptz not null,
  duration_minutes int not null check (duration_minutes between 15 and 480),
  format text not null check (format in ('in_person', 'online')),
  venue text not null check (char_length(venue) between 2 and 200),
  capacity int check (capacity is null or capacity between 1 and 500),
  registration_deadline timestamptz,
  status text not null default 'published'
    check (status in ('published', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create index group_sessions_status_starts_idx
  on public.group_sessions (status, starts_at);
create index group_sessions_organizer_idx
  on public.group_sessions (organizer_id);

alter table public.group_sessions enable row level security;

create policy "Logged-in students can view sessions"
  on public.group_sessions for select
  to authenticated
  using (true);

create policy "Students can create their own sessions"
  on public.group_sessions for insert
  to authenticated
  with check (organizer_id = (select auth.uid()));

create policy "Organizers can update their own sessions"
  on public.group_sessions for update
  to authenticated
  using (organizer_id = (select auth.uid()))
  with check (organizer_id = (select auth.uid()));

grant select, insert, update on public.group_sessions to authenticated;

--registration limit
create table public.group_session_registrations (
  session_id uuid not null references public.group_sessions (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, profile_id)
);

create index group_session_registrations_profile_idx
  on public.group_session_registrations (profile_id);

alter table public.group_session_registrations enable row level security;

create policy "Students can view their own registrations"
  on public.group_session_registrations for select
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "Organizers can view registrations for their sessions"
  on public.group_session_registrations for select
  to authenticated
  using (
    exists (
      select 1 from public.group_sessions s
      where s.id = session_id and s.organizer_id = (select auth.uid())
    )
  );

create policy "Students can cancel their own registration before the session starts"
  on public.group_session_registrations for delete
  to authenticated
  using (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.group_sessions s
      where s.id = session_id and s.starts_at > now()
    )
  );

grant select, delete on public.group_session_registrations to authenticated;

-- Everyone can see COUNTS (not who registered)
create function public.registration_counts(p_session_ids uuid[])
returns table (session_id uuid, registered bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select r.session_id, count(*)
  from public.group_session_registrations r
  where r.session_id = any (p_session_ids)
  group by r.session_id;
$$;

-- The ONLY way to register
create function public.register_for_session(p_session_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session public.group_sessions%rowtype;
  v_count int;
begin
  if v_user is null then return 'not_logged_in'; end if;

  -- Lock this session row so simultaneous registrations take turns
  select * into v_session
  from public.group_sessions
  where id = p_session_id
  for update;

  if not found then return 'not_found'; end if;
  if v_session.status <> 'published' then return 'not_open'; end if;
  if v_session.organizer_id = v_user then return 'is_organizer'; end if;
  if v_session.starts_at <= now() then return 'closed'; end if;
  if v_session.registration_deadline is not null
     and v_session.registration_deadline <= now() then return 'closed'; end if;

  if exists (
    select 1 from public.group_session_registrations
    where session_id = p_session_id and profile_id = v_user
  ) then return 'already_registered'; end if;

  if v_session.capacity is not null then
    select count(*) into v_count
    from public.group_session_registrations
    where session_id = p_session_id;
    if v_count >= v_session.capacity then return 'full'; end if;
  end if;

  insert into public.group_session_registrations (session_id, profile_id)
  values (p_session_id, v_user);

  return 'ok';
end;
$$;

revoke execute on function public.register_for_session(uuid) from public, anon;
grant execute on function public.register_for_session(uuid) to authenticated;
revoke execute on function public.registration_counts(uuid[]) from public, anon;
grant execute on function public.registration_counts(uuid[]) to authenticated;