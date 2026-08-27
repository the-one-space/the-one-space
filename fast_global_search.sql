-- THE ONE SPACE 빠른 통합검색
-- 기존 RLS 열람 권한을 그대로 적용합니다.
-- Supabase SQL Editor에서 전체 실행해 주세요.

create or replace function public.search_the_one(search_term text)
returns table (
  item_type text,
  item_id uuid,
  title text,
  subtitle text,
  sort_rank integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  normalized_query text;
begin
  normalized_query := lower(regexp_replace(coalesce(search_term, ''), '[[:space:]._,()\[\]{}\-/\\]+', '', 'g'));
  if normalized_query = '' then return; end if;

  return query
  with recording_search as (
    select
      r.id,
      r.short_title,
      r.owner_name,
      r.consultation_date,
      lower(regexp_replace(
        concat_ws(' ', r.short_title, r.details, r.owner_name, r.companion_name, r.consultation_date,
          coalesce((select string_agg(rf.file_name, ' ') from public.recording_files rf where rf.recording_id = r.id), '')
        ),
        '[[:space:]._,()\[\]{}\-/\\]+', '', 'g'
      )) as searchable,
      lower(regexp_replace(coalesce(r.short_title, ''), '[[:space:]._,()\[\]{}\-/\\]+', '', 'g')) as title_searchable,
      lower(regexp_replace(coalesce((select string_agg(rf.file_name, ' ') from public.recording_files rf where rf.recording_id = r.id), ''), '[[:space:]._,()\[\]{}\-/\\]+', '', 'g')) as file_searchable
    from public.recordings r
    where r.deleted_at is null
  ),
  combined as (
    select 'recording'::text as item_type, r.id as item_id,
      coalesce(r.short_title, '제목 없음')::text as title,
      concat_ws(' · ', nullif(r.owner_name, ''), nullif(r.consultation_date::text, ''))::text as subtitle,
      case when r.title_searchable like '%' || normalized_query || '%' then 0
           when r.file_searchable like '%' || normalized_query || '%' then 1 else 2 end as sort_rank
    from recording_search r
    where r.searchable like '%' || normalized_query || '%'

    union all

    select 'resource', x.id, x.title,
      concat_ws(' · ', nullif(x.category, ''), nullif(x.uploader_name, '')),
      case when lower(regexp_replace(coalesce(x.title, ''), '[[:space:]._,()\[\]{}\-/\\]+', '', 'g'))
                like '%' || normalized_query || '%' then 0 else 2 end
    from public.resources x
    where x.deleted_at is null
      and lower(regexp_replace(concat_ws(' ', x.title, x.description, x.category, x.uploader_name),
          '[[:space:]._,()\[\]{}\-/\\]+', '', 'g')) like '%' || normalized_query || '%'

    union all

    select 'notice', n.id, n.title,
      left(coalesce(n.content, ''), 70),
      case when lower(regexp_replace(coalesce(n.title, ''), '[[:space:]._,()\[\]{}\-/\\]+', '', 'g'))
                like '%' || normalized_query || '%' then 0 else 2 end
    from public.notices n
    where n.deleted_at is null
      and lower(regexp_replace(concat_ws(' ', n.title, n.content),
          '[[:space:]._,()\[\]{}\-/\\]+', '', 'g')) like '%' || normalized_query || '%'

    union all

    select 'contact', c.id, c.name,
      concat_ws(' · ', nullif(c.position, ''), nullif(c.phone, '')),
      case when lower(regexp_replace(coalesce(c.name, ''), '[[:space:]._,()\[\]{}\-/\\]+', '', 'g'))
                like '%' || normalized_query || '%' then 0 else 2 end
    from public.contacts c
    where lower(regexp_replace(concat_ws(' ', c.name, c.position, c.phone, c.memo),
          '[[:space:]._,()\[\]{}\-/\\]+', '', 'g')) like '%' || normalized_query || '%'
  )
  select c.item_type, c.item_id, c.title, c.subtitle, c.sort_rank
  from combined c
  order by c.sort_rank, c.title
  limit 30;
end;
$$;

revoke all on function public.search_the_one(text) from public;
grant execute on function public.search_the_one(text) to authenticated;

create index if not exists recording_files_recording_id_search_idx
on public.recording_files(recording_id);
