-- Assign the current president as data.
-- UI badges must derive from org_position_assignments, not from login_id checks.

with target_profile as (
  select id
  from public.profiles
  where login_id = 'hu0315'::citext
  limit 1
),
target_position as (
  select
    op.organization_id,
    op.id as org_position_id
  from public.org_positions op
  join public.organizations org
    on org.id = op.organization_id
  where org.slug = 'kobot'::citext
    and op.slug = 'president'::citext
  limit 1
)
insert into public.org_position_assignments (
  organization_id,
  user_id,
  org_position_id,
  active
)
select
  target_position.organization_id,
  target_profile.id,
  target_position.org_position_id,
  true
from target_profile
cross join target_position
on conflict (organization_id, user_id, org_position_id) do update
set
  active = true,
  assigned_at = case
    when public.org_position_assignments.active then public.org_position_assignments.assigned_at
    else now()
  end;
