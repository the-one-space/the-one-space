-- THE ONE SPACE 회원가입 시 소속 팀장 선택 → 팀 자동 배정
-- Supabase SQL Editor에서 전체 실행해 주세요.

alter table public.profiles
add column if not exists team_no integer;

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
