alter table public.events
add column if not exists image_url text,
add column if not exists form_id text,
add column if not exists form_title text;

comment on column public.events.image_url is
'Representative event image URL or image data URL owned by the events domain.';

comment on column public.events.form_id is
'Optional reference to a KOBOT form selected for event participation. The form content remains owned by the forms domain.';

comment on column public.events.form_title is
'Snapshot label for the selected participation form so event cards can render a stable call to action.';
