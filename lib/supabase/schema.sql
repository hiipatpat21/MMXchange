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