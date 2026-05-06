-- Store Notion-style BlockNote documents for study posts.

drop function if exists public.submit_study_record(
  uuid,
  uuid,
  text,
  text,
  integer,
  text[],
  timestamptz,
  text
);

drop function if exists public.submit_study_record(
  uuid,
  uuid,
  text,
  text,
  integer,
  text[],
  jsonb,
  timestamptz,
  text
);

create or replace function public.submit_study_record(
  p_project_team_id uuid default null,
  p_study_session_id uuid default null,
  p_title text default null,
  p_body text default null,
  p_duration_minutes integer default null,
  p_image_urls text[] default '{}'::text[],
  p_content_json jsonb default null,
  p_occurred_at timestamptz default null,
  p_visibility text default 'project'
)
returns public.study_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project_id uuid := p_project_team_id;
  v_project public.project_teams;
  v_session public.study_sessions;
  v_record public.study_records;
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := nullif(btrim(coalesce(p_body, '')), '');
  v_visibility text := lower(btrim(coalesce(p_visibility, 'project')));
  v_image_urls text[] := '{}'::text[];
  v_content_json jsonb := p_content_json;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.current_user_is_active_member() then
    raise exception '활성 부원만 스터디 글을 작성할 수 있습니다.';
  end if;

  if v_title = '' then
    raise exception '스터디 글 제목을 입력해 주세요.';
  end if;

  if char_length(v_title) > 120 then
    raise exception '스터디 글 제목은 120자 이하로 입력해 주세요.';
  end if;

  if v_body is not null and char_length(v_body) > 40000 then
    raise exception '스터디 글 내용이 너무 깁니다.';
  end if;

  if v_content_json is not null and jsonb_typeof(v_content_json) <> 'array' then
    raise exception '스터디 글 본문 형식이 올바르지 않습니다.';
  end if;

  if v_content_json is not null and octet_length(v_content_json::text) > 1000000 then
    raise exception '스터디 글 본문 데이터가 너무 큽니다.';
  end if;

  if p_duration_minutes is not null and (p_duration_minutes < 0 or p_duration_minutes > 1440) then
    raise exception '스터디 시간은 0분 이상 1440분 이하로 입력해 주세요.';
  end if;

  if v_visibility not in ('self', 'project', 'member', 'public') then
    raise exception '지원하지 않는 스터디 글 공개 범위입니다.';
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
    raise exception '이미지 주소는 http 또는 https URL이어야 합니다.';
  end if;

  if p_study_session_id is not null then
    select *
      into v_session
    from public.study_sessions
    where id = p_study_session_id;

    if v_session.id is null then
      raise exception '스터디 세션을 찾을 수 없습니다.';
    end if;

    if v_session.status = 'canceled' then
      raise exception '취소된 스터디 세션에는 글을 추가할 수 없습니다.';
    end if;

    if v_session.project_team_id is not null then
      if v_project_id is not null and v_project_id <> v_session.project_team_id then
        raise exception '스터디 세션과 프로젝트가 일치하지 않습니다.';
      end if;

      v_project_id := v_session.project_team_id;
    end if;
  end if;

  if v_project_id is not null then
    select *
      into v_project
    from public.project_teams
    where id = v_project_id;

    if v_project.id is null then
      raise exception '프로젝트를 찾을 수 없습니다.';
    end if;

    if v_project.status not in ('pending', 'recruiting', 'active') then
      raise exception '진행 가능한 프로젝트에만 스터디 글을 추가할 수 있습니다.';
    end if;

    if not exists (
      select 1
      from public.project_team_memberships ptm
      where ptm.project_team_id = v_project_id
        and ptm.user_id = v_actor
        and ptm.status = 'active'
    ) then
      raise exception '프로젝트 멤버만 프로젝트 스터디 글을 작성할 수 있습니다.';
    end if;
  elsif v_visibility = 'project' then
    raise exception '프로젝트 공개 글에는 프로젝트가 필요합니다.';
  end if;

  insert into public.study_records (
    study_session_id,
    project_team_id,
    author_user_id,
    title,
    body,
    duration_minutes,
    occurred_at,
    status,
    visibility,
    metadata
  )
  values (
    p_study_session_id,
    v_project_id,
    v_actor,
    v_title,
    v_body,
    p_duration_minutes,
    coalesce(p_occurred_at, now()),
    'submitted',
    v_visibility,
    jsonb_strip_nulls(
      jsonb_build_object(
        'editor',
        case when v_content_json is null then null else 'blocknote' end,
        'contentJson',
        v_content_json,
        'imageUrls',
        to_jsonb(v_image_urls),
        'coverImageUrl',
        case when cardinality(v_image_urls) > 0 then v_image_urls[1] else null end
      )
    )
  )
  returning * into v_record;

  perform public.create_audit_log(
    'study.record.submit',
    v_actor,
    v_project_id,
    null,
    'study_records',
    v_record.id,
    null,
    jsonb_build_object(
      'title', v_record.title,
      'visibility', v_record.visibility,
      'projectTeamId', v_record.project_team_id,
      'studySessionId', v_record.study_session_id,
      'imageCount', cardinality(v_image_urls),
      'editor', case when v_content_json is null then null else 'blocknote' end
    ),
    null,
    jsonb_build_object('source', 'submit_study_record_rpc')
  );

  return v_record;
end;
$$;

revoke all on function public.submit_study_record(
  uuid,
  uuid,
  text,
  text,
  integer,
  text[],
  jsonb,
  timestamptz,
  text
) from public, anon;

grant execute on function public.submit_study_record(
  uuid,
  uuid,
  text,
  text,
  integer,
  text[],
  jsonb,
  timestamptz,
  text
) to authenticated;
