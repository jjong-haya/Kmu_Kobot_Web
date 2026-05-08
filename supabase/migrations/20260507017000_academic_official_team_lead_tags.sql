-- Corrective seed for official team-lead role tags.
--
-- The tag list reads persisted rows from public.member_tags. If a role tag is
-- missing there, the UI has nothing to load. Keep team membership in
-- public.team_memberships and keep display/permission roles in member_tags.

with org as (
  select id from public.organizations where slug = 'kobot'
),
seeded_teams(slug, name, description) as (
  values
    ('research'::citext, 'Research Team'::text, 'Research and algorithm track'::text),
    ('web-iot'::citext, 'Web IoT Team'::text, 'Web and IoT track'::text),
    ('academic'::citext, 'Academic Team'::text, 'Academic affairs and study track'::text)
)
insert into public.teams (organization_id, slug, name, description, is_active)
select org.id, seeded_teams.slug, seeded_teams.name, seeded_teams.description, true
from org
cross join seeded_teams
on conflict (organization_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    updated_at = now();

insert into public.member_tags (slug, label, color, is_system, is_club, description)
values
  (
    'official_team_lead_research',
    '연구 팀장',
    '#b87333',
    false,
    false,
    '공식 연구팀 팀장 역할 태그. 공식 팀장 권한 묶음을 가진다.'
  ),
  (
    'official_team_lead_iot',
    'IOT 팀장',
    '#b87333',
    false,
    false,
    '공식 IOT 팀장 역할 태그. 공식 팀장 권한 묶음을 가진다.'
  ),
  (
    'official_team_lead_academic',
    '학술팀장',
    '#34d399',
    false,
    false,
    '공식 학술팀장 역할 태그. 밝은 에메랄드 질감으로 표시하며 공식 팀장 권한 묶음을 가진다.'
  )
on conflict (slug) do update
set label = excluded.label,
    color = excluded.color,
    is_system = excluded.is_system,
    is_club = excluded.is_club,
    description = excluded.description,
    updated_at = now();

-- Previous corrective migrations briefly modeled an unrequested promotion lead
-- tag. Preserve any accidental assignments by moving them to the requested
-- academic lead tag, then remove the stray role tag so it cannot reappear.
insert into public.member_tag_assignments (user_id, tag_id, assigned_at, assigned_by)
select legacy_assignments.user_id,
       academic_tag.id,
       legacy_assignments.assigned_at,
       legacy_assignments.assigned_by
from public.member_tag_assignments legacy_assignments
join public.member_tags legacy_tag
  on legacy_tag.id = legacy_assignments.tag_id
 and legacy_tag.slug = 'official_team_lead_promotion'
join public.member_tags academic_tag
  on academic_tag.slug = 'official_team_lead_academic'
on conflict (user_id, tag_id) do nothing;

delete from public.member_tags
where slug = 'official_team_lead_promotion';

with team_tag_map(team_slug, tag_slug) as (
  values
    ('research'::citext, 'official_team_lead_research'::text),
    ('web-iot'::citext, 'official_team_lead_iot'::text),
    ('academic'::citext, 'official_team_lead_academic'::text)
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
    ('official_team_lead_academic'::text)
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

with official_team_lead_permissions(permission) as (
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
delete from public.member_tag_permissions mtp
using public.member_tags mt
where mt.id = mtp.tag_id
  and mt.slug = 'official_team_lead_academic'
  and mtp.permission not in (
    select permission from official_team_lead_permissions
  );

with official_team_lead_tags(slug) as (
  values
    ('official_team_lead_a'::text),
    ('official_team_lead_b'::text),
    ('official_team_lead_c'::text),
    ('official_team_lead_d'::text),
    ('official_team_lead_research'::text),
    ('official_team_lead_iot'::text),
    ('official_team_lead_academic'::text)
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
