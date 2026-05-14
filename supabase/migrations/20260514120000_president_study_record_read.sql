-- Let the President audit study records across every project without
-- granting extra write access.

create or replace function public.can_read_private_project(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.project_teams pt
    where pt.id = target_project_team_id
      and (
        public.user_is_president(auth.uid())
        or public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('projects.manage')
        or exists (
          select 1
          from public.project_team_memberships ptm
          where ptm.project_team_id = pt.id
            and ptm.user_id = auth.uid()
            and ptm.status = 'active'
        )
        or (
          pt.status in ('active', 'recruiting')
          and pt.visibility = 'public'
          and pt.recruitment_status = 'open'
          and public.current_user_is_active_member()
        )
      )
  );
$$;

create or replace function public.current_user_can_read_project_member_scope(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_project_team_id is not null
    and (
      public.user_is_president(auth.uid())
      or public.current_user_has_permission('admin.access')
      or public.current_user_has_permission('members.manage')
      or public.current_user_has_permission('projects.manage')
      or exists (
        select 1
        from public.project_team_memberships ptm
        where ptm.project_team_id = target_project_team_id
          and ptm.user_id = auth.uid()
          and ptm.status = 'active'
      )
    );
$$;

create or replace function public.current_user_can_read_study_session(target_study_session_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.study_sessions ss
    where ss.id = target_study_session_id
      and (
        ss.created_by = auth.uid()
        or public.user_is_president(auth.uid())
        or public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('studies.manage')
        or (
          ss.visibility in ('public', 'member')
          and ss.status <> 'draft'
          and public.current_user_is_active_member()
        )
        or (
          ss.visibility = 'project'
          and ss.project_team_id is not null
          and public.current_user_can_read_project_member_scope(ss.project_team_id)
        )
        or (
          ss.visibility = 'tag'
          and ss.status <> 'draft'
          and public.current_user_is_active_member()
          and exists (
            select 1
            from public.study_session_audience_tags ssat
            join public.member_tag_assignments mta
              on mta.tag_id = ssat.tag_id
            where ssat.study_session_id = ss.id
              and mta.user_id = auth.uid()
          )
        )
      )
  );
$$;

create or replace function public.current_user_can_read_study_record(target_study_record_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.study_records sr
    where sr.id = target_study_record_id
      and (
        sr.author_user_id = auth.uid()
        or public.user_is_president(auth.uid())
        or public.current_user_has_permission('admin.access')
        or public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('studies.manage')
        or (
          sr.status <> 'draft'
          and sr.visibility in ('member', 'public')
          and public.current_user_is_active_member()
        )
        or (
          sr.status <> 'draft'
          and sr.visibility = 'project'
          and sr.project_team_id is not null
          and public.current_user_can_read_project_member_scope(sr.project_team_id)
        )
      )
  );
$$;

revoke all on function public.can_read_private_project(uuid) from public, anon;
revoke all on function public.current_user_can_read_project_member_scope(uuid) from public, anon;
revoke all on function public.current_user_can_read_study_session(uuid) from public, anon;
revoke all on function public.current_user_can_read_study_record(uuid) from public, anon;

grant execute on function public.can_read_private_project(uuid) to authenticated;
grant execute on function public.current_user_can_read_project_member_scope(uuid) to authenticated;
grant execute on function public.current_user_can_read_study_session(uuid) to authenticated;
grant execute on function public.current_user_can_read_study_record(uuid) to authenticated;

notify pgrst, 'reload schema';
