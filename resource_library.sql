-- THE ONE SPACE 자료실 설치 SQL
-- Supabase SQL Editor에서 이 파일 전체를 한 번 실행하세요.

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null default '기타',
  tags text[] not null default '{}',
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  uploader_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_files (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  file_name text not null,
  file_path text not null unique,
  file_type text,
  file_size bigint not null default 0,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;
alter table public.resource_files enable row level security;

drop policy if exists "approved users read resources" on public.resources;
drop policy if exists "approved users create resources" on public.resources;
drop policy if exists "owner or admin updates resources" on public.resources;
drop policy if exists "admin deletes resources" on public.resources;
drop policy if exists "approved users read resource files" on public.resource_files;
drop policy if exists "approved users create resource files" on public.resource_files;
drop policy if exists "admin deletes resource files" on public.resource_files;

create policy "approved users read resources" on public.resources for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved'));
create policy "approved users create resources" on public.resources for insert to authenticated
with check (uploaded_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved'));
create policy "owner or admin updates resources" on public.resources for update to authenticated
using (uploaded_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'))
with check (uploaded_by = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));
create policy "admin deletes resources" on public.resources for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));

create policy "approved users read resource files" on public.resource_files for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved'));
create policy "approved users create resource files" on public.resource_files for insert to authenticated
with check (uploaded_by = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved'));
create policy "admin deletes resource files" on public.resource_files for delete to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));

insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do update set public = false;

drop policy if exists "approved users read resources storage" on storage.objects;
drop policy if exists "users upload own resources storage" on storage.objects;
drop policy if exists "admins delete resources storage" on storage.objects;

create policy "approved users read resources storage" on storage.objects for select to authenticated
using (bucket_id = 'resources' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.status = 'approved'));
create policy "users upload own resources storage" on storage.objects for insert to authenticated
with check (bucket_id = 'resources' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "admins delete resources storage" on storage.objects for delete to authenticated
using (bucket_id = 'resources' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin' and p.status = 'approved'));
