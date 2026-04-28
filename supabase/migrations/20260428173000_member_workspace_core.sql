create extension if not exists pgcrypto;
create extension if not exists citext;

alter table public.profiles
  add column if not exists nickname_display text,
  add column if not exists nickname_slug citext,
  add column if not exists phone text,
  add column if not exists college text,
  add column if not exists department text,
  add column if not exists club_affiliation text,
  add column if not exists public_credit_name_mode text not null default 'anonymous',
  add column if not exists tech_tags text[] not null default '{}'::text[],
  add column if not exists profile_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_public_credit_name_mode_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_public_credit_name_mode_check
      check (public_credit_name_mode in ('anonymous', 'nickname', 'real_name'));
  end if;
end;
$$;

create index if not exists profiles_nickname_slug_idx
  on public.profiles (lower(nickname_slug::text))
  where nickname_slug is not null;

create table if not exists public.nickname_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  previous_nickname text,
  previous_nickname_slug citext,
  new_nickname text,
  new_nickname_slug citext,
  hide_previous_from_members boolean not null default false,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_project_team_id uuid,
  target_official_team_id uuid references public.teams (id) on delete set null,
  action_type text not null,
  entity_table text,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'recorded' check (status in ('recorded', 'voided')),
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year')
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  type text not null,
  title text not null,
  body text,
  channel text not null default 'in_app' check (channel in ('in_app', 'sidebar', 'email')),
  importance text not null default 'normal' check (importance in ('normal', 'important')),
  related_entity_table text,
  related_entity_id uuid,
  href text,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year')
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references public.profiles (id) on delete cascade,
  recipient_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'auto_rejected', 'canceled')),
  reason text not null,
  requested_contact_methods text[] not null default '{}'::text[],
  requester_contact_payload jsonb not null default '{}'::jsonb,
  responder_contact_payload jsonb not null default '{}'::jsonb,
  decision_reason text,
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  spam_reported_at timestamptz,
  spam_reported_by uuid references public.profiles (id) on delete set null,
  requester_deleted_at timestamptz,
  recipient_deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 days'),
  check (requester_user_id <> recipient_user_id)
);

create table if not exists public.contact_request_events (
  id uuid primary key default gen_random_uuid(),
  contact_request_id uuid not null references public.contact_requests (id) on delete cascade,
  actor_user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  previous_status text,
  new_status text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.project_teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  official_team_id uuid references public.teams (id) on delete set null,
  slug citext not null,
  name text not null,
  summary text,
  description text,
  project_type text not null default 'autonomous' check (project_type in ('official_based', 'personal', 'autonomous')),
  visibility text not null default 'private' check (visibility in ('public', 'private')),
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected', 'archived')),
  owner_user_id uuid references public.profiles (id) on delete set null,
  lead_user_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  approved_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  archived_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'audit_logs_target_project_team_id_fkey'
      and conrelid = 'public.audit_logs'::regclass
  ) then
    alter table public.audit_logs
      add constraint audit_logs_target_project_team_id_fkey
      foreign key (target_project_team_id)
      references public.project_teams (id)
      on delete set null;
  end if;
end;
$$;

create table if not exists public.project_team_memberships (
  id uuid primary key default gen_random_uuid(),
  project_team_id uuid not null references public.project_teams (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('lead', 'maintainer', 'member', 'delegate')),
  status text not null default 'active' check (status in ('invited', 'active', 'left', 'removed')),
  nickname_snapshot text,
  display_name_snapshot text,
  assigned_by uuid references public.profiles (id) on delete set null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (project_team_id, user_id)
);

