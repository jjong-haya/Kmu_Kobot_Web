-- Let project creators choose the GitHub repository name before approval.
-- The value is stored in project_teams.metadata.githubRepoName and consumed by
-- the github-sync Edge Function when provisioning the private repository.

create or replace function public.normalize_project_github_repo_name(p_value text)
returns text
language plpgsql
immutable
as $$
declare
  v_name text := lower(btrim(coalesce(p_value, '')));
begin
  if v_name = '' then
    return null;
  end if;

  v_name := regexp_replace(v_name, '[^a-z0-9._-]+', '-', 'g');
  v_name := regexp_replace(v_name, '^[._-]+', '', 'g');
  v_name := regexp_replace(v_name, '[._-]+$', '', 'g');
  v_name := regexp_replace(v_name, '-{2,}', '-', 'g');
  v_name := left(v_name, 90);
  v_name := regexp_replace(v_name, '[._-]+$', '', 'g');

  if char_length(v_name) < 2 then
    return null;
  end if;

  return v_name;
end;
$$;

create or replace function public.project_github_repo_name_available(
  p_organization_id uuid,
  p_repo_name text,
  p_excluding_project_team_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.project_teams pt
    where pt.organization_id = p_organization_id
      and pt.deleted_at is null
      and (p_excluding_project_team_id is null or pt.id <> p_excluding_project_team_id)
      and public.normalize_project_github_repo_name(
        coalesce(pt.metadata->>'githubRepoName', pt.metadata->>'github_repo_name', pt.slug::text)
      ) = p_repo_name
  )
  and not exists (
    select 1
    from public.project_github_links pgl
    where pgl.organization_id = p_organization_id
      and lower(pgl.github_org) = lower('Kookmin-Kobot')
      and lower(pgl.repo_name) = lower(p_repo_name)
      and (p_excluding_project_team_id is null or pgl.project_team_id <> p_excluding_project_team_id)
  );
$$;

update public.project_teams pt
set metadata = coalesce(pt.metadata, '{}'::jsonb)
  || jsonb_build_object(
    'githubRepoName',
    coalesce(
      public.normalize_project_github_repo_name(pgl.repo_name),
      public.normalize_project_github_repo_name(pt.slug::text),
      'project-' || left(pt.id::text, 8)
    )
  )
from public.project_github_links pgl
where pgl.project_team_id = pt.id
  and nullif(btrim(coalesce(pt.metadata->>'githubRepoName', '')), '') is null;

update public.project_teams pt
set metadata = coalesce(pt.metadata, '{}'::jsonb)
  || jsonb_build_object(
    'githubRepoName',
    coalesce(
      public.normalize_project_github_repo_name(pt.slug::text),
      'project-' || left(pt.id::text, 8)
    )
  )
where nullif(btrim(coalesce(pt.metadata->>'githubRepoName', '')), '') is null;

