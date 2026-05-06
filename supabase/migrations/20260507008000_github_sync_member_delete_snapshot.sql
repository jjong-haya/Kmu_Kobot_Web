-- Root cause:
-- Deleting a member cascades through public.profiles -> project_team_memberships.
-- The membership DELETE trigger used to enqueue github_sync_jobs with old.user_id.
-- During the same cascade that profile row is already being deleted, so the new
-- github_sync_jobs.user_id FK can fail and block member deletion.
--
-- Keep GitHub cleanup as a second-line sync job, but do not persist a FK to a
-- profile that is being deleted. Snapshot the GitHub login in payload instead.

create or replace function public.handle_project_membership_github_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.project_teams;
  v_project_team_id uuid;
  v_removed_identity public.member_github_identities%rowtype;
begin
  if tg_op = 'DELETE' then
    v_project_team_id := old.project_team_id;
  else
    v_project_team_id := new.project_team_id;
  end if;

  select *
    into v_project
  from public.project_teams
  where id = v_project_team_id;

  if v_project.id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.status = 'active'
      and v_project.status in ('active', 'recruiting')
      and (
        tg_op = 'INSERT'
        or old.status is distinct from new.status
        or old.role is distinct from new.role
      ) then
      perform public.enqueue_github_sync_job(
        'project_member_invite',
        new.project_team_id,
        new.user_id,
        jsonb_build_object('githubOrg', 'Kookmin-Kobot', 'projectRole', new.role)
      );
    elsif tg_op = 'UPDATE'
      and old.status = 'active'
      and new.status <> 'active'
      and v_project.status in ('active', 'recruiting', 'archived') then
      perform public.enqueue_github_sync_job(
        'project_member_remove',
        old.project_team_id,
        old.user_id,
        jsonb_build_object('githubOrg', 'Kookmin-Kobot', 'previousRole', old.role)
      );
    end if;
  elsif tg_op = 'DELETE' and old.status = 'active' then
    select *
      into v_removed_identity
    from public.member_github_identities
    where user_id = old.user_id;

    perform public.enqueue_github_sync_job(
      'project_member_remove',
      old.project_team_id,
      null,
      jsonb_build_object(
        'githubOrg', 'Kookmin-Kobot',
        'previousRole', old.role,
        'removedUserId', old.user_id,
        'githubLogin', v_removed_identity.github_login,
        'githubUserId', v_removed_identity.github_user_id
      )
    );
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.handle_project_membership_github_sync() from public, anon;
