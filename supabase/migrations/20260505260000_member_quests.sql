-- Member quest / mission system.
-- 회장이 미션을 만들고 청중(전체 또는 특정 태그 보유자)·보상 태그를 지정한다.
-- 부원이 미션 완료 신청 → 회장이 승인 → 보상 태그가 자동 부여.
-- 트리거가 reward 태그를 member_tag_assignments에 동기화하므로 별도 작업 불요.

create table if not exists public.member_quests (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  description text,
  color text not null default '#0ea5e9',
  audience_mode text not null default 'all' check (audience_mode in ('all', 'tag_in')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index if not exists member_quests_active_idx on public.member_quests (is_active);

create table if not exists public.member_quest_audience_tags (
  quest_id uuid not null references public.member_quests(id) on delete cascade,
  tag_id uuid not null references public.member_tags(id) on delete cascade,
  primary key (quest_id, tag_id)
);

create table if not exists public.member_quest_reward_tags (
  quest_id uuid not null references public.member_quests(id) on delete cascade,
  tag_id uuid not null references public.member_tags(id) on delete cascade,
  primary key (quest_id, tag_id)
);

create table if not exists public.member_quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references public.member_quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected')),
  evidence text,
  review_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  unique (quest_id, user_id)
);

create index if not exists member_quest_completions_user_idx
  on public.member_quest_completions (user_id);
create index if not exists member_quest_completions_quest_idx
  on public.member_quest_completions (quest_id);
create index if not exists member_quest_completions_status_idx
  on public.member_quest_completions (status);

alter table public.member_quests enable row level security;
alter table public.member_quest_audience_tags enable row level security;
alter table public.member_quest_reward_tags enable row level security;
alter table public.member_quest_completions enable row level security;

-- ============================================================================
-- helper: is the current user in the audience for a given quest?
-- ============================================================================
create or replace function public.current_user_can_see_quest(quest_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1 from public.member_quests q
    where q.id = quest_id
      and q.is_active = true
      and (
        q.audience_mode = 'all'
        or exists (
          select 1
          from public.member_quest_audience_tags qat
          join public.member_tag_assignments mta
            on mta.tag_id = qat.tag_id and mta.user_id = auth.uid()
          where qat.quest_id = q.id
        )
      )
  )
  or public.current_user_has_permission('permissions.manage')
  or public.current_user_has_permission('members.manage');
$function$;

grant execute on function public.current_user_can_see_quest(uuid) to authenticated;

-- ============================================================================
-- RLS policies
-- ============================================================================
drop policy if exists "member_quests_select_audience" on public.member_quests;
create policy "member_quests_select_audience"
  on public.member_quests
  for select
  to authenticated
  using (
    public.current_user_has_permission('permissions.manage')
    or public.current_user_has_permission('members.manage')
    or (
      is_active = true
      and (
        audience_mode = 'all'
        or exists (
          select 1
          from public.member_quest_audience_tags qat
          join public.member_tag_assignments mta
            on mta.tag_id = qat.tag_id and mta.user_id = auth.uid()
          where qat.quest_id = member_quests.id
        )
      )
    )
  );

drop policy if exists "member_quests_write_admin" on public.member_quests;
create policy "member_quests_write_admin"
  on public.member_quests
  for all
  to authenticated
  using (public.current_user_has_permission('permissions.manage'))
  with check (public.current_user_has_permission('permissions.manage'));

drop policy if exists "member_quest_audience_tags_select" on public.member_quest_audience_tags;
create policy "member_quest_audience_tags_select"
  on public.member_quest_audience_tags for select to authenticated using (true);

drop policy if exists "member_quest_audience_tags_write" on public.member_quest_audience_tags;
create policy "member_quest_audience_tags_write"
  on public.member_quest_audience_tags for all to authenticated
  using (public.current_user_has_permission('permissions.manage'))
  with check (public.current_user_has_permission('permissions.manage'));

drop policy if exists "member_quest_reward_tags_select" on public.member_quest_reward_tags;
create policy "member_quest_reward_tags_select"
  on public.member_quest_reward_tags for select to authenticated using (true);

drop policy if exists "member_quest_reward_tags_write" on public.member_quest_reward_tags;
create policy "member_quest_reward_tags_write"
  on public.member_quest_reward_tags for all to authenticated
  using (public.current_user_has_permission('permissions.manage'))
  with check (public.current_user_has_permission('permissions.manage'));

drop policy if exists "member_quest_completions_select" on public.member_quest_completions;
create policy "member_quest_completions_select"
  on public.member_quest_completions for select to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_has_permission('permissions.manage')
    or public.current_user_has_permission('members.manage')
  );