create or replace function public.create_project_team(
  input_slug text,
  input_name text,
  input_summary text default null,
  input_description text default null,
  input_project_type text default 'autonomous',
  input_visibility text default 'private',
  input_metadata jsonb default '{}'::jsonb
)
returns public.project_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_org_id uuid;
  v_requested_slug text := lower(btrim(coalesce(input_slug, '')));
  v_name text := btrim(coalesce(input_name, ''));
  v_slug_base text;
  v_slug_candidate text;
  v_suffix integer := 1;
  v_metadata jsonb := coalesce(input_metadata, '{}'::jsonb);
  v_repo_input text := nullif(btrim(coalesce(input_metadata->>'githubRepoName', input_metadata->>'github_repo_name', '')), '');
  v_repo_name text;
  v_project public.project_teams;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select ma.organization_id
    into v_org_id
  from public.member_accounts ma
  where ma.user_id = v_actor
    and ma.status = 'active'
  limit 1;

  if v_org_id is null then
    raise exception '활성 부원만 프로젝트를 생성할 수 있습니다.';
  end if;

  if not (
    public.current_user_has_permission('projects.create')
    or public.current_user_has_permission('projects.manage')
  ) then
    raise exception '프로젝트 생성 권한이 없습니다.';
  end if;

  if v_name = '' then
    raise exception '프로젝트 이름을 입력해야 합니다.';
  end if;

  if input_project_type not in ('official_based', 'personal', 'autonomous') then
    raise exception '지원하지 않는 프로젝트 유형입니다.';
  end if;

  if input_visibility not in ('public', 'private') then
    raise exception '지원하지 않는 공개 범위입니다.';
  end if;

  if v_requested_slug <> '' then
    if v_requested_slug !~ '^[a-z][a-z0-9_-]{1,30}$' then
      raise exception '프로젝트 slug는 영어 소문자로 시작하고 소문자/숫자/하이픈/언더스코어만 2~31자로 입력해야 합니다.';
    end if;
    v_slug_candidate := v_requested_slug;
  else
    v_slug_base := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_slug_base := regexp_replace(v_slug_base, '(^-+|-+$)', '', 'g');
    v_slug_base := regexp_replace(v_slug_base, '-{2,}', '-', 'g');

    if char_length(v_slug_base) < 2 or v_slug_base !~ '^[a-z]' then
      v_slug_base := 'project';
    end if;

    v_slug_base := left(v_slug_base, 24);
    v_slug_candidate := v_slug_base;

    while exists (
      select 1
      from public.project_teams pt
      where pt.organization_id = v_org_id
        and lower(pt.slug::text) = v_slug_candidate
    ) loop
      v_suffix := v_suffix + 1;
      v_slug_candidate := left(v_slug_base, greatest(2, 30 - char_length(v_suffix::text))) || '-' || v_suffix::text;
    end loop;
  end if;

  v_repo_name := public.normalize_project_github_repo_name(v_repo_input);

  if v_repo_input is not null and v_repo_name is null then
    raise exception 'GitHub 저장소 이름은 영문 소문자, 숫자, 점(.), 하이픈(-), 언더스코어(_)를 사용해 2자 이상으로 입력해 주세요.';
  end if;

  v_repo_name := coalesce(v_repo_name, public.normalize_project_github_repo_name(v_slug_candidate), 'project-' || left(gen_random_uuid()::text, 8));

  if not public.project_github_repo_name_available(v_org_id, v_repo_name, null) then
    raise exception '이미 사용 중인 GitHub 저장소 이름입니다.';
  end if;

  v_metadata := v_metadata || jsonb_build_object('githubRepoName', v_repo_name);

  insert into public.project_teams (
    organization_id,
    slug,
    name,
    summary,
    description,
    project_type,
    visibility,
    status,
    owner_user_id,
    lead_user_id,
    created_by,
    metadata
  )
  values (
    v_org_id,
    v_slug_candidate::citext,
    v_name,
    nullif(btrim(coalesce(input_summary, '')), ''),
    nullif(btrim(coalesce(input_description, '')), ''),
    input_project_type,
    input_visibility,
    'pending',
    v_actor,
    v_actor,
    v_actor,
    v_metadata
  )
  returning * into v_project;

  insert into public.project_team_memberships (
    project_team_id,
    user_id,
    role,
    status,
    assigned_by
  )
  values (
    v_project.id,
    v_actor,
    'lead',
    'active',
    v_actor
  )
  on conflict (project_team_id, user_id) do update
  set
    role = excluded.role,
    status = excluded.status,
    assigned_by = excluded.assigned_by,
    left_at = null;

  perform public.create_audit_log(
    'project.create',
    null,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    null,
    jsonb_build_object(
      'id', v_project.id,
      'slug', v_project.slug,
      'name', v_project.name,
      'status', v_project.status,
      'visibility', v_project.visibility,
      'githubRepoName', v_repo_name
    ),
    null,
    jsonb_build_object('source', 'create_project_team_rpc', 'slugGenerated', v_requested_slug = '')
  );

  return v_project;
end;
$$;

