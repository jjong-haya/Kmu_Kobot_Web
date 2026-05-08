-- Static display icon for member tags.
-- This belongs to public.member_tags because it is part of the tag definition
-- itself, not a per-member assignment, permission, nav path, or temporary UI edit.

alter table public.member_tags
  add column if not exists icon_name text;

alter table public.member_tags
  drop constraint if exists member_tags_icon_name_format;

alter table public.member_tags
  add constraint member_tags_icon_name_format
  check (
    icon_name is null
    or icon_name ~ '^[A-Za-z][A-Za-z0-9]{0,63}$'
  );

comment on column public.member_tags.icon_name is
  'Optional Lucide icon component name used by TagChip. Static tag display setting only.';

update public.member_tags
   set icon_name = case slug
     when 'kobot' then 'Bot'
     when 'president' then 'Crown'
     when 'vice_president' then 'Crown'
     when 'vice-president' then 'Crown'
     else icon_name
   end
 where icon_name is null
   and slug in ('kobot', 'president', 'vice_president', 'vice-president');
