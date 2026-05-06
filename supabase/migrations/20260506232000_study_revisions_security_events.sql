-- Study post revisions and security-relevant access logs.

create table if not exists public.study_record_revisions (
  id uuid primary key default gen_random_uuid(),
  study_record_id uuid not null references public.study_records (id) on delete cascade,
  project_team_id uuid references public.project_teams (id) on delete cascade,
  revision_number integer not null,
  edited_by uuid not null references public.profiles (id) on delete cascade,
  edited_at timestamptz not null default now(),
  old_title text,
  new_title text,
  old_body text,
  new_body text,
  old_duration_minutes integer,
  new_duration_minutes integer,
  old_visibility text,
  new_visibility text,
  old_content_json jsonb,
  new_content_json jsonb,
  old_image_urls text[] not null default '{}'::text[],
  new_image_urls text[] not null default '{}'::text[],
  metadata jsonb not null default '{}'::jsonb,
  unique (study_record_id, revision_number)
);

create index if not exists study_record_revisions_record_idx
  on public.study_record_revisions (study_record_id, revision_number desc);

create table if not exists public.security_event_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_login_id text,
  actor_email text,
  client_ip text,
  user_agent text,
  path text,
  referrer text,
  entity_table text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_event_logs_created_idx
  on public.security_event_logs (created_at desc);
create index if not exists security_event_logs_actor_idx
  on public.security_event_logs (actor_user_id, created_at desc);
create index if not exists security_event_logs_entity_idx
  on public.security_event_logs (entity_table, entity_id, created_at desc);

create or replace function public.current_request_headers()
returns jsonb
language plpgsql
stable
as $$
declare
  v_raw text := current_setting('request.headers', true);
begin
  if v_raw is null or btrim(v_raw) = '' then
    return '{}'::jsonb;
  end if;

  return v_raw::jsonb;
exception
  when others then
    return '{}'::jsonb;
end;
$$;

create or replace function public.current_request_client_ip()
returns text
language plpgsql
stable
as $$
declare
  v_headers jsonb := public.current_request_headers();
  v_forwarded text;
begin
  v_forwarded := coalesce(
    v_headers ->> 'x-forwarded-for',
    v_headers ->> 'X-Forwarded-For',
    v_headers ->> 'cf-connecting-ip',
    v_headers ->> 'CF-Connecting-IP',
    v_headers ->> 'x-real-ip',
    v_headers ->> 'X-Real-IP'
  );

  if v_forwarded is null or btrim(v_forwarded) = '' then
    return null;
  end if;

  return nullif(btrim(split_part(v_forwarded, ',', 1)), '');
end;
$$;

create or replace function public.current_request_user_agent()
returns text
language plpgsql
stable
as $$
declare
  v_headers jsonb := public.current_request_headers();
begin
  return nullif(btrim(coalesce(v_headers ->> 'user-agent', v_headers ->> 'User-Agent')), '');
end;
$$;