create table if not exists public.project_team_join_requests (
  id uuid primary key default gen_random_uuid(),
  project_team_id uuid not null references public.project_teams (id) on delete cascade,
  requester_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'canceled', 'expired')),
  reason text,
  review_reason text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invitation_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  target_type text not null check (target_type in ('member', 'official_team', 'project_team')),
  project_team_id uuid references public.project_teams (id) on delete cascade,
  official_team_id uuid references public.teams (id) on delete cascade,
  code_hash text not null unique,
  label text,
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'expired')),
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  revoked_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '5 days'),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  official_team_id uuid references public.teams (id) on delete set null,
  project_team_id uuid references public.project_teams (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  title text not null,
  description text,
  vote_type text not null default 'single_choice' check (vote_type in ('approval', 'single_choice', 'multiple_choice', 'election')),
  anonymity text not null default 'anonymous' check (anonymity in ('anonymous', 'named')),
  result_visibility text not null default 'after_close' check (result_visibility in ('after_close', 'immediate', 'hidden')),
  eligibility_scope text not null default 'all_active_members' check (eligibility_scope in ('all_active_members', 'official_team', 'project_team', 'custom')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'closed', 'canceled')),
  max_choices integer check (max_choices is null or max_choices > 0),
  allow_nominations boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  closed_at timestamptz,
  result_summary jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vote_options (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes (id) on delete cascade,
  label text not null,
  description text,
  sort_order integer not null default 0,
  candidate_user_id uuid references public.profiles (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.vote_ballots (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes (id) on delete cascade,
  voter_user_id uuid not null references public.profiles (id) on delete cascade,
  voter_scope_snapshot jsonb not null default '{}'::jsonb,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (vote_id, voter_user_id)
);

create table if not exists public.vote_ballot_options (
  ballot_id uuid not null references public.vote_ballots (id) on delete cascade,
  option_id uuid not null references public.vote_options (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ballot_id, option_id)
);

create table if not exists public.vote_nominations (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes (id) on delete cascade,
  nominee_user_id uuid not null references public.profiles (id) on delete cascade,
  nominated_by uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  response_reason text,
  responded_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (vote_id, nominee_user_id)
);

create table if not exists public.role_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  request_type text not null check (request_type in ('president_transfer', 'org_position_transfer', 'official_team_lead_transfer', 'project_team_lead_transfer')),
  target_org_position_id uuid references public.org_positions (id) on delete set null,
  target_official_team_id uuid references public.teams (id) on delete set null,
  target_project_team_id uuid references public.project_teams (id) on delete set null,
  from_user_id uuid references public.profiles (id) on delete set null,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'canceled', 'expired', 'applied')),
  previous_holder_after_status text,
  reason text,
  response_reason text,
  responded_by uuid references public.profiles (id) on delete set null,
  responded_at timestamptz,
  applied_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 days')
);

create table if not exists public.authority_delegations (
  id uuid primary key default gen_random_uuid(),
  project_team_id uuid not null references public.project_teams (id) on delete cascade,
  delegator_user_id uuid not null references public.profiles (id) on delete cascade,
  delegate_user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'revoked', 'expired')),
  scope text[] not null default array['invite_members', 'review_join_requests', 'manage_project_materials', 'manage_activity_logs']::text[],
  reason text,
  response_reason text,
  starts_at timestamptz not null default now(),
  accepted_at timestamptz,
  rejected_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  metadata jsonb not null default '{}'::jsonb,
  check (delegator_user_id <> delegate_user_id),
  check (expires_at <= starts_at + interval '7 days')
);

create table if not exists public.member_exit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  requested_by uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'canceled', 'completed')),
  reason text,
  review_reason text,
  requested_public_credit_name_mode text not null default 'anonymous' check (requested_public_credit_name_mode in ('anonymous', 'nickname', 'real_name')),
  retain_contribution_snapshots boolean not null default true,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audit_logs_expires_at_idx on public.audit_logs (expires_at);
create index if not exists notifications_recipient_unread_idx on public.notifications (recipient_user_id, created_at desc) where read_at is null and deleted_at is null;
create index if not exists contact_requests_pending_expires_idx on public.contact_requests (expires_at) where status = 'pending';
create index if not exists project_team_memberships_user_status_idx on public.project_team_memberships (user_id, status);
create index if not exists project_team_memberships_project_role_idx on public.project_team_memberships (project_team_id, role, status);
create index if not exists invitation_codes_expires_idx on public.invitation_codes (expires_at) where status = 'active';
create index if not exists votes_org_status_idx on public.votes (organization_id, status, starts_at desc);
create index if not exists vote_ballots_voter_idx on public.vote_ballots (voter_user_id, submitted_at desc);

