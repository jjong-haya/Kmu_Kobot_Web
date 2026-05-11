-- Project trash lifecycle.
-- Deletion is now two-step: project leads can move their own projects to the
-- trash, while the President can move/restore/purge any project.

alter table public.project_teams
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles (id) on delete set null,
  add column if not exists deletion_reason text;

create index if not exists project_teams_deleted_at_idx
  on public.project_teams (deleted_at, updated_at desc);

create or replace function public.current_user_can_delete_project(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_project_team_id is not null
    and (
      public.user_is_president(auth.uid())
      or exists (
        select 1
        from public.project_teams pt
        where pt.id = target_project_team_id
          and pt.lead_user_id = auth.uid()
      )
      or exists (
        select 1
        from public.project_team_memberships ptm
        where ptm.project_team_id = target_project_team_id
          and ptm.user_id = auth.uid()
          and ptm.status = 'active'
          and ptm.role = 'lead'
      )
    );
$$;

create or replace function public.delete_project_team(p_project_team_id uuid)
returns public.project_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
  v_updated public.project_teams;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
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
    raise exception '이미 휴지통에 있는 프로젝트입니다.' using errcode = 'P0001';
  end if;

  if not public.current_user_can_delete_project(v_project.id) then
    raise exception '프로젝트를 삭제할 권한이 없습니다.' using errcode = '42501';
  end if;

  update public.project_teams
  set
    deleted_at = now(),
    deleted_by = v_actor,
    deletion_reason = null,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'lastTrash',
      jsonb_build_object(
        'deletedBy', v_actor,
        'deletedAt', now()
      )
    ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.trash',
    v_actor,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    to_jsonb(v_project),
    to_jsonb(v_updated),
    null,
    jsonb_build_object('source', 'delete_project_team_rpc')
  );

  if v_project.status in ('active', 'recruiting', 'archived') then
    perform public.enqueue_github_sync_job(
      'project_repo_freeze',
      v_project.id,
      null,
      jsonb_build_object('githubOrg', 'Kookmin-Kobot', 'permission', 'pull', 'source', 'project_trash')
    );
  end if;

  return v_updated;
end;
$$;

create or replace function public.restore_deleted_project_team(p_project_team_id uuid)
returns public.project_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
  v_updated public.project_teams;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if v_project.deleted_at is null then
    raise exception '휴지통에 있는 프로젝트만 복구할 수 있습니다.' using errcode = 'P0001';
  end if;

  if not public.current_user_can_delete_project(v_project.id) then
    raise exception '프로젝트를 복구할 권한이 없습니다.' using errcode = '42501';
  end if;

  update public.project_teams
  set
    deleted_at = null,
    deleted_by = null,
    deletion_reason = null,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'lastTrashRestore',
      jsonb_build_object(
        'restoredBy', v_actor,
        'restoredAt', now()
      )
    ),
    updated_at = now()
  where id = v_project.id
  returning * into v_updated;

  perform public.create_audit_log(
    'project.trash.restore',
    v_actor,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    to_jsonb(v_project),
    to_jsonb(v_updated),
    null,
    jsonb_build_object('source', 'restore_deleted_project_team_rpc')
  );

  if v_updated.status in ('active', 'recruiting') then
    perform public.enqueue_github_sync_job(
      'project_repo_provision',
      v_updated.id,
      null,
      jsonb_build_object(
        'githubOrg', 'Kookmin-Kobot',
        'visibility', 'private',
        'leadPermission', 'maintain',
        'memberPermission', 'push',
        'source', 'project_trash_restore'
      )
    );
  end if;

  return v_updated;
end;
$$;

create or replace function public.purge_deleted_project_team(p_project_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if v_project.deleted_at is null then
    raise exception '휴지통에 있는 프로젝트만 완전삭제할 수 있습니다.' using errcode = 'P0001';
  end if;

  if not public.current_user_can_delete_project(v_project.id) then
    raise exception '프로젝트를 완전삭제할 권한이 없습니다.' using errcode = '42501';
  end if;

  perform public.create_audit_log(
    'project.purge',
    v_actor,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    to_jsonb(v_project),
    null,
    null,
    jsonb_build_object('source', 'purge_deleted_project_team_rpc')
  );

  delete from public.project_teams
  where id = v_project.id;
end;
$$;

revoke all on function public.current_user_can_delete_project(uuid) from public, anon;
revoke all on function public.delete_project_team(uuid) from public, anon, authenticated;
revoke all on function public.restore_deleted_project_team(uuid) from public, anon, authenticated;
revoke all on function public.purge_deleted_project_team(uuid) from public, anon, authenticated;

grant execute on function public.current_user_can_delete_project(uuid) to authenticated;
grant execute on function public.delete_project_team(uuid) to authenticated;
grant execute on function public.restore_deleted_project_team(uuid) to authenticated;
grant execute on function public.purge_deleted_project_team(uuid) to authenticated;

notify pgrst, 'reload schema';
