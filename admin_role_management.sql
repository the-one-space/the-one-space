-- THE ONE SPACE 관리자 권한 지정/해제
-- Supabase SQL Editor에서 전체 실행해 주세요.

create or replace function public.set_user_admin_role(
  target_user_id uuid,
  make_admin boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'approved'
      and p.role = 'admin'
  ) then
    raise exception '관리자만 권한을 변경할 수 있습니다.';
  end if;

  if target_user_id = auth.uid() then
    raise exception '현재 로그인한 본인의 관리자 권한은 변경할 수 없습니다.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = target_user_id
      and p.status = 'approved'
  ) then
    raise exception '승인된 직원만 관리자로 지정할 수 있습니다.';
  end if;

  update public.profiles
  set role = case when make_admin then 'admin' else 'staff' end
  where id = target_user_id;
end;
$$;

revoke all on function public.set_user_admin_role(uuid, boolean) from public;
grant execute on function public.set_user_admin_role(uuid, boolean) to authenticated;