create or replace function public.normalize_nickname_slug(input_nickname text)
returns text
language plpgsql
immutable
as $$
declare
  trimmed text;
  squashed text;
begin
  if input_nickname is null then
    return null;
  end if;

  trimmed := btrim(input_nickname);
  if trimmed = '' then
    return null;
  end if;

  if position('_' in trimmed) > 0 then
    raise exception 'Nickname cannot contain underscores. Use spaces instead.';
  end if;

  squashed := regexp_replace(trimmed, '[[:space:]]+', ' ', 'g');
  if char_length(squashed) < 2 or char_length(squashed) > 12 then
    raise exception 'Nickname must be between 2 and 12 characters.';
  end if;

  if squashed !~ '^[0-9A-Za-z가-힣 ]+$' then
    raise exception 'Nickname can contain only Korean, English letters, numbers, and spaces.';
  end if;

  return lower(regexp_replace(squashed, '[[:space:]]+', '_', 'g'));
end;
$$;

create or replace function public.assert_active_nickname_available(target_user_id uuid, target_nickname_slug citext)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_nickname_slug is null then
    return;
  end if;

  if not exists (
    select 1 from public.member_accounts
    where user_id = target_user_id and status = 'active'
  ) then
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(lower(target_nickname_slug::text)));

  if exists (
    select 1
    from public.profiles p
    join public.member_accounts ma on ma.user_id = p.id
    where p.id <> target_user_id
      and ma.status = 'active'
      and lower(p.nickname_slug::text) = lower(target_nickname_slug::text)
  ) then
    raise exception 'Nickname is already used by another active member.';
  end if;
end;
$$;

create or replace function public.normalize_profile_nickname()
returns trigger
language plpgsql
as $$
begin
  if new.nickname_display is null or btrim(new.nickname_display) = '' then
    new.nickname_display = null;
    new.nickname_slug = null;
  else
    new.nickname_display = regexp_replace(btrim(new.nickname_display), '[[:space:]]+', ' ', 'g');
    new.nickname_slug = public.normalize_nickname_slug(new.nickname_display)::citext;
  end if;

  perform public.assert_active_nickname_available(new.id, new.nickname_slug);
  return new;
end;
$$;

create or replace function public.record_nickname_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.nickname_slug is distinct from new.nickname_slug then
    insert into public.nickname_histories (
      user_id, previous_nickname, previous_nickname_slug,
      new_nickname, new_nickname_slug, changed_by
    ) values (
      new.id, old.nickname_display, old.nickname_slug, new.nickname_display, new.nickname_slug, auth.uid()
    );
  end if;
  return new;
end;
$$;

create or replace function public.validate_member_account_active_nickname()
returns trigger
language plpgsql
as $$
declare
  profile_nickname_slug citext;
  should_check boolean := false;
begin
  if tg_op = 'INSERT' then
    should_check := true;
  elsif tg_op = 'UPDATE' then
    should_check := old.status is distinct from new.status;
  end if;

  if new.status = 'active' and should_check then
    select nickname_slug into profile_nickname_slug
    from public.profiles
    where id = new.user_id;

    perform public.assert_active_nickname_available(new.user_id, profile_nickname_slug);
  end if;
  return new;
end;
$$;

create or replace function public.current_user_is_project_team_lead(target_project_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.project_team_memberships
    where project_team_id = target_project_team_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('lead', 'maintainer')
  )
  or exists (
    select 1 from public.authority_delegations
    where project_team_id = target_project_team_id
      and delegate_user_id = auth.uid()
      and status = 'accepted'
      and starts_at <= now()
      and expires_at > now()
  );
$$;

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
        (pt.status = 'active' and pt.visibility = 'public' and public.current_user_is_active_member())
        or public.current_user_has_permission('projects.read')
        or public.current_user_has_permission('projects.manage')
        or exists (
          select 1 from public.project_team_memberships ptm
          where ptm.project_team_id = pt.id
            and ptm.user_id = auth.uid()
            and ptm.status = 'active'
        )
        or exists (
          select 1 from public.team_memberships tm
          where tm.team_id = pt.official_team_id
            and tm.user_id = auth.uid()
            and tm.active = true
        )
      )
  );
