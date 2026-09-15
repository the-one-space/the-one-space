-- THE ONE SPACE 공지사항 첨부파일
-- Supabase SQL Editor에서 전체 실행해 주세요.

create extension if not exists pgcrypto;

create table if not exists public.notice_files (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  file_size bigint,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists notice_files_notice_id_idx
on public.notice_files(notice_id, created_at);

alter table public.notice_files enable row level security;

drop policy if exists "approved users can view notice files" on public.notice_files;
create policy "approved users can view notice files"
on public.notice_files for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'approved'
  )
);

drop policy if exists "notice managers can add notice files" on public.notice_files;
create policy "notice managers can add notice files"
on public.notice_files for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'admin' or p.position = '비서')
  )
);

drop policy if exists "notice managers can delete notice files" on public.notice_files;
create policy "notice managers can delete notice files"
on public.notice_files for delete
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and (p.role = 'admin' or p.position = '비서')
  )
);