create or replace function public.resubmit_project_team(
  p_project_team_id uuid,
  p_name text,
  p_summary text default null,
  p_description text default null,
  p_project_type text default 'autonomous',
  p_visibility text default 'private',
  p_metadata jsonb default '{}'::jsonb
)
returns public.project_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
  v_updated public.project_teams;
  v_name text := btrim(coalesce(p_name, ''));
  v_project_type text := lower(btrim(coalesce(p_project_type, 'autonomous')));
  v_visibility text := lower(btrim(coalesce(p_visibility, 'private')));
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  v_repo_input text := nullif(btrim(coalesce(p_metadata->>'githubRepoName', p_metadata->>'github_repo_name', '')), '');
  v_repo_name text;
  v_recruitment_status text := case
    when lower(coalesce(v_metadata->>'recruitmentOpen', 'false')) in ('true', '1', 'yes', 'open')
      then 'open'
    else 'closed'
  end;
  v_recruitment_note text := nullif(btrim(coalesce(v_metadata->>'recruitmentNote', '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if v_name = '' then
    raise exception '프로젝트 이름을 입력해야 합니다.';
  end if;

  if char_length(v_name) > 160 then
    raise exception '프로젝트 이름은 160자 이하로 입력해 주세요.';
  end if;

  if v_project_type not in ('official_based', 'personal', 'autonomous') then
    raise exception '지원하지 않는 프로젝트 유형입니다.';
  end if;

  if v_visibility not in ('public', 'private') then
    raise exception '지원하지 않는 공개 범위입니다.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.';
  end if;

  if v_project.status <> 'rejected' then
    raise exception '반려된 프로젝트만 수정 후 재심사를 요청할 수 있습니다.';
  end if;

  if not (
    v_project.created_by = v_actor
    or v_project.owner_user_id = v_actor
    or v_project.lead_user_id = v_actor
    or public.current_user_can_manage_project(v_project.id)
  ) then
    raise exception '프로젝트 재심사를 요청할 권한이 없습니다.';
  end if;

  v_repo_name := public.normalize_project_github_repo_name(v_repo_input);

  if v_repo_input is not null and v_repo_name is null then
    raise exception 'GitHub 저장소 이름은 영문 소문자, 숫자, 점(.), 하이픈(-), 언더스코어(_)를 사용해 2자 이상으로 입력해 주세요.';
  end if;

  v_repo_name := coalesce(
    v_repo_name,
    public.normalize_project_github_repo_name(v_project.metadata->>'githubRepoName'),
    public.normalize_project_github_repo_name(v_project.slug::text),
    'project-' || left(v_project.id::text, 8)
  );

  if not public.project_github_repo_name_available(v_project.organization_id, v_repo_name, v_project.id) then
    raise exception '이미 사용 중인 GitHub 저장소 이름입니다.';
  end if;

  v_metadata := v_metadata || jsonb_build_object('githubRepoName', v_repo_name);

  update public.project_teams
  set
    name = v_name,
    summary = nullif(btrim(coalesce(p_summary, '')), ''),
    description = nullif(btrim(coalesce(p_description, '')), ''),
    project_type = v_project_type,
    visibility = case when v_recruitment_status = 'open' then 'public' else v_visibility end,
    status = 'pending',
    recruitment_status = v_recruitment_status,
    recruitment_note = v_recruitment_note,
    approved_by = null,
    approved_at = null,
    metadata = coalesce(metadata, '{}'::jsonb)
      || v_metadata
      || jsonb_build_object(
        'lastReviewRequest',
        jsonb_build_object(
          'requestedBy', v_actor,
          'requestedAt', now(),
          'fromStatus', v_project.status,
          'toStatus', 'pending'
        )
      ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.review.request',
    null,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    jsonb_build_object(
      'name', v_project.name,
      'summary', v_project.summary,
      'description', v_project.description,
      'projectType', v_project.project_type,
      'visibility', v_project.visibility,
      'status', v_project.status,
      'recruitmentStatus', v_project.recruitment_status,
      'metadata', v_project.metadata
    ),
    jsonb_build_object(
      'name', v_updated.name,
      'summary', v_updated.summary,
      'description', v_updated.description,
      'projectType', v_updated.project_type,
      'visibility', v_updated.visibility,
      'status', v_updated.status,
      'recruitmentStatus', v_updated.recruitment_status,
      'metadata', v_updated.metadata
    ),
    null,
    jsonb_build_object('source', 'resubmit_project_team_rpc', 'githubRepoName', v_repo_name)
  );

  return v_updated;
end;
$$;

revoke all on function public.normalize_project_github_repo_name(text) from public, anon;
revoke all on function public.project_github_repo_name_available(uuid, text, uuid) from public, anon;
revoke all on function public.create_project_team(text, text, text, text, text, text, jsonb) from public, anon;
revoke all on function public.resubmit_project_team(uuid, text, text, text, text, text, jsonb) from public, anon;

grant execute on function public.normalize_project_github_repo_name(text) to authenticated;
grant execute on function public.create_project_team(text, text, text, text, text, text, jsonb) to authenticated;
grant execute on function public.resubmit_project_team(uuid, text, text, text, text, text, jsonb) to authenticated;