$$;

create or replace function public.create_audit_log(
  action_type text,
  target_user_id uuid default null,
  target_project_team_id uuid default null,
  target_official_team_id uuid default null,
  entity_table text default null,
  entity_id uuid default null,
  old_data jsonb default null,
  new_data jsonb default null,
  reason text default null,
  metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_id uuid;
begin
  insert into public.audit_logs (
    actor_user_id, target_user_id, target_project_team_id, target_official_team_id,
    action_type, entity_table, entity_id, old_data, new_data, reason, metadata
  ) values (
    auth.uid(), target_user_id, target_project_team_id, target_official_team_id,
    action_type, entity_table, entity_id, old_data, new_data, reason, coalesce(metadata, '{}'::jsonb)
  )
  returning id into inserted_id;

  return inserted_id;
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

drop trigger if exists profiles_normalize_nickname on public.profiles;
create trigger profiles_normalize_nickname
before insert or update of nickname_display, nickname_slug on public.profiles
for each row execute function public.normalize_profile_nickname();

drop trigger if exists profiles_record_nickname_history on public.profiles;
create trigger profiles_record_nickname_history
after update of nickname_display, nickname_slug on public.profiles
for each row execute function public.record_nickname_history();

drop trigger if exists member_accounts_validate_active_nickname on public.member_accounts;
create trigger member_accounts_validate_active_nickname
before insert or update of status on public.member_accounts
for each row execute function public.validate_member_account_active_nickname();

drop trigger if exists contact_requests_set_updated_at on public.contact_requests;
create trigger contact_requests_set_updated_at before update on public.contact_requests
for each row execute function public.set_updated_at();
drop trigger if exists project_teams_set_updated_at on public.project_teams;
create trigger project_teams_set_updated_at before update on public.project_teams
for each row execute function public.set_updated_at();
drop trigger if exists votes_set_updated_at on public.votes;
create trigger votes_set_updated_at before update on public.votes
for each row execute function public.set_updated_at();

drop trigger if exists project_team_join_requests_set_updated_at on public.project_team_join_requests;
create trigger project_team_join_requests_set_updated_at before update on public.project_team_join_requests
for each row execute function public.set_updated_at();

drop trigger if exists role_transfer_requests_set_updated_at on public.role_transfer_requests;
create trigger role_transfer_requests_set_updated_at before update on public.role_transfer_requests
for each row execute function public.set_updated_at();

drop trigger if exists authority_delegations_set_updated_at on public.authority_delegations;
create trigger authority_delegations_set_updated_at before update on public.authority_delegations
for each row execute function public.set_updated_at();

drop trigger if exists member_exit_requests_set_updated_at on public.member_exit_requests;
create trigger member_exit_requests_set_updated_at before update on public.member_exit_requests
for each row execute function public.set_updated_at();

grant execute on function public.normalize_nickname_slug(text) to anon, authenticated;
grant execute on function public.get_my_authorization_context() to authenticated;
grant execute on function public.can_read_private_project(uuid) to authenticated;
grant execute on function public.create_audit_log(text, uuid, uuid, uuid, text, uuid, jsonb, jsonb, text, jsonb) to authenticated;

alter table public.nickname_histories enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_requests enable row level security;
alter table public.contact_request_events enable row level security;
alter table public.project_teams enable row level security;
alter table public.project_team_memberships enable row level security;
alter table public.project_team_join_requests enable row level security;
alter table public.invitation_codes enable row level security;
alter table public.votes enable row level security;
alter table public.vote_options enable row level security;
alter table public.vote_ballots enable row level security;
alter table public.vote_ballot_options enable row level security;
alter table public.vote_nominations enable row level security;
alter table public.role_transfer_requests enable row level security;
alter table public.authority_delegations enable row level security;
alter table public.member_exit_requests enable row level security;

drop policy if exists "nickname_histories_select_self_or_member_admins" on public.nickname_histories;
create policy "nickname_histories_select_self_or_member_admins" on public.nickname_histories
for select using (
  user_id = auth.uid()
  or public.current_user_has_permission('members.read')
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "audit_logs_select_admins_or_project_leads" on public.audit_logs;
create policy "audit_logs_select_admins_or_project_leads" on public.audit_logs
for select using (
  public.current_user_has_permission('admin.access')
  or public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('projects.manage')
  or (target_project_team_id is not null and public.current_user_is_project_team_lead(target_project_team_id))
);

drop policy if exists "audit_logs_insert_active_members" on public.audit_logs;
create policy "audit_logs_insert_active_members" on public.audit_logs
for insert with check (public.current_user_is_active_member());

drop policy if exists "notifications_select_own_or_admins" on public.notifications;
create policy "notifications_select_own_or_admins" on public.notifications
for select using (recipient_user_id = auth.uid() or public.current_user_has_permission('members.manage'));

drop policy if exists "notifications_update_own_or_admins" on public.notifications;
create policy "notifications_update_own_or_admins" on public.notifications
for update using (recipient_user_id = auth.uid() or public.current_user_has_permission('members.manage'))
with check (recipient_user_id = auth.uid() or public.current_user_has_permission('members.manage'));

drop policy if exists "contact_requests_select_participants_or_admins" on public.contact_requests;
create policy "contact_requests_select_participants_or_admins" on public.contact_requests
for select using (
  requester_user_id = auth.uid()
  or recipient_user_id = auth.uid()
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "contact_requests_insert_active_requester" on public.contact_requests;
create policy "contact_requests_insert_active_requester" on public.contact_requests
for insert with check (requester_user_id = auth.uid() and public.current_user_is_active_member());

drop policy if exists "contact_requests_update_participants_or_admins" on public.contact_requests;
create policy "contact_requests_update_participants_or_admins" on public.contact_requests
for update using (
  requester_user_id = auth.uid()
  or recipient_user_id = auth.uid()
  or public.current_user_has_permission('members.manage')
) with check (
  requester_user_id = auth.uid()
  or recipient_user_id = auth.uid()
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "contact_request_events_select_participants_or_admins" on public.contact_request_events;
create policy "contact_request_events_select_participants_or_admins" on public.contact_request_events
for select using (
  exists (
    select 1 from public.contact_requests cr
    where cr.id = contact_request_id
      and (cr.requester_user_id = auth.uid() or cr.recipient_user_id = auth.uid() or public.current_user_has_permission('members.manage'))
  )
);

drop policy if exists "contact_request_events_insert_participants_or_admins" on public.contact_request_events;
create policy "contact_request_events_insert_participants_or_admins" on public.contact_request_events
for insert with check (
  exists (
    select 1 from public.contact_requests cr
    where cr.id = contact_request_id
      and (cr.requester_user_id = auth.uid() or cr.recipient_user_id = auth.uid() or public.current_user_has_permission('members.manage'))
  )
);

drop policy if exists "project_teams_select_readable" on public.project_teams;
create policy "project_teams_select_readable" on public.project_teams
for select using (public.can_read_private_project(id));

drop policy if exists "project_teams_insert_active_members" on public.project_teams;
create policy "project_teams_insert_active_members" on public.project_teams
for insert with check (public.current_user_is_active_member() and created_by = auth.uid());

drop policy if exists "project_teams_update_admins_or_leads" on public.project_teams;
create policy "project_teams_update_admins_or_leads" on public.project_teams
for update using (
  public.current_user_has_permission('projects.manage') or public.current_user_is_project_team_lead(id)
) with check (
  public.current_user_has_permission('projects.manage') or public.current_user_is_project_team_lead(id)
);

drop policy if exists "project_team_memberships_select_readable_project" on public.project_team_memberships;
create policy "project_team_memberships_select_readable_project" on public.project_team_memberships
for select using (public.can_read_private_project(project_team_id));

drop policy if exists "project_team_memberships_manage_admins_or_leads" on public.project_team_memberships;
create policy "project_team_memberships_manage_admins_or_leads" on public.project_team_memberships
for all using (
  public.current_user_has_permission('projects.manage') or public.current_user_is_project_team_lead(project_team_id)
) with check (
  public.current_user_has_permission('projects.manage') or public.current_user_is_project_team_lead(project_team_id)
);

drop policy if exists "project_team_join_requests_select_self_or_leads" on public.project_team_join_requests;
create policy "project_team_join_requests_select_self_or_leads" on public.project_team_join_requests
for select using (
  requester_user_id = auth.uid()
  or public.current_user_has_permission('projects.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

drop policy if exists "project_team_join_requests_insert_self" on public.project_team_join_requests;
create policy "project_team_join_requests_insert_self" on public.project_team_join_requests
for insert with check (requester_user_id = auth.uid() and public.current_user_is_active_member());

drop policy if exists "project_team_join_requests_update_self_or_leads" on public.project_team_join_requests;
create policy "project_team_join_requests_update_self_or_leads" on public.project_team_join_requests
for update using (
  requester_user_id = auth.uid()
  or public.current_user_has_permission('projects.manage')
  or public.current_user_is_project_team_lead(project_team_id)
) with check (
  requester_user_id = auth.uid()
  or public.current_user_has_permission('projects.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

drop policy if exists "invitation_codes_select_admins_or_leads" on public.invitation_codes;
create policy "invitation_codes_select_admins_or_leads" on public.invitation_codes
for select using (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('projects.manage')
  or (project_team_id is not null and public.current_user_is_project_team_lead(project_team_id))
);

drop policy if exists "invitation_codes_manage_admins_or_leads" on public.invitation_codes;
create policy "invitation_codes_manage_admins_or_leads" on public.invitation_codes
for all using (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('projects.manage')
  or (project_team_id is not null and public.current_user_is_project_team_lead(project_team_id))
) with check (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('projects.manage')
  or (project_team_id is not null and public.current_user_is_project_team_lead(project_team_id))
);

drop policy if exists "votes_select_eligible_scope" on public.votes;
create policy "votes_select_eligible_scope" on public.votes
for select using (
  public.current_user_has_permission('members.manage')
  or (eligibility_scope = 'all_active_members' and public.current_user_is_active_member())
  or (eligibility_scope = 'project_team' and project_team_id is not null and public.can_read_private_project(project_team_id))
  or (
    eligibility_scope = 'official_team'
    and exists (
      select 1 from public.team_memberships tm
      where tm.team_id = official_team_id and tm.user_id = auth.uid() and tm.active = true
    )
  )
);

drop policy if exists "votes_manage_admins_or_leads" on public.votes;
create policy "votes_manage_admins_or_leads" on public.votes
for all using (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('projects.manage')
  or (project_team_id is not null and public.current_user_is_project_team_lead(project_team_id))
) with check (
  public.current_user_has_permission('members.manage')
  or public.current_user_has_permission('projects.manage')
  or (project_team_id is not null and public.current_user_is_project_team_lead(project_team_id))
);

drop policy if exists "vote_options_select_with_vote" on public.vote_options;
create policy "vote_options_select_with_vote" on public.vote_options
for select using (exists (select 1 from public.votes v where v.id = vote_id));

drop policy if exists "vote_options_manage_vote_managers" on public.vote_options;
create policy "vote_options_manage_vote_managers" on public.vote_options
for all using (
  exists (
    select 1 from public.votes v
    where v.id = vote_id
      and (
        public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('projects.manage')
        or (v.project_team_id is not null and public.current_user_is_project_team_lead(v.project_team_id))
      )
  )
) with check (
  exists (
    select 1 from public.votes v
    where v.id = vote_id
      and (
        public.current_user_has_permission('members.manage')
        or public.current_user_has_permission('projects.manage')
        or (v.project_team_id is not null and public.current_user_is_project_team_lead(v.project_team_id))
      )
  )
);

drop policy if exists "vote_ballots_select_self_or_admins" on public.vote_ballots;
create policy "vote_ballots_select_self_or_admins" on public.vote_ballots
for select using (voter_user_id = auth.uid() or public.current_user_has_permission('members.manage'));

drop policy if exists "vote_ballots_insert_self" on public.vote_ballots;
create policy "vote_ballots_insert_self" on public.vote_ballots
for insert with check (voter_user_id = auth.uid() and public.current_user_is_active_member());

drop policy if exists "vote_ballot_options_select_own_ballot_or_admins" on public.vote_ballot_options;
create policy "vote_ballot_options_select_own_ballot_or_admins" on public.vote_ballot_options
for select using (
  exists (
    select 1 from public.vote_ballots vb
    where vb.id = ballot_id and (vb.voter_user_id = auth.uid() or public.current_user_has_permission('members.manage'))
  )
);

drop policy if exists "vote_ballot_options_insert_own_ballot" on public.vote_ballot_options;
create policy "vote_ballot_options_insert_own_ballot" on public.vote_ballot_options
for insert with check (
  exists (select 1 from public.vote_ballots vb where vb.id = ballot_id and vb.voter_user_id = auth.uid())
);

drop policy if exists "vote_nominations_select_involved_or_admins" on public.vote_nominations;
create policy "vote_nominations_select_involved_or_admins" on public.vote_nominations
for select using (
  nominee_user_id = auth.uid()
  or nominated_by = auth.uid()
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "vote_nominations_manage_involved_or_admins" on public.vote_nominations;
create policy "vote_nominations_manage_involved_or_admins" on public.vote_nominations
for all using (
  nominee_user_id = auth.uid()
  or nominated_by = auth.uid()
  or public.current_user_has_permission('members.manage')
) with check (
  nominee_user_id = auth.uid()
  or nominated_by = auth.uid()
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "role_transfer_requests_select_involved_or_admins" on public.role_transfer_requests;
create policy "role_transfer_requests_select_involved_or_admins" on public.role_transfer_requests
for select using (
  from_user_id = auth.uid()
  or to_user_id = auth.uid()
  or requested_by = auth.uid()
  or public.current_user_has_permission('permissions.manage')
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "role_transfer_requests_manage_involved_or_admins" on public.role_transfer_requests;
create policy "role_transfer_requests_manage_involved_or_admins" on public.role_transfer_requests
for all using (
  from_user_id = auth.uid()
  or to_user_id = auth.uid()
  or requested_by = auth.uid()
  or public.current_user_has_permission('permissions.manage')
  or public.current_user_has_permission('members.manage')
) with check (
  from_user_id = auth.uid()
  or to_user_id = auth.uid()
  or requested_by = auth.uid()
  or public.current_user_has_permission('permissions.manage')
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "authority_delegations_select_involved_or_leads" on public.authority_delegations;
create policy "authority_delegations_select_involved_or_leads" on public.authority_delegations
for select using (
  delegator_user_id = auth.uid()
  or delegate_user_id = auth.uid()
  or public.current_user_has_permission('projects.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

drop policy if exists "authority_delegations_manage_involved_or_leads" on public.authority_delegations;
create policy "authority_delegations_manage_involved_or_leads" on public.authority_delegations
for all using (
  delegator_user_id = auth.uid()
  or delegate_user_id = auth.uid()
  or public.current_user_has_permission('projects.manage')
  or public.current_user_is_project_team_lead(project_team_id)
) with check (
  delegator_user_id = auth.uid()
  or delegate_user_id = auth.uid()
  or public.current_user_has_permission('projects.manage')
  or public.current_user_is_project_team_lead(project_team_id)
);

drop policy if exists "member_exit_requests_select_self_or_admins" on public.member_exit_requests;
create policy "member_exit_requests_select_self_or_admins" on public.member_exit_requests
for select using (
  user_id = auth.uid()
  or requested_by = auth.uid()
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "member_exit_requests_insert_self_or_admins" on public.member_exit_requests;
create policy "member_exit_requests_insert_self_or_admins" on public.member_exit_requests
for insert with check (
  user_id = auth.uid()
  or requested_by = auth.uid()
  or public.current_user_has_permission('members.manage')
);

drop policy if exists "member_exit_requests_update_self_or_admins" on public.member_exit_requests;
create policy "member_exit_requests_update_self_or_admins" on public.member_exit_requests
for update using (
  user_id = auth.uid()
  or requested_by = auth.uid()
  or public.current_user_has_permission('members.manage')
) with check (
  user_id = auth.uid()
  or requested_by = auth.uid()
  or public.current_user_has_permission('members.manage')
);
