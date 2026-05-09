-- Keep tag-driven navigation and permissions aligned with the Forms management UI.
-- The legacy org-position permission seed already lets vice presidents manage forms,
-- but member_tags/member_tag_nav are now the UI authority for tag-editing screens.

insert into public.member_tag_permissions (tag_id, permission)
select mt.id, 'forms.manage'
from public.member_tags mt
join public.permissions p
  on p.code = 'forms.manage'
where mt.slug in ('president', 'vice_president', 'vice-president')
on conflict do nothing;

insert into public.member_tag_nav (tag_id, href)
select mt.id, '/member/forms'
from public.member_tags mt
where mt.slug in ('president', 'vice_president', 'vice-president')
on conflict do nothing;
