-- Official team-lead role tags for non-development teams.
--
-- Team membership stays in public.team_memberships.
-- Display/permission roles stay in public.member_tags and public.member_tag_assignments.

with org as (
  select id from public.organizations where slug = 'kobot'
)
insert into public.teams (organization_id, slug, name, description, is_active)
select org.id, seeded.slug, seeded.name, seeded.description, true
from org
cross join (
  values
    ('promotion'::citext, 'Promotion Team'::text, 'Promotion and communications track'::text)
) as seeded(slug, name, description)
on conflict (organization_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.member_tags (slug, label, color, is_system, description)
values
  (
    'official_team_lead_research',
    '연구팀 팀장',
    '#b87333',
    false,
    '공식 연구팀 팀장 역할 태그. 동 질감으로 표시된다.'
  ),
  (
    'official_team_lead_iot',
    'IOT 팀장',
    '#b87333',
    false,
    '공식 IOT 팀장 역할 태그. 동 질감으로 표시된다.'
  ),
  (
    'official_team_lead_promotion',
    '홍보팀장',
    '#10b981',
    false,
    '공식 홍보팀장 역할 태그. 에메랄드 질감으로 표시된다.'
  )
on conflict (slug) do update
set label = excluded.label,
    color = excluded.color,
    is_system = excluded.is_system,
    description = excluded.description,
    updated_at = now();

with team_tag_map(team_slug, tag_slug) as (
  values
    ('research'::citext, 'official_team_lead_research'::text),
    ('web-iot'::citext, 'official_team_lead_iot'::text),
    ('promotion'::citext, 'official_team_lead_promotion'::text)
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
