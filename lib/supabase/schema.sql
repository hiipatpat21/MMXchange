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