create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  position text not null default 'MP',
  role text not null default 'staff' check (role in ('staff','admin')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "own profile select"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "own pending insert"
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'staff'
  and status = 'pending'
);
