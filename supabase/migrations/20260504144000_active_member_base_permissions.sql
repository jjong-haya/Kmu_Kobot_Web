-- Give regular active KOBOT members the base read permissions that match
-- the member sidebar section. Course members keep a smaller invite-based set.

create or replace function public.current_user_has_permission(requested_code text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  with current_account as (
    select ma.user_id, ma.status, ma.is_bootstrap_admin
    from public.member_accounts ma
    where ma.user_id = auth.uid()
  ),
  base_permissions as (
    select base_permission.code
    from current_account ca
    cross join (
      values
        ('dashboard.read'),
        ('notifications.read'),
        ('announcements.read'),
        ('members.read'),
        ('projects.read'),
        ('resources.read'),
        ('events.read')
    ) as base_permission(code)
    where ca.status = 'active'

    union

    select base_permission.code
    from current_account ca
    cross join (
      values
        ('dashboard.read'),
        ('notifications.read'),
        ('announcements.read'),
        ('members.read')
    ) as base_permission(code)
    where ca.status = 'course_member'
  ),
  position_permissions as (
    select distinct perm.code::text as code
    from current_account ca
    join public.org_position_assignments opa
      on opa.user_id = ca.user_id
     and opa.active = true
    join public.org_position_permissions opp
      on opp.org_position_id = opa.org_position_id
    join public.permissions perm
      on perm.id = opp.permission_id
    where ca.status = 'active'
  ),
  team_permissions as (
    select distinct perm.code::text as code
    from current_account ca
    join public.team_memberships tm
      on tm.user_id = ca.user_id
     and tm.active = true
    join public.team_role_permissions trp
      on trp.team_role_id = tm.team_role_id
    join public.permissions perm
      on perm.id = trp.permission_id
    where ca.status = 'active'
  )
  select exists (
    select 1
    from current_account ca
    where ca.status in ('active', 'course_member')
      and (
        (ca.status = 'active' and ca.is_bootstrap_admin)
        or requested_code in (select code from base_permissions)
        or requested_code in (select code from position_permissions)
        or requested_code in (select code from team_permissions)
      )
  );
$$;

create or replace function public.get_my_authorization_context()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  with base as (
    select
      p.id,
      p.email::text as email,
      p.display_name,
      p.nickname_display,
      p.nickname_slug::text as nickname_slug,
      p.full_name,
      p.student_id,
      p.phone,
      p.college,
      p.department,
      p.club_affiliation,
      p.public_credit_name_mode,
      p.tech_tags,
      p.avatar_url,
      p.login_id::text as login_id,
      ma.status,
      ma.has_login_password,
      ma.is_bootstrap_admin,
      org.id as organization_id,
      org.slug::text as organization_slug,
      org.name as organization_name
    from public.profiles p
    left join public.member_accounts ma
      on ma.user_id = p.id
    left join public.organizations org
      on org.id = ma.organization_id
    where p.id = auth.uid()
  )
  select jsonb_build_object(
    'profile',
    (
      select jsonb_build_object(
        'id', b.id,
        'email', b.email,
        'displayName', coalesce(b.nickname_display, b.display_name),
        'nicknameDisplay', b.nickname_display,
        'nicknameSlug', b.nickname_slug,
        'fullName', b.full_name,
        'studentId', b.student_id,
        'phone', b.phone,
        'college', b.college,
        'department', b.department,
        'clubAffiliation', b.club_affiliation,
        'publicCreditNameMode', b.public_credit_name_mode,
        'techTags', coalesce(to_jsonb(b.tech_tags), '[]'::jsonb),
        'avatarUrl', b.avatar_url,
        'loginId', b.login_id
      )
      from base b
    ),
    'account',
    (
      select jsonb_build_object(
        'status', b.status,
        'hasLoginPassword', b.has_login_password,
        'isBootstrapAdmin', b.is_bootstrap_admin
      )
      from base b
    ),
    'organization',
    (
      select jsonb_build_object(
        'id', b.organization_id,
        'slug', b.organization_slug,
        'name', b.organization_name
      )
      from base b
    ),
    'orgPositions',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', op.id,
            'slug', op.slug,
            'name', op.name
          )
          order by op.name
        )
        from public.org_position_assignments opa
        join public.org_positions op
          on op.id = opa.org_position_id
        where opa.user_id = auth.uid()
          and opa.active = true
      ),
      '[]'::jsonb
    ),
    'teamMemberships',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'teamId', t.id,
            'teamSlug', t.slug,
            'teamName', t.name,
            'roleId', tr.id,
            'roleSlug', tr.slug,
            'roleName', tr.name
          )
          order by t.name
        )
        from public.team_memberships tm
        join public.teams t
          on t.id = tm.team_id
        left join public.team_roles tr
          on tr.id = tm.team_role_id
        where tm.user_id = auth.uid()
          and tm.active = true
      ),
      '[]'::jsonb
    ),
    'permissions',
    coalesce(
      (
        select jsonb_agg(code order by code)
        from (
          select base_permission.code
          from public.member_accounts ma
          cross join (
            values
              ('dashboard.read'),
              ('notifications.read'),
              ('announcements.read'),
              ('members.read'),
              ('projects.read'),
              ('resources.read'),
              ('events.read')
          ) as base_permission(code)
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select base_permission.code
          from public.member_accounts ma
          cross join (
            values
              ('dashboard.read'),
              ('notifications.read'),
              ('announcements.read'),
              ('members.read')
          ) as base_permission(code)
          where ma.user_id = auth.uid()
            and ma.status = 'course_member'

          union

          select distinct perm.code::text as code
          from public.member_accounts ma
          join public.org_position_assignments opa
            on opa.user_id = ma.user_id
           and opa.active = true
          join public.org_position_permissions opp
            on opp.org_position_id = opa.org_position_id
          join public.permissions perm
            on perm.id = opp.permission_id
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select distinct perm.code::text as code
          from public.member_accounts ma
          join public.team_memberships tm
            on tm.user_id = ma.user_id
           and tm.active = true
          join public.team_role_permissions trp
            on trp.team_role_id = tm.team_role_id
          join public.permissions perm
            on perm.id = trp.permission_id
          where ma.user_id = auth.uid()
            and ma.status = 'active'

          union

          select 'admin.access'
          from public.member_accounts ma
          where ma.user_id = auth.uid()
            and ma.status = 'active'
            and ma.is_bootstrap_admin = true
        ) permission_codes
      ),
      '[]'::jsonb
    )
  );
$$;
