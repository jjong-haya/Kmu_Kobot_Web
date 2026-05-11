-- Permanent project deletion must also delete the GitHub repository.
-- The delete job snapshots repo data before project_teams cascades remove link rows.

alter table public.github_sync_jobs
  drop constraint if exists github_sync_jobs_job_type_check;

alter table public.github_sync_jobs
  add constraint github_sync_jobs_job_type_check
  check (
    job_type in (
      'project_repo_provision',
      'project_member_invite',
      'project_member_remove',
      'project_repo_freeze',
      'project_repo_delete'
    )
  );

create or replace function public.enqueue_github_sync_job(
  p_job_type text,
  p_project_team_id uuid default null,
  p_user_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.project_teams;
  v_status text := 'pending';
  v_last_error text;
  v_key text;
  v_job_id uuid;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  v_has_identity boolean := true;
  v_actor uuid := auth.uid();
begin
  if v_actor is not null
    and not (
      public.current_user_has_permission('admin.access')
      or public.current_user_has_permission('members.manage')
      or public.current_user_has_permission('projects.manage')
      or (
        p_project_team_id is not null
        and public.current_user_can_manage_project(p_project_team_id)
      )
      or (
        p_job_type = 'project_repo_delete'
        and p_project_team_id is null
        and coalesce(v_payload->>'projectTeamId', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        and public.current_user_can_delete_project((v_payload->>'projectTeamId')::uuid)
      )
    ) then
    raise exception 'You cannot enqueue GitHub sync jobs for this project.';
  end if;

  if p_job_type not in (
    'project_repo_provision',
    'project_member_invite',
    'project_member_remove',
    'project_repo_freeze',
    'project_repo_delete'
  ) then
    raise exception 'Unsupported GitHub sync job type.';
  end if;

  if p_project_team_id is not null then
    select *
      into v_project
    from public.project_teams
    where id = p_project_team_id;

    if v_project.id is null then
      raise exception 'Project not found for GitHub sync.';
    end if;
  end if;

  if p_job_type = 'project_repo_delete' then
    if nullif(btrim(coalesce(v_payload->>'repoName', '')), '') is null then
      raise exception 'Repository delete job requires repoName.';
    end if;
  end if;

  if p_job_type = 'project_member_invite' and p_user_id is not null then
    v_has_identity := public.refresh_member_github_identity(p_user_id);
    if not v_has_identity then
      v_status := 'blocked';
      v_last_error := 'missing_github_identity';
    end if;
  end if;

  v_key := p_job_type
    || ':project=' || coalesce(p_project_team_id::text, coalesce(v_payload->>'projectTeamId', 'none'))
    || ':user=' || coalesce(p_user_id::text, 'none')
    || case
      when p_job_type = 'project_repo_delete' then ':repo=' || coalesce(v_payload->>'repoName', 'none')
      else ''
    end;

  insert into public.github_sync_jobs (
    organization_id,
    project_team_id,
    user_id,
    job_type,
    status,
    idempotency_key,
    payload,
    run_after,
    last_error
  )
  values (
    case
      when p_project_team_id is null then null
      else v_project.organization_id
    end,
    p_project_team_id,
    p_user_id,
    p_job_type,
    v_status,
    v_key,
    v_payload,
    now(),
    v_last_error
  )
  on conflict (idempotency_key) do update
  set
    status = case
      when github_sync_jobs.status = 'processing' then github_sync_jobs.status
      when github_sync_jobs.status = 'succeeded'
        and excluded.status = 'pending'
        and excluded.job_type in ('project_repo_provision', 'project_repo_delete') then github_sync_jobs.status
      else excluded.status
    end,
    payload = excluded.payload,
    run_after = case
      when github_sync_jobs.status = 'processing' then github_sync_jobs.run_after
      else now()
    end,
    attempts = case
      when github_sync_jobs.status in ('failed', 'blocked', 'skipped') then 0
      else github_sync_jobs.attempts
    end,
    last_error = excluded.last_error,
    completed_at = case
      when github_sync_jobs.status = 'processing' then github_sync_jobs.completed_at
      when github_sync_jobs.status = 'succeeded'
        and excluded.job_type in ('project_repo_provision', 'project_repo_delete') then github_sync_jobs.completed_at
      else null
    end,
    updated_at = now()
  returning id into v_job_id;

  perform public.create_audit_log(
    'github.sync.enqueue',
    p_user_id,
    p_project_team_id,
    null,
    'github_sync_jobs',
    v_job_id,
    null,
    jsonb_build_object('jobType', p_job_type, 'status', v_status),
    v_last_error,
    jsonb_build_object('source', 'github_sync_enqueue')
  );

  return v_job_id;
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
  v_link public.project_github_links;
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

  select *
    into v_link
  from public.project_github_links
  where project_team_id = v_project.id;

  if v_link.project_team_id is not null and nullif(btrim(v_link.repo_name), '') is not null then
    perform public.enqueue_github_sync_job(
      'project_repo_delete',
      null,
      null,
      jsonb_build_object(
        'githubOrg', v_link.github_org,
        'repoName', v_link.repo_name,
        'repoFullName', v_link.repo_full_name,
        'projectTeamId', v_project.id,
        'projectSlug', v_project.slug,
        'projectName', v_project.name,
        'source', 'project_purge'
      )
    );
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
    jsonb_build_object(
      'source', 'purge_deleted_project_team_rpc',
      'githubRepoDeleteQueued', v_link.project_team_id is not null
    )
  );

  delete from public.project_teams
  where id = v_project.id;
end;
$$;

revoke all on function public.enqueue_github_sync_job(text, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.purge_deleted_project_team(uuid) from public, anon, authenticated;
grant execute on function public.purge_deleted_project_team(uuid) to authenticated;

notify pgrst, 'reload schema';
