-- Project creation is a separate capability from project management.
-- Role tags are real assignable member_tags; permissions are attached to tags,
-- and users receive the union of all assigned tag permissions.

insert into public.permissions (code, description)
values
  ('projects.create', 'Create project teams')
on conflict (code) do update
set description = excluded.description;

drop policy if exists "project_teams_insert_active_members" on public.project_teams;
drop policy if exists "project_teams_insert_create_permission" on public.project_teams;
create policy "project_teams_insert_create_permission" on public.project_teams
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.member_accounts ma
      where ma.user_id = auth.uid()
        and ma.status = 'active'
        and ma.organization_id = project_teams.organization_id
    )
    and (
      public.current_user_has_permission('projects.create')
      or public.current_user_has_permission('projects.manage')
    )
    and (
      public.current_user_has_permission('projects.manage')
      or (
        created_by = auth.uid()
        and owner_user_id = auth.uid()
        and lead_user_id = auth.uid()
      )
    )
  );

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
  v_slug text := lower(btrim(coalesce(input_slug, '')));
  v_name text := btrim(coalesce(input_name, ''));
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

  if v_slug !~ '^[a-z][a-z0-9_-]{1,30}$' then
    raise exception '프로젝트 slug는 영어 소문자로 시작하고 소문자/숫자/하이픈/언더스코어만 2~31자로 입력해야 합니다.';
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
    v_slug::citext,
    v_name,
    nullif(btrim(coalesce(input_summary, '')), ''),
    nullif(btrim(coalesce(input_description, '')), ''),
    input_project_type,
    input_visibility,
    'pending',
    v_actor,
    v_actor,
    v_actor,
    coalesce(input_metadata, '{}'::jsonb)
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
    to_jsonb(v_project),
    null,
    jsonb_build_object('source', 'create_project_team_rpc')
  );

  return v_project;
end;
$$;

grant execute on function public.create_project_team(
  text, text, text, text, text, text, jsonb
) to authenticated;

insert into public.member_tags (slug, label, color, is_system, description)
values
  ('president', '회장', '#b45309', false, '회장 역할 태그. 금 질감으로 표시되며 권한은 태그 설정에서 관리한다.'),
  ('vice_president', '부회장', '#64748b', false, '부회장 역할 태그. 은 질감으로 표시되며 권한은 태그 설정에서 관리한다.'),
  ('official_team_lead_a', '개발 A팀 팀장', '#b87333', false, '공식 개발 A팀 팀장 역할 태그. 동 질감으로 표시된다.'),
  ('official_team_lead_b', '개발 B팀 팀장', '#b87333', false, '공식 개발 B팀 팀장 역할 태그. 동 질감으로 표시된다.'),
  ('official_team_lead_c', '개발 C팀 팀장', '#b87333', false, '공식 개발 C팀 팀장 역할 태그. 동 질감으로 표시된다.'),
  ('official_team_lead_d', '개발 D팀 팀장', '#b87333', false, '공식 개발 D팀 팀장 역할 태그. 동 질감으로 표시된다.')
on conflict (slug) do nothing;

insert into public.member_tag_assignments (user_id, tag_id, assigned_by)
select opa.user_id, mt.id, null
from public.org_position_assignments opa
join public.org_positions op
  on op.id = opa.org_position_id
join public.member_tags mt
  on (
    (op.slug = 'president'::citext and mt.slug = 'president')
    or (op.slug = 'vice-president'::citext and mt.slug = 'vice_president')
  )
where opa.active = true
on conflict (user_id, tag_id) do nothing;

with team_tag_map(team_slug, tag_slug) as (
  values
    ('dev-a'::citext, 'official_team_lead_a'::text),
    ('dev-b'::citext, 'official_team_lead_b'::text),
    ('dev-c'::citext, 'official_team_lead_c'::text),
    ('dev-d'::citext, 'official_team_lead_d'::text)
)
insert into public.member_tag_assignments (user_id, tag_id, assigned_by)
select tm.user_id, mt.id, null
from public.team_memberships tm
join public.teams t
  on t.id = tm.team_id
join public.team_roles tr
  on tr.id = tm.team_role_id
join team_tag_map map
  on map.team_slug = t.slug
join public.member_tags mt
  on mt.slug = map.tag_slug
where tm.active = true
  and tr.slug = 'team-lead'::citext
on conflict (user_id, tag_id) do nothing;
