-- Forms normalization + RLS hardening.
--
-- Why:
--  - Phase 1 (`20260510030000_forms_persistence.sql`) put the entire ClubForm
--    blob (questions + responses + comments + tournament) into `public.forms.data`
--    and granted SELECT/UPDATE to every active member so that applicants could
--    submit responses. That leaks every responder's PII (학번/전화번호/이름) to
--    every other member, and lets any member overwrite the form's questions or
--    status — both unacceptable for a club running PIPA-relevant operations.
--
-- What changes:
--  1. `form_responses` is split into its own table so RLS can guarantee that
--     a respondent only sees their own response (forms.manage sees all).
--  2. `form_comments` is split into its own table with author-only delete.
--  3. `forms.UPDATE` is restricted to the form creator OR a `forms.manage` user.
--  4. `forms.SELECT` stays open to active members because the read model needs
--     questions + status + tournament metadata to render the applicant view.
--     Sensitive responses no longer live there.

-- ---------------------------------------------------------------------------
-- 1. form_responses
-- ---------------------------------------------------------------------------
create table if not exists public.form_responses (
  id text primary key,
  form_id text not null references public.forms (id) on delete cascade,
  respondent_user_id uuid references public.profiles (id) on delete set null,
  respondent_name text not null default '',
  respondent_info jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  constraint form_responses_info_object_check check (jsonb_typeof(respondent_info) = 'object'),
  constraint form_responses_answers_object_check check (jsonb_typeof(answers) = 'object')
);

create index if not exists form_responses_form_id_idx on public.form_responses (form_id);
create index if not exists form_responses_user_id_idx on public.form_responses (respondent_user_id);

alter table public.form_responses enable row level security;

drop policy if exists "form_responses_select_own_or_manager" on public.form_responses;
create policy "form_responses_select_own_or_manager" on public.form_responses
for select
to authenticated
using (
  respondent_user_id = auth.uid()
  or public.current_user_has_permission('forms.manage')
);

drop policy if exists "form_responses_insert_active_members" on public.form_responses;
create policy "form_responses_insert_active_members" on public.form_responses
for insert
to authenticated
with check (
  respondent_user_id = auth.uid()
  and (
    public.current_user_is_active_member()
    or public.current_user_has_permission('forms.manage')
  )
  and exists (
    select 1
    from public.forms f
    where f.id = form_responses.form_id
      and f.status = 'active'
  )
);

drop policy if exists "form_responses_update_managers" on public.form_responses;
create policy "form_responses_update_managers" on public.form_responses
for update
to authenticated
using (public.current_user_has_permission('forms.manage'))
with check (public.current_user_has_permission('forms.manage'));

drop policy if exists "form_responses_delete_managers" on public.form_responses;
create policy "form_responses_delete_managers" on public.form_responses
for delete
to authenticated
using (public.current_user_has_permission('forms.manage'));

grant select, insert, update, delete on public.form_responses to authenticated;

-- ---------------------------------------------------------------------------
-- 2. form_comments
-- ---------------------------------------------------------------------------
create table if not exists public.form_comments (
  id text primary key,
  form_id text not null references public.forms (id) on delete cascade,
  author_user_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null default '',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists form_comments_form_id_idx on public.form_comments (form_id);
create index if not exists form_comments_author_id_idx on public.form_comments (author_user_id);

alter table public.form_comments enable row level security;

drop policy if exists "form_comments_select_active_members" on public.form_comments;
create policy "form_comments_select_active_members" on public.form_comments
for select
to authenticated
using (
  public.current_user_is_active_member()
  or public.current_user_has_permission('forms.manage')
);

drop policy if exists "form_comments_insert_active_members" on public.form_comments;
create policy "form_comments_insert_active_members" on public.form_comments
for insert
to authenticated
with check (
  author_user_id = auth.uid()
  and (
    public.current_user_is_active_member()
    or public.current_user_has_permission('forms.manage')
  )
  and exists (select 1 from public.forms f where f.id = form_comments.form_id)
);

drop policy if exists "form_comments_delete_own_or_manager" on public.form_comments;
create policy "form_comments_delete_own_or_manager" on public.form_comments
for delete
to authenticated
using (
  author_user_id = auth.uid()
  or public.current_user_has_permission('forms.manage')
);

grant select, insert, update, delete on public.form_comments to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Tighten forms UPDATE so only the creator or forms.manage can mutate the
--    form definition. Response submission is now via form_responses, not via
--    forms UPDATE — so this no longer blocks applicants.
-- ---------------------------------------------------------------------------
drop policy if exists "forms_update_active_members" on public.forms;
drop policy if exists "forms_update_creators_or_managers" on public.forms;
create policy "forms_update_creators_or_managers" on public.forms
for update
to authenticated
using (
  created_by = auth.uid()
  or public.current_user_has_permission('forms.manage')
)
with check (
  created_by = auth.uid()
  or public.current_user_has_permission('forms.manage')
);

-- ---------------------------------------------------------------------------
-- 4. Strip embedded responses/comments from any rows already saved during the
--    insecure window (Phase 1 → Phase 2). The new tables are now the source
--    of truth; the application layer reads them with separate queries.
-- ---------------------------------------------------------------------------
update public.forms
set data = jsonb_set(
             jsonb_set(coalesce(data, '{}'::jsonb), '{responses}', '[]'::jsonb, true),
             '{comments}', '[]'::jsonb, true
           )
where data ? 'responses' or data ? 'comments';

-- Schema cache reload so PostgREST picks up new tables without a delay.
notify pgrst, 'reload schema';
