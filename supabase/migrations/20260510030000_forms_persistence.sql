-- Forms persistence: move ClubForm out of browser localStorage into Supabase.
-- Phase 1 — single table, ClubForm shape stored in `data` JSONB so the browser
-- read/write paths can adopt Supabase with minimal API surface change.
-- Responses + comments stay inside the JSONB blob for now; if write contention
-- becomes a problem we split them into separate tables in a follow-up.

create table if not exists public.forms (
  id text primary key,
  title text not null default '',
  status text not null default 'draft',
  category text not null default 'operations',
  data jsonb not null,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint forms_status_check check (status in ('draft', 'active', 'closed')),
  constraint forms_category_check check (category in ('participant_survey', 'event_registration', 'operations', 'feedback')),
  constraint forms_data_object_check check (jsonb_typeof(data) = 'object')
);

create index if not exists forms_updated_at_idx on public.forms (updated_at desc);
create index if not exists forms_status_idx on public.forms (status);
create index if not exists forms_created_by_idx on public.forms (created_by);

drop trigger if exists forms_set_updated_at on public.forms;
create trigger forms_set_updated_at
before update on public.forms
for each row execute function public.set_updated_at();

alter table public.forms enable row level security;

-- SELECT: any active member can list forms (applicants need to read the form
-- to submit a response). Read model redaction (hiding manager-only fields like
-- responses/comments/tournament internals) is the application layer's job —
-- see redactFormForApplicant in src/app/api/forms.ts.
drop policy if exists "forms_select_active_members" on public.forms;
create policy "forms_select_active_members" on public.forms
for select
to authenticated
using (
  public.current_user_is_active_member()
  or public.current_user_has_permission('forms.manage')
);

-- INSERT: forms.manage permission required (회장/부회장 only).
drop policy if exists "forms_insert_managers" on public.forms;
create policy "forms_insert_managers" on public.forms
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.current_user_has_permission('forms.manage')
);

-- UPDATE: form creator OR forms.manage. Note: applicant submitting a response
-- WILL go through UPDATE (since responses live inside the JSONB blob in this
-- phase). To allow that, active members can also UPDATE — but only the
-- application layer should touch responses/comments fields. A future
-- normalization PR will move responses/comments to dedicated tables with
-- finer-grained policies.
drop policy if exists "forms_update_active_members" on public.forms;
create policy "forms_update_active_members" on public.forms
for update
to authenticated
using (
  public.current_user_is_active_member()
  or public.current_user_has_permission('forms.manage')
)
with check (
  public.current_user_is_active_member()
  or public.current_user_has_permission('forms.manage')
);

drop policy if exists "forms_delete_managers" on public.forms;
create policy "forms_delete_managers" on public.forms
for delete
to authenticated
using (public.current_user_has_permission('forms.manage'));

grant select, insert, update, delete on public.forms to authenticated;
