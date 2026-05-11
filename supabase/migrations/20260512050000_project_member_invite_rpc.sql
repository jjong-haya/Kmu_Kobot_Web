-- Project leads can invite active members directly from the project workspace.
-- A valid GitHub profile URL is required before membership is created.

create or replace function public.current_user_can_invite_project_member(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_project_team_id is not null
    and (
      public.current_user_has_permission('admin.access')
      or public.current_user_has_permission('members.manage')
      or public.current_user_has_permission('projects.manage')
      or public.current_user_is_project_team_lead(target_project_team_id)
      or public.current_user_has_project_delegated_scope(target_project_team_id, 'invite_members')
    );
$$;

create or replace function public.invite_project_team_member(
  p_project_team_id uuid,
  p_user_id uuid
)
returns public.project_team_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
  v_profile public.profiles;
  v_membership public.project_team_memberships;
  v_display_name text;
  v_github_url text;
  v_github_login text;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if p_project_team_id is null or p_user_id is null then
    raise exception '프로젝트와 초대할 멤버를 모두 선택해 주세요.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if v_project.deleted_at is not null then
    raise exception '휴지통에 있는 프로젝트에는 멤버를 초대할 수 없습니다.' using errcode = '42501';
  end if;

  if v_project.status not in ('active', 'recruiting') then
    raise exception '진행중 또는 모집중 프로젝트에만 멤버를 초대할 수 있습니다.';
  end if;

  if not public.current_user_can_invite_project_member(v_project.id) then
    raise exception '프로젝트 멤버를 초대할 권한이 없습니다.' using errcode = '42501';
  end if;

  select p.*
    into v_profile
  from public.profiles p
  join public.member_accounts ma
    on ma.user_id = p.id
  where p.id = p_user_id
    and ma.organization_id = v_project.organization_id
    and ma.status = 'active'
  limit 1;

  if v_profile.id is null then
    raise exception '같은 조직의 활성 부원만 초대할 수 있습니다.';
  end if;

  v_github_url := nullif(btrim(coalesce(v_profile.github_url, '')), '');
  v_github_login := public.extract_github_login(v_github_url);

  if v_github_login is null then
    raise exception '초대하려면 해당 멤버가 프로필에 GitHub URL을 등록해야 합니다.' using errcode = '42501';
  end if;

  insert into public.member_github_identities (
    user_id,
    github_login,
    github_url,
    connection_status,
    source
  )
  values (
    p_user_id,
    v_github_login,
    v_github_url,
    'linked',
    'profile_url'
  )
  on conflict (user_id) do update
  set
    github_login = excluded.github_login,
    github_url = excluded.github_url,
    connection_status = 'linked',
    source = 'profile_url',
    updated_at = now();

  v_display_name := coalesce(
    nullif(btrim(v_profile.nickname_display), ''),
    nullif(btrim(v_profile.display_name), ''),
    nullif(btrim(v_profile.full_name), ''),
    split_part(v_profile.email::text, '@', 1),
    '이름 없음'
  );

  insert into public.project_team_memberships (
    project_team_id,
    user_id,
    role,
    status,
    nickname_snapshot,
    display_name_snapshot,
    assigned_by,
    joined_at,
    left_at,
    metadata
  )
  values (
    v_project.id,
    p_user_id,
    'member',
    'active',
    v_profile.nickname_display,
    v_display_name,
    v_actor,
    now(),
    null,
    jsonb_build_object(
      'invitedBy', v_actor,
      'invitedAt', now(),
      'source', 'project_member_invite'
    )
  )
  on conflict (project_team_id, user_id) do update
  set
    role = case
      when public.project_team_memberships.role in ('lead', 'maintainer')
        then public.project_team_memberships.role
      else 'member'
    end,
    status = 'active',
    nickname_snapshot = excluded.nickname_snapshot,
    display_name_snapshot = excluded.display_name_snapshot,
    assigned_by = excluded.assigned_by,
    joined_at = case
      when public.project_team_memberships.status = 'active' then public.project_team_memberships.joined_at
      else now()
    end,
    left_at = null,
    metadata = coalesce(public.project_team_memberships.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'invitedBy', v_actor,
        'invitedAt', now(),
        'source', 'project_member_invite'
      )
  returning * into v_membership;

  update public.project_team_join_requests
  set
    status = 'approved',
    reviewed_by = v_actor,
    reviewed_at = now(),
    review_reason = coalesce(review_reason, '프로젝트 멤버 초대로 승인되었습니다.'),
    updated_at = now()
  where project_team_id = v_project.id
    and requester_user_id = p_user_id
    and status = 'pending';

  perform public.create_audit_log(
    'project.member.invite',
    p_user_id,
    v_project.id,
    null,
    'project_team_memberships',
    v_membership.id,
    null,
    to_jsonb(v_membership),
    null,
    jsonb_build_object('source', 'invite_project_team_member_rpc')
  );

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    title,
    body,
    channel,
    importance,
    related_entity_table,
    related_entity_id,
    href,
    metadata
  )
  values (
    p_user_id,
    v_actor,
    'project.member_invited',
    '프로젝트에 초대되었습니다',
    v_project.name || ' 프로젝트에 멤버로 추가되었습니다.',
    'in_app',
    'important',
    'project_team_memberships',
    v_membership.id,
    '/member/projects/' || v_project.slug::text,
    jsonb_build_object('projectTeamId', v_project.id, 'membershipId', v_membership.id)
  );

  return v_membership;
end;
$$;

revoke all on function public.current_user_can_invite_project_member(uuid) from public, anon;
revoke all on function public.invite_project_team_member(uuid, uuid) from public, anon, authenticated;
grant execute on function public.current_user_can_invite_project_member(uuid) to authenticated;
grant execute on function public.invite_project_team_member(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