create or replace function public.record_security_event(
  p_event_type text,
  p_path text default null,
  p_entity_table text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_headers jsonb := public.current_request_headers();
  v_id uuid;
  v_event_type text := left(nullif(btrim(coalesce(p_event_type, '')), ''), 80);
  v_metadata jsonb := case
    when p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then '{}'::jsonb
    else p_metadata
  end;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '28000';
  end if;

  if v_event_type is null then
    raise exception '이벤트 종류가 필요합니다.' using errcode = '22023';
  end if;

  select *
    into v_profile
  from public.profiles
  where id = v_actor;

  insert into public.security_event_logs (
    event_type,
    actor_user_id,
    actor_login_id,
    actor_email,
    client_ip,
    user_agent,
    path,
    referrer,
    entity_table,
    entity_id,
    metadata
  )
  values (
    v_event_type,
    v_actor,
    v_profile.login_id,
    v_profile.email,
    public.current_request_client_ip(),
    public.current_request_user_agent(),
    nullif(left(coalesce(p_path, ''), 512), ''),
    nullif(left(coalesce(v_metadata ->> 'referrer', v_headers ->> 'referer', v_headers ->> 'Referer', ''), 512), ''),
    nullif(left(coalesce(p_entity_table, ''), 80), ''),
    p_entity_id,
    v_metadata
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.study_record_metadata_image_urls(p_metadata jsonb)
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(value), '{}'::text[])
  from jsonb_array_elements_text(
    case
      when jsonb_typeof(p_metadata -> 'imageUrls') = 'array' then p_metadata -> 'imageUrls'
      when jsonb_typeof(p_metadata -> 'image_urls') = 'array' then p_metadata -> 'image_urls'
      else '[]'::jsonb
    end
  ) as value;
$$;

create or replace function public.study_record_metadata_content_json(p_metadata jsonb)
returns jsonb
language sql
immutable
as $$
  select case
    when jsonb_typeof(p_metadata -> 'contentJson') = 'array' then p_metadata -> 'contentJson'
    when jsonb_typeof(p_metadata -> 'content_json') = 'array' then p_metadata -> 'content_json'
    else null
  end;
$$;

create or replace function public.update_study_record(
  p_record_id uuid,
  p_title text default null,
  p_body text default null,
  p_duration_minutes integer default null,
  p_image_urls text[] default '{}'::text[],
  p_content_json jsonb default null,
  p_visibility text default 'member'
)
returns public.study_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_old public.study_records;
  v_new public.study_records;
  v_revision_number integer;
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
  v_visibility text := lower(btrim(coalesce(p_visibility, 'member')));
  v_image_urls text[] := '{}'::text[];
  v_content_json jsonb := p_content_json;
  v_old_image_urls text[] := '{}'::text[];
  v_old_content_json jsonb;
  v_old_edit_count integer := 0;
  v_new_metadata jsonb;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '28000';
  end if;

  select *
    into v_old
  from public.study_records
  where id = p_record_id
  for update;

  if not found then
    raise exception '게시글을 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if (
    v_old.author_user_id <> v_actor
    and not public.current_user_has_permission('studies.manage')
    and not (
      v_old.project_team_id is not null
      and public.current_user_can_manage_project(v_old.project_team_id)
    )
  ) then
    raise exception '작성자 또는 프로젝트 관리자만 게시글을 수정할 수 있습니다.' using errcode = '42501';
  end if;

  if v_old.status = 'locked' and not public.current_user_has_permission('studies.manage') then
    raise exception '잠긴 게시글은 수정할 수 없습니다.' using errcode = '42501';
  end if;

  if v_title = '' then
    raise exception '게시글 제목을 입력해 주세요.' using errcode = '22023';
  end if;

  if char_length(v_title) > 120 then
    raise exception '게시글 제목은 120자 이하로 입력해 주세요.' using errcode = '22023';
  end if;

  if v_body is not null and char_length(v_body) > 40000 then
    raise exception '게시글 내용이 너무 깁니다.' using errcode = '22023';
  end if;

  if v_content_json is not null and jsonb_typeof(v_content_json) <> 'array' then
    raise exception '게시글 본문 형식이 올바르지 않습니다.' using errcode = '22023';
  end if;

  if v_content_json is not null and octet_length(v_content_json::text) > 1000000 then
    raise exception '게시글 본문 데이터가 너무 큽니다.' using errcode = '22023';
  end if;

  if p_duration_minutes is not null and (p_duration_minutes < 0 or p_duration_minutes > 1440) then
    raise exception '스터디 시간은 0분 이상 1440분 이하로 입력해 주세요.' using errcode = '22023';
  end if;

  if v_visibility not in ('self', 'project', 'member', 'public') then
    raise exception '지원하지 않는 공개 범위입니다.' using errcode = '22023';
  end if;

  select coalesce(array_agg(clean.url), '{}'::text[])
    into v_image_urls
  from (
    select distinct btrim(raw_url) as url
    from unnest(coalesce(p_image_urls, '{}'::text[])) as raw_url
    where btrim(raw_url) <> ''
    limit 30
  ) clean;

  if exists (
    select 1
    from unnest(v_image_urls) as image_url
    where image_url !~* '^https?://'
  ) then
    raise exception '이미지 주소는 http 또는 https URL이어야 합니다.' using errcode = '22023';
  end if;

  v_old_image_urls := public.study_record_metadata_image_urls(v_old.metadata);
  v_old_content_json := public.study_record_metadata_content_json(v_old.metadata);
  v_old_edit_count := case
    when coalesce(v_old.metadata ->> 'editCount', '') ~ '^\d+$'
      then (v_old.metadata ->> 'editCount')::integer
    else 0
  end;

  select coalesce(max(revision_number), 0) + 1
    into v_revision_number
  from public.study_record_revisions
  where study_record_id = v_old.id;

  insert into public.study_record_revisions (
    study_record_id,
    project_team_id,
    revision_number,
    edited_by,
    old_title,
    new_title,
    old_body,
    new_body,
    old_duration_minutes,
    new_duration_minutes,
    old_visibility,
    new_visibility,
    old_content_json,
    new_content_json,
    old_image_urls,
    new_image_urls,
    metadata
  )
  values (
    v_old.id,
    v_old.project_team_id,
    v_revision_number,
    v_actor,
    v_old.title,
    v_title,
    v_old.body,
    v_body,
    v_old.duration_minutes,
    p_duration_minutes,
    v_old.visibility,
    v_visibility,
    v_old_content_json,
    v_content_json,
    v_old_image_urls,
    v_image_urls,
    jsonb_build_object('source', 'update_study_record_rpc')
  );

  v_new_metadata :=
    v_old.metadata ||
    jsonb_strip_nulls(
      jsonb_build_object(
        'editor', case when v_content_json is null then null else 'blocknote' end,
        'contentJson', v_content_json,
        'imageUrls', to_jsonb(v_image_urls),
        'coverImageUrl', case when cardinality(v_image_urls) > 0 then v_image_urls[1] else null end,
        'editCount', v_old_edit_count + 1,
        'lastEditedAt', now(),
        'lastEditedBy', v_actor
      )
    );

  update public.study_records
  set
    title = v_title,
    body = v_body,
    duration_minutes = p_duration_minutes,
    visibility = v_visibility,
    metadata = v_new_metadata
  where id = v_old.id
  returning * into v_new;

  perform public.create_audit_log(
    'study.record.update',
    v_actor,
    v_new.project_team_id,
    null,
    'study_records',
    v_new.id,
    jsonb_build_object(
      'title', v_old.title,
      'visibility', v_old.visibility,
      'durationMinutes', v_old.duration_minutes,
      'imageCount', cardinality(v_old_image_urls)
    ),
    jsonb_build_object(
      'title', v_new.title,
      'visibility', v_new.visibility,
      'durationMinutes', v_new.duration_minutes,
      'imageCount', cardinality(v_image_urls),
      'revisionNumber', v_revision_number
    ),
    null,
    jsonb_build_object('source', 'update_study_record_rpc')
  );

  perform public.record_security_event(
    'study.record.update',
    null,
    'study_records',
    v_new.id,
    jsonb_build_object(
      'projectTeamId', v_new.project_team_id,
      'revisionNumber', v_revision_number,
      'oldVisibility', v_old.visibility,
      'newVisibility', v_new.visibility,
      'titleChanged', v_old.title is distinct from v_new.title,
      'bodyChanged', v_old.body is distinct from v_new.body
    )
  );

  return v_new;
end;
$$;

alter table public.study_record_revisions enable row level security;
alter table public.security_event_logs enable row level security;

drop policy if exists "study_record_revisions_select_readable" on public.study_record_revisions;
create policy "study_record_revisions_select_readable"
on public.study_record_revisions
for select to authenticated
using (public.current_user_can_read_study_record(study_record_id));

drop policy if exists "security_event_logs_select_managers" on public.security_event_logs;
create policy "security_event_logs_select_managers"
on public.security_event_logs
for select to authenticated
using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('permissions.manage')
);

grant select on public.study_record_revisions, public.security_event_logs to authenticated;
revoke all on function public.record_security_event(text, text, text, uuid, jsonb) from public, anon;
revoke all on function public.update_study_record(uuid, text, text, integer, text[], jsonb, text) from public, anon;
grant execute on function public.record_security_event(text, text, text, uuid, jsonb) to authenticated;
grant execute on function public.update_study_record(uuid, text, text, integer, text[], jsonb, text) to authenticated;
