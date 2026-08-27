-- THE ONE SPACE 보험사 담당자 관리자 편집 권한
-- Supabase SQL Editor에서 전체 실행해 주세요.

alter table public.insurance_manager_contacts enable row level security;

drop policy if exists "admins can add insurance manager contacts"
on public.insurance_manager_contacts;
create policy "admins can add insurance manager contacts"
on public.insurance_manager_contacts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and p.role = 'admin'
  )
);

drop policy if exists "admins can edit insurance manager contacts"
on public.insurance_manager_contacts;
create policy "admins can edit insurance manager contacts"
on public.insurance_manager_contacts
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and p.role = 'admin'
  )
);

drop policy if exists "admins can delete insurance manager contacts"
on public.insurance_manager_contacts;
create policy "admins can delete insurance manager contacts"
on public.insurance_manager_contacts
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and p.role = 'admin'
  )
);
