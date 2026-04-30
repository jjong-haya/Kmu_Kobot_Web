create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug citext not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  display_name text,
  full_name text,
  avatar_url text,
  student_id text,
  login_id citext unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_login_id_format check (
    login_id is null
    or login_id ~ '^[a-z0-9](?:[a-z0-9._-]{2,18}[a-z0-9])?$'
  )
);

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists full_name text,
  add column if not exists avatar_url text,
  add column if not exists student_id text,
  add column if not exists login_id citext,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_login_id_unique_idx
  on public.profiles (lower(login_id::text))
  where login_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_login_id_format'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_login_id_format check (
        login_id is null
        or login_id ~ '^[a-z0-9](?:[a-z0-9._-]{2,18}[a-z0-9])?$'
      );
  end if;
end;
$$;

create table if not exists public.member_accounts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete restrict,
  status text not null default 'pending' check (
    status in ('pending', 'active', 'suspended', 'rejected', 'alumni')
  ),
  has_login_password boolean not null default false,
  is_bootstrap_admin boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.allowed_login_exceptions (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  reason text,
  active boolean not null default true,
  approved_by uuid references public.profiles (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.bootstrap_admin_emails (
  email citext primary key,
  org_position_slug citext not null default 'president',
  created_at timestamptz not null default now()
);

create table if not exists public.org_positions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug citext not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.org_position_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  org_position_id uuid not null references public.org_positions (id) on delete cascade,
  active boolean not null default true,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id) on delete set null,
  unique (organization_id, user_id, org_position_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug citext not null,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  unique (organization_id, slug)
);

create table if not exists public.team_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug citext not null,
  name text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  team_role_id uuid references public.team_roles (id) on delete set null,
  active boolean not null default true,
  joined_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id) on delete set null,
  unique (organization_id, user_id, team_id)
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.org_position_permissions (
  org_position_id uuid not null references public.org_positions (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (org_position_id, permission_id)
);

create table if not exists public.team_role_permissions (
  team_role_id uuid not null references public.team_roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  primary key (team_role_id, permission_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.normalize_profile_fields()
returns trigger
language plpgsql
as $$
begin
  new.email = lower(trim(new.email));

  if new.login_id is not null then
    new.login_id = lower(trim(new.login_id));
    if new.login_id = '' then
      new.login_id = null;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists member_accounts_set_updated_at on public.member_accounts;
create trigger member_accounts_set_updated_at
before update on public.member_accounts
for each row execute function public.set_updated_at();

drop trigger if exists org_positions_set_updated_at on public.org_positions;
create trigger org_positions_set_updated_at
before update on public.org_positions
for each row execute function public.set_updated_at();

drop trigger if exists teams_set_updated_at on public.teams;
create trigger teams_set_updated_at
before update on public.teams
for each row execute function public.set_updated_at();

drop trigger if exists team_roles_set_updated_at on public.team_roles;
create trigger team_roles_set_updated_at
before update on public.team_roles
for each row execute function public.set_updated_at();

drop trigger if exists profiles_normalize_fields on public.profiles;
create trigger profiles_normalize_fields
before insert or update on public.profiles
for each row execute function public.normalize_profile_fields();

create or replace function public.is_allowed_sign_in_email(
  target_email text,
  user_metadata jsonb default '{}'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email citext := lower(coalesce(target_email, ''));
  hosted_domain text := lower(coalesce(user_metadata ->> 'hd', ''));
begin
  if normalized_email = '' then
    return false;
  end if;

  if hosted_domain = 'kookmin.ac.kr' then
    return true;
  end if;

  if normalized_email like '%@kookmin.ac.kr' then
    return true;
  end if;

  return exists (
    select 1
    from public.allowed_login_exceptions ale
    where ale.active = true
      and ale.email = normalized_email
      and (ale.expires_at is null or ale.expires_at > now())
  );
end;
$$;

create or replace function public.before_user_created_kobot(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_email text := lower(coalesce(event -> 'user' ->> 'email', ''));
  provider text := lower(coalesce(event -> 'user' -> 'app_metadata' ->> 'provider', ''));
  user_metadata jsonb := coalesce(
    event -> 'user' -> 'user_metadata',
    event -> 'user' -> 'raw_user_meta_data',
    '{}'::jsonb
  );
begin
  if provider <> 'google' then
    return jsonb_build_object(
      'error',
      jsonb_build_object(
        'http_code',
        403,
        'message',
        'Kobot sign-in must start with Google OAuth.'
      )
    );
  end if;

  if public.is_allowed_sign_in_email(candidate_email, user_metadata) then
    return event;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code',
      403,
      'message',
      'Kobot login is restricted to approved Google accounts.'
    )
  );
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org_id uuid;
  bootstrap_position_id uuid;
  bootstrap_slug citext;
  bootstrap_admin boolean := false;
  account_status text := 'pending';
begin
  select id
  into default_org_id
  from public.organizations
  where slug = 'kobot'
  limit 1;

  if default_org_id is null then
    raise exception 'Default organization not found.';
  end if;

  select bae.org_position_slug
  into bootstrap_slug
  from public.bootstrap_admin_emails bae
  where bae.email = lower(new.email)
  limit 1;

  bootstrap_admin := bootstrap_slug is not null;

  if bootstrap_admin then
    account_status := 'active';
  end if;

  insert into public.profiles (
    id,
    email,
    display_name,
    full_name,
    avatar_url
  )
  values (
    new.id,
    lower(new.email),
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  insert into public.member_accounts (
    user_id,
    organization_id,
    status,
    is_bootstrap_admin,
    approved_at
  )
  values (
    new.id,
    default_org_id,
    account_status,
    bootstrap_admin,
    case when bootstrap_admin then now() else null end
  )
  on conflict (user_id) do nothing;

  if bootstrap_admin then
    select op.id
    into bootstrap_position_id
    from public.org_positions op
    where op.organization_id = default_org_id
      and op.slug = bootstrap_slug
    limit 1;

    if bootstrap_position_id is not null then
      insert into public.org_position_assignments (
        organization_id,
        user_id,
        org_position_id,
        active
      )
      values (
        default_org_id,
        new.id,
        bootstrap_position_id,
        true
      )
      on conflict (organization_id, user_id, org_position_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_user_is_active_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.member_accounts ma
    where ma.user_id = auth.uid()
      and ma.status = 'active'
  );
$$;

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
    where ca.status = 'active'
      and (
        ca.is_bootstrap_admin
        or requested_code in (select code from position_permissions)
        or requested_code in (select code from team_permissions)
      )
  );
$$;

create or replace function public.mark_current_user_has_login_password()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.member_accounts
  set has_login_password = true
  where user_id = auth.uid();

  return found;
end;
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
      p.full_name,
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
        'displayName', b.display_name,
        'fullName', b.full_name,
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

create or replace function public.resolve_login_email(login_id_input text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.email::text
  from public.profiles p
  join public.member_accounts ma
    on ma.user_id = p.id
  where p.login_id = lower(trim(login_id_input))::citext
    and p.login_id is not null
    and ma.has_login_password = true
    and ma.status <> 'rejected'
  limit 1;
$$;

grant execute on function public.get_my_authorization_context() to authenticated;
grant execute on function public.mark_current_user_has_login_password() to authenticated;
grant execute on function public.resolve_login_email(text) to anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.before_user_created_kobot(jsonb) to supabase_auth_admin;
revoke execute on function public.before_user_created_kobot(jsonb) from anon, authenticated, public;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.member_accounts enable row level security;
alter table public.allowed_login_exceptions enable row level security;
alter table public.bootstrap_admin_emails enable row level security;
alter table public.org_positions enable row level security;
alter table public.org_position_assignments enable row level security;
alter table public.teams enable row level security;
alter table public.team_roles enable row level security;
alter table public.team_memberships enable row level security;
alter table public.permissions enable row level security;
alter table public.org_position_permissions enable row level security;
alter table public.team_role_permissions enable row level security;

create policy "organizations_read_active_members"
on public.organizations
for select
using (public.current_user_is_active_member());

create policy "profiles_select_self_or_member_admins"
on public.profiles
for select
using (
  id = auth.uid()
  or public.current_user_has_permission('members.read')
  or public.current_user_has_permission('members.manage')
);

create policy "profiles_update_self_or_member_admins"
on public.profiles
for update
using (
  id = auth.uid()
  or public.current_user_has_permission('members.manage')
)
with check (
  public.current_user_has_permission('members.manage')
  or (
    id = auth.uid()
    and email = (
      select p.email
      from public.profiles p
      where p.id = auth.uid()
    )
  )
);

create policy "member_accounts_select_self_or_member_admins"
on public.member_accounts
for select
using (
  user_id = auth.uid()
  or public.current_user_has_permission('members.read')
  or public.current_user_has_permission('members.manage')
);

create policy "member_accounts_update_admins_only"
on public.member_accounts
for update
using (public.current_user_has_permission('members.manage'))
with check (public.current_user_has_permission('members.manage'));

create policy "allowed_login_exceptions_manage_admins"
on public.allowed_login_exceptions
for all
using (public.current_user_has_permission('exceptions.manage'))
with check (public.current_user_has_permission('exceptions.manage'));

create policy "bootstrap_admin_emails_manage_admins"
on public.bootstrap_admin_emails
for all
using (public.current_user_has_permission('permissions.manage'))
with check (public.current_user_has_permission('permissions.manage'));

create policy "org_positions_read_active_members"
on public.org_positions
for select
using (public.current_user_is_active_member());

create policy "org_positions_manage_admins"
on public.org_positions
for all
using (public.current_user_has_permission('org_positions.manage'))
with check (public.current_user_has_permission('org_positions.manage'));

create policy "org_position_assignments_select_self_or_admins"
on public.org_position_assignments
for select
using (
  user_id = auth.uid()
  or public.current_user_has_permission('members.read')
  or public.current_user_has_permission('members.manage')
);

create policy "org_position_assignments_manage_admins"
on public.org_position_assignments
for all
using (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('permissions.manage')
)
with check (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('permissions.manage')
);

create policy "teams_read_active_members"
on public.teams
for select
using (public.current_user_is_active_member());

create policy "teams_manage_admins"
on public.teams
for all
using (public.current_user_has_permission('teams.manage'))
with check (public.current_user_has_permission('teams.manage'));

create policy "team_roles_read_active_members"
on public.team_roles
for select
using (public.current_user_is_active_member());

create policy "team_roles_manage_admins"
on public.team_roles
for all
using (public.current_user_has_permission('team_roles.manage'))
with check (public.current_user_has_permission('team_roles.manage'));

create policy "team_memberships_select_self_or_admins"
on public.team_memberships
for select
using (
  user_id = auth.uid()
  or public.current_user_has_permission('members.read')
  or public.current_user_has_permission('members.manage')
);

create policy "team_memberships_manage_admins"
on public.team_memberships
for all
using (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('teams.manage')
)
with check (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('teams.manage')
);

create policy "permissions_read_active_members"
on public.permissions
for select
using (public.current_user_is_active_member());

create policy "permissions_manage_admins"
on public.permissions
for all
using (public.current_user_has_permission('permissions.manage'))
with check (public.current_user_has_permission('permissions.manage'));

create policy "org_position_permissions_read_active_members"
on public.org_position_permissions
for select
using (public.current_user_is_active_member());

create policy "org_position_permissions_manage_admins"
on public.org_position_permissions
for all
using (public.current_user_has_permission('permissions.manage'))
with check (public.current_user_has_permission('permissions.manage'));

create policy "team_role_permissions_read_active_members"
on public.team_role_permissions
for select
using (public.current_user_is_active_member());

create policy "team_role_permissions_manage_admins"
on public.team_role_permissions
for all
using (public.current_user_has_permission('permissions.manage'))
with check (public.current_user_has_permission('permissions.manage'));

insert into public.organizations (slug, name)
values ('kobot', 'Kobot')
on conflict (slug) do nothing;

insert into public.bootstrap_admin_emails (email, org_position_slug)
values ('jongha0315@kookmin.ac.kr', 'president')
on conflict (email) do update
set org_position_slug = excluded.org_position_slug;

with org as (
  select id from public.organizations where slug = 'kobot'
)
insert into public.org_positions (organization_id, slug, name, description, is_system)
select org.id, seeded.slug, seeded.name, seeded.description, true
from org
cross join (
  values
    ('president'::citext, 'President'::text, 'Full club administration access'::text),
    ('vice-president'::citext, 'Vice President'::text, 'Organization-wide operations support'::text)
) as seeded(slug, name, description)
on conflict (organization_id, slug) do update
set name = excluded.name,
    description = excluded.description;

with org as (
  select id from public.organizations where slug = 'kobot'
)
insert into public.team_roles (organization_id, slug, name, description, is_system)
select org.id, seeded.slug, seeded.name, seeded.description, true
from org
cross join (
  values
    ('team-lead'::citext, 'Team Lead'::text, 'Leads a team and its permissions'::text),
    ('team-member'::citext, 'Team Member'::text, 'Standard team member role'::text)
) as seeded(slug, name, description)
on conflict (organization_id, slug) do update
set name = excluded.name,
    description = excluded.description;

with org as (
  select id from public.organizations where slug = 'kobot'
)
insert into public.teams (organization_id, slug, name, description, is_active)
select org.id, seeded.slug, seeded.name, seeded.description, true
from org
cross join (
  values
    ('dev-a'::citext, 'Development Team A'::text, 'Kobot development team A'::text),
    ('dev-b'::citext, 'Development Team B'::text, 'Kobot development team B'::text),
    ('dev-c'::citext, 'Development Team C'::text, 'Kobot development team C'::text),
    ('dev-d'::citext, 'Development Team D'::text, 'Kobot development team D'::text),
    ('research'::citext, 'Research Team'::text, 'Research and algorithm track'::text),
    ('web-iot'::citext, 'Web IoT Team'::text, 'Web and IoT track'::text)
) as seeded(slug, name, description)
on conflict (organization_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active;

insert into public.permissions (code, description)
values
  ('admin.access', 'Access to admin-only features'),
  ('dashboard.read', 'Read the member dashboard'),
  ('notifications.read', 'Read notifications'),
  ('announcements.read', 'Read announcements'),
  ('announcements.manage', 'Create and manage announcements'),
  ('members.read', 'Read member directory data'),
  ('members.manage', 'Approve and manage members'),
  ('teams.manage', 'Create and update teams'),
  ('team_roles.manage', 'Create and update team roles'),
  ('org_positions.manage', 'Create and update organization positions'),
  ('exceptions.manage', 'Manage approved exception emails'),
  ('permissions.manage', 'Manage permission catalogs and mappings'),
  ('forms.manage', 'Manage operational forms'),
  ('integrations.manage', 'Manage external integrations'),
  ('resources.read', 'Read shared resources'),
  ('resources.manage', 'Manage shared resources'),
  ('projects.read', 'Read project data'),
  ('projects.manage', 'Manage project data'),
  ('events.read', 'Read event data'),
  ('events.manage', 'Manage event data')
on conflict (code) do update
set description = excluded.description;

with org as (
  select id from public.organizations where slug = 'kobot'
),
position_targets as (
  select op.id as org_position_id, op.slug
  from public.org_positions op
  join org on org.id = op.organization_id
),
permission_targets as (
  select p.id as permission_id, p.code
  from public.permissions p
)
insert into public.org_position_permissions (org_position_id, permission_id)
select position_targets.org_position_id, permission_targets.permission_id
from position_targets
join permission_targets on (
  position_targets.slug = 'president'
  or (
    position_targets.slug = 'vice-president'
    and permission_targets.code <> 'permissions.manage'
  )
)
on conflict do nothing;

with org as (
  select id from public.organizations where slug = 'kobot'
),
role_targets as (
  select tr.id as team_role_id, tr.slug
  from public.team_roles tr
  join org on org.id = tr.organization_id
),
permission_targets as (
  select p.id as permission_id, p.code
  from public.permissions p
)
insert into public.team_role_permissions (team_role_id, permission_id)
select role_targets.team_role_id, permission_targets.permission_id
from role_targets
join permission_targets on (
  (role_targets.slug = 'team-lead' and permission_targets.code in (
    'dashboard.read',
    'notifications.read',
    'announcements.read',
    'members.read',
    'projects.read',
    'projects.manage',
    'resources.read',
    'events.read'
  ))
  or
  (role_targets.slug = 'team-member' and permission_targets.code in (
    'dashboard.read',
    'notifications.read',
    'announcements.read',
    'projects.read',
    'resources.read',
    'events.read'
  ))
)
on conflict do nothing;
