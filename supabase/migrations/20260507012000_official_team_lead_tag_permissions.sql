-- Official team-lead role tags must carry authorization, not only display.
--
-- Research and IOT team leads receive the same capability bundle as the
-- existing official team lead role. Promotion team leads receive that bundle
-- plus event creation, without granting full event management.

insert into public.permissions (code, description)
values
  ('events.create', 'Create club events')
on conflict (code) do update
set description = excluded.description;

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
    '공식 연구팀 팀장 역할 태그. 동색 질감으로 표시한다.'
  ),
  (
    'official_team_lead_iot',
    'IOT 팀장',
    '#b87333',
    false,
    '공식 IOT 팀장 역할 태그. 동색 질감으로 표시한다.'
  ),
  (
    'official_team_lead_promotion',
    '홍보팀장',
    '#10b981',
    false,
    '공식 홍보팀장 역할 태그. 에메랄드 질감으로 표시하며 행사 생성 권한을 가진다.'
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

with official_team_lead_tags(slug) as (
  values
    ('official_team_lead_a'::text),
    ('official_team_lead_b'::text),
    ('official_team_lead_c'::text),
    ('official_team_lead_d'::text),
    ('official_team_lead_research'::text),
    ('official_team_lead_iot'::text),
    ('official_team_lead_promotion'::text)
),
official_team_lead_permissions(permission) as (
  values
    ('dashboard.read'::text),
    ('notifications.read'::text),
    ('announcements.read'::text),
    ('members.read'::text),
    ('projects.read'::text),
    ('projects.manage'::text),
    ('resources.read'::text),
    ('events.read'::text)
)
insert into public.member_tag_permissions (tag_id, permission)
select mt.id, p.permission
from public.member_tags mt
join official_team_lead_tags target
  on target.slug = mt.slug
cross join official_team_lead_permissions p
join public.permissions existing_permission
  on existing_permission.code = p.permission
on conflict do nothing;

insert into public.member_tag_permissions (tag_id, permission)
select mt.id, 'events.create'
from public.member_tags mt
join public.permissions existing_permission
  on existing_permission.code = 'events.create'
where mt.slug = 'official_team_lead_promotion'
on conflict do nothing;

with official_team_lead_tags(slug) as (
  values
    ('official_team_lead_a'::text),
    ('official_team_lead_b'::text),
    ('official_team_lead_c'::text),
    ('official_team_lead_d'::text),
    ('official_team_lead_research'::text),
    ('official_team_lead_iot'::text),
    ('official_team_lead_promotion'::text)
),
official_team_lead_nav(href) as (
  values
    ('/member'::text),
    ('/member/notifications'::text),
    ('/member/announcements'::text),
    ('/member/contact-requests'::text),
    ('/member/study-log'::text),
    ('/member/study-playlist'::text),
    ('/member/projects'::text),
    ('/member/events'::text),
    ('/member/members'::text),
    ('/member/resources'::text),
    ('/member/space-booking'::text),
    ('/member/equipment'::text),
    ('/member/votes'::text),
    ('/member/quests'::text),
    ('/member/peer-review'::text),
    ('/member/showcase'::text),
    ('/member/project-admin'::text)
)
insert into public.member_tag_nav (tag_id, href)
select mt.id, nav.href
from public.member_tags mt
join official_team_lead_tags target
  on target.slug = mt.slug
cross join official_team_lead_nav nav
on conflict do nothing;
