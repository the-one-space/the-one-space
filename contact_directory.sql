-- THE ONE SPACE 지점원 연락처
-- Supabase SQL Editor에서 전체 실행해 주세요.

create extension if not exists pgcrypto;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null check (position in ('지점장', '이사', '팀장', 'MP', '비서')),
  phone text not null,
  memo text,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

drop policy if exists "approved users can view contacts" on public.contacts;
create policy "approved users can view contacts"
on public.contacts for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
  )
);

drop policy if exists "admins and assistants can add contacts" on public.contacts;
create policy "admins and assistants can add contacts"
on public.contacts for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'admin' or p.position = '비서')
  )
);

drop policy if exists "admins and assistants can edit contacts" on public.contacts;
create policy "admins and assistants can edit contacts"
on public.contacts for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'admin' or p.position = '비서')
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'admin' or p.position = '비서')
  )
);

drop policy if exists "admins and assistants can delete contacts" on public.contacts;
create policy "admins and assistants can delete contacts"
on public.contacts for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'admin' or p.position = '비서')
  )
);

create index if not exists contacts_position_name_idx
on public.contacts(position, name);