drop policy if exists "member_quest_completions_insert_self" on public.member_quest_completions;
create policy "member_quest_completions_insert_self"
  on public.member_quest_completions for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "member_quest_completions_update_admin" on public.member_quest_completions;
create policy "member_quest_completions_update_admin"
  on public.member_quest_completions for update to authenticated
  using (
    public.current_user_has_permission('permissions.manage')
    or public.current_user_has_permission('members.manage')
  )
  with check (true);

drop policy if exists "member_quest_completions_delete_admin" on public.member_quest_completions;
create policy "member_quest_completions_delete_admin"
  on public.member_quest_completions for delete to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_has_permission('permissions.manage')
    or public.current_user_has_permission('members.manage')
  );

grant select on public.member_quests to authenticated;
grant insert, update, delete on public.member_quests to authenticated;
grant select, insert, update, delete on public.member_quest_audience_tags to authenticated;
grant select, insert, update, delete on public.member_quest_reward_tags to authenticated;
grant select, insert, update, delete on public.member_quest_completions to authenticated;

-- ============================================================================
-- Trigger: when a completion gets approved, copy reward tags to member_tag_assignments
-- ============================================================================
create or replace function public.apply_quest_completion_rewards()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if NEW.status = 'approved' and (OLD is null or OLD.status is distinct from 'approved') then
    insert into public.member_tag_assignments (user_id, tag_id, assigned_by)
    select NEW.user_id, qrt.tag_id, NEW.reviewed_by
    from public.member_quest_reward_tags qrt
    where qrt.quest_id = NEW.quest_id
    on conflict (user_id, tag_id) do nothing;
  end if;
  return NEW;
end;
$function$;

drop trigger if exists member_quest_completions_apply_rewards on public.member_quest_completions;
create trigger member_quest_completions_apply_rewards
  after insert or update of status on public.member_quest_completions
  for each row execute function public.apply_quest_completion_rewards();

-- ============================================================================
-- RPCs
-- ============================================================================
create or replace function public.submit_quest_completion(quest_id uuid, evidence text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid;
  v_id uuid;
  v_visible boolean;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'auth_required';
  end if;
  v_visible := public.current_user_can_see_quest(quest_id);
  if not v_visible then
    raise exception 'not_visible';
  end if;

  insert into public.member_quest_completions (quest_id, user_id, evidence)
  values (quest_id, v_caller, evidence)
  on conflict (quest_id, user_id) do update
    set status = 'submitted',
        evidence = excluded.evidence,
        submitted_at = now(),
        review_reason = null,
        reviewed_at = null,
        reviewed_by = null
  returning id into v_id;
  return v_id;
end;
$function$;

grant execute on function public.submit_quest_completion(uuid, text) to authenticated;

create or replace function public.review_quest_completion(
  completion_id uuid,
  decision text,
  review_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'auth_required';
  end if;
  if not (
    public.current_user_has_permission('permissions.manage')
    or public.current_user_has_permission('members.manage')
  ) then
    raise exception 'forbidden';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'invalid_decision';
  end if;
  update public.member_quest_completions
    set status = decision,
        reviewed_by = v_caller,
        reviewed_at = now(),
        review_reason = review_quest_completion.review_reason
    where id = completion_id;
  return true;
end;
$function$;

grant execute on function public.review_quest_completion(uuid, text, text) to authenticated;
