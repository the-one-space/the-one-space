-- THE ONE SPACE 회원가입 시 소속 팀장 선택 → 팀 자동 배정
-- Supabase SQL Editor에서 전체 실행해 주세요.

alter table public.profiles
add column if not exists team_no integer;

alter table public.contacts
add column if not exists team_no integer;

-- 예전 1~5팀 제한이 남아 있으면 제거
do $
declare
  constraint_row record;
begin
  for constraint_row in
    select conrelid::regclass as table_name, conname
    from pg_constraint
    where contype = 'c'
      and conrelid in ('public.profiles'::regclass, 'public.contacts'::regclass)
      and pg_get_constraintdef(oid) ilike '%team_no%'
  loop
    execute format(
      'alter table %s drop constraint %I',
      constraint_row.table_name,
      constraint_row.conname
    );
  end loop;
end;
$;

alter table public.profiles
add constraint profiles_team_no_1_to_6_check
check (team_no is null or team_no between 1 and 6);

alter table public.contacts
add constraint contacts_team_no_1_to_6_check
check (team_no is null or team_no between 1 and 6);

create or replace function public.assign_signup_team()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_team integer;
begin
  begin
    requested_team := nullif(new.raw_user_meta_data->>'team_no', '')::integer;
  exception when invalid_text_representation then
    requested_team := null;
  end;

  if requested_team between 1 and 6 then
    update public.profiles
    set team_no = requested_team
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists zz_assign_signup_team on auth.users;
create trigger zz_assign_signup_team
after insert on auth.users
for each row execute function public.assign_signup_team();
