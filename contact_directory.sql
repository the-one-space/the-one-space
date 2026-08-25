-- THE ONE SPACE 지점원 연락처
-- 회원가입 전화번호 자동 연동 포함
-- Supabase SQL Editor에서 전체 실행해 주세요.

create extension if not exists pgcrypto;

alter table public.profiles
add column if not exists phone text;

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null check (position in ('지점장', '이사', '팀장', 'MP', '비서')),
  phone text not null,
  memo text,
  profile_id uuid references public.profiles(id) on delete cascade,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contacts
add column if not exists profile_id uuid references public.profiles(id) on delete cascade;

alter table public.contacts
alter column created_by drop not null;

create unique index if not exists contacts_profile_id_unique_idx
on public.contacts(profile_id)
where profile_id is not null;

create index if not exists contacts_position_name_idx
on public.contacts(position, name);

alter table public.contacts enable row level security;

drop policy if exists "approved users can view contacts" on public.contacts;
create policy "approved users can view contacts"
on public.contacts for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  )
);

drop policy if exists "admins and assistants can add contacts" on public.contacts;
create policy "admins and assistants can add contacts"
on public.contacts for insert
to authenticated
with check (
  exists (
    select 1 from public.profiles p
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
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'admin' or p.position = '비서')
  )
)
with check (
  exists (
    select 1 from public.profiles p
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
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'admin' or p.position = '비서')
  )
);

-- 회원가입 정보로 프로필 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, name, email, position, phone, role, status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'position', 'MP'),
    nullif(new.raw_user_meta_data->>'phone', ''),
    'staff',
    'pending'
  )
  on conflict (id) do update set
    name = excluded.name,
    email = excluded.email,
    position = excluded.position,
    phone = coalesce(excluded.phone, public.profiles.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 승인된 프로필을 연락처와 자동 동기화
create or replace function public.sync_profile_to_contacts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and nullif(trim(new.phone), '') is not null then
    insert into public.contacts (
      name, position, phone, memo, profile_id, created_by, updated_at
    )
    values (
      new.name, new.position, new.phone, null, new.id, null, now()
    )
    on conflict (profile_id) where profile_id is not null
    do update set
      name = excluded.name,
      position = excluded.position,
      phone = excluded.phone,
      updated_at = now();
  else
    delete from public.contacts where profile_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_profile_contact on public.profiles;
create trigger sync_profile_contact
after insert or update of name, position, phone, status
on public.profiles
for each row execute function public.sync_profile_to_contacts();

-- 이미 승인된 기존 사용자 중 전화번호가 입력된 사람도 즉시 반영
insert into public.contacts (
  name, position, phone, memo, profile_id, created_by, updated_at
)
select
  p.name, p.position, p.phone, null, p.id, null, now()
from public.profiles p
where p.status = 'approved'
  and nullif(trim(p.phone), '') is not null
on conflict (profile_id) where profile_id is not null
do update set
  name = excluded.name,
  position = excluded.position,
  phone = excluded.phone,
  updated_at = now();
