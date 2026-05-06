-- Ouroboros AC closure: keep authority fail-closed and transactional.

create or replace function public.current_user_can_see_quest(quest_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    public.current_user_has_permission('permissions.manage')
    or public.current_user_has_permission('members.manage')
    or exists (
      select 1
      from public.member_accounts ma
      join public.member_quests q
        on q.id = $1
      where ma.user_id = auth.uid()
        and ma.status = 'active'
        and q.is_active = true
        and (
          q.audience_mode = 'all'
          or exists (
            select 1
            from public.member_quest_audience_tags qat
            join public.member_tag_assignments mta
              on mta.tag_id = qat.tag_id
             and mta.user_id = ma.user_id
            where qat.quest_id = q.id
          )
        )
    );
$function$;

revoke all on function public.current_user_can_see_quest(uuid) from public, anon;
grant execute on function public.current_user_can_see_quest(uuid) to authenticated;

create or replace function public.normalized_notice_tag_ids(p_ids uuid[])
returns uuid[]
language sql
stable
set search_path to 'public'
as $function$
  select coalesce(array_agg(distinct selected.tag_id order by selected.tag_id), '{}'::uuid[])
  from unnest(coalesce(p_ids, '{}'::uuid[])) as selected(tag_id)
  where selected.tag_id is not null;
$function$;

revoke all on function public.normalized_notice_tag_ids(uuid[]) from public, anon, authenticated;

create or replace function public.create_notice_with_audience(
  p_title text,
  p_body text,
  p_status text,
  p_audience_mode text,
  p_audience_tag_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_notice_id uuid;
  v_tag_ids uuid[];
  v_title text;
  v_body text;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if not public.current_user_can_manage_announcements() then
    raise exception 'forbidden';
  end if;

  if p_status not in ('draft', 'published') then
    raise exception 'invalid_notice_status';
  end if;

  if p_audience_mode not in ('public', 'tag_in') then
    raise exception 'invalid_notice_audience';
  end if;

  v_title := btrim(coalesce(p_title, ''));
  v_body := btrim(coalesce(p_body, ''));

  if v_title = '' then
    raise exception 'title_required';
  end if;

  if v_body = '' then
    raise exception 'body_required';
  end if;

  v_tag_ids := public.normalized_notice_tag_ids(
    case when p_audience_mode = 'tag_in' then p_audience_tag_ids else '{}'::uuid[] end
  );

  if p_audience_mode = 'tag_in' and coalesce(array_length(v_tag_ids, 1), 0) = 0 then
    raise exception 'audience_tags_required';
  end if;

  if exists (
    select 1
    from unnest(v_tag_ids) as selected(tag_id)
    left join public.member_tags mt
      on mt.id = selected.tag_id
    where mt.id is null
  ) then
    raise exception 'invalid_notice_audience_tag';
  end if;

  insert into public.notices (title, body, status, audience_mode, author_id)
  values (v_title, v_body, p_status, p_audience_mode, auth.uid())
  returning id into v_notice_id;

  insert into public.notice_audience_tags (notice_id, tag_id)
  select v_notice_id, selected.tag_id
  from unnest(v_tag_ids) as selected(tag_id);

  return v_notice_id;
end;
$function$;

revoke all on function public.create_notice_with_audience(text, text, text, text, uuid[]) from public, anon;
grant execute on function public.create_notice_with_audience(text, text, text, text, uuid[]) to authenticated;

create or replace function public.update_notice_with_audience(
  p_notice_id uuid,
  p_title text,
  p_body text,
  p_status text,
  p_audience_mode text,
  p_audience_tag_ids uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tag_ids uuid[];
  v_title text;
  v_body text;
begin
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if not public.current_user_can_manage_announcements() then
    raise exception 'forbidden';
  end if;

  if p_status not in ('draft', 'published') then
    raise exception 'invalid_notice_status';
  end if;

  if p_audience_mode not in ('public', 'tag_in') then
    raise exception 'invalid_notice_audience';
  end if;

  v_title := btrim(coalesce(p_title, ''));
  v_body := btrim(coalesce(p_body, ''));

  if v_title = '' then
    raise exception 'title_required';
  end if;

  if v_body = '' then
    raise exception 'body_required';
  end if;

  v_tag_ids := public.normalized_notice_tag_ids(
    case when p_audience_mode = 'tag_in' then p_audience_tag_ids else '{}'::uuid[] end
  );

  if p_audience_mode = 'tag_in' and coalesce(array_length(v_tag_ids, 1), 0) = 0 then
    raise exception 'audience_tags_required';
  end if;

  if exists (
    select 1
    from unnest(v_tag_ids) as selected(tag_id)
    left join public.member_tags mt
      on mt.id = selected.tag_id
    where mt.id is null
  ) then
    raise exception 'invalid_notice_audience_tag';
  end if;

  update public.notices
     set title = v_title,
         body = v_body,
         status = p_status,
         audience_mode = p_audience_mode,
         updated_at = now()
   where id = p_notice_id;

  if not found then
    raise exception 'notice_not_found';
  end if;

  delete from public.notice_audience_tags
   where notice_id = p_notice_id;

  insert into public.notice_audience_tags (notice_id, tag_id)
  select p_notice_id, selected.tag_id
  from unnest(v_tag_ids) as selected(tag_id);
end;
$function$;

revoke all on function public.update_notice_with_audience(uuid, text, text, text, text, uuid[]) from public, anon;
grant execute on function public.update_notice_with_audience(uuid, text, text, text, text, uuid[]) to authenticated;

drop policy if exists "notice_comments_select_members" on public.notice_comments;
create policy "notice_comments_select_members"
on public.notice_comments
for select
to authenticated
using (
  public.current_user_can_read_notice(notice_id)
  and (
    public.current_user_has_permission('announcements.read')
    or public.current_user_can_manage_announcements()
  )
);

revoke all on function public.current_user_has_permission(text) from public, anon;
grant execute on function public.current_user_has_permission(text) to authenticated;

revoke all on function public.get_my_authorization_context() from public, anon;
grant execute on function public.get_my_authorization_context() to authenticated;

revoke all on function public.current_user_can_manage_announcements() from public, anon;
grant execute on function public.current_user_can_manage_announcements() to authenticated;

revoke all on function public.current_user_tag_permissions() from public, anon;
grant execute on function public.current_user_tag_permissions() to authenticated;

revoke all on function public.current_user_tag_nav_paths() from public, anon;
grant execute on function public.current_user_tag_nav_paths() to authenticated;

revoke all on function public.current_user_can_read_notice(uuid) from public, anon;
grant execute on function public.current_user_can_read_notice(uuid) to authenticated;

revoke all on function public.submit_quest_completion(uuid, text) from public, anon;
grant execute on function public.submit_quest_completion(uuid, text) to authenticated;

revoke all on function public.review_quest_completion(uuid, text, text) from public, anon;
grant execute on function public.review_quest_completion(uuid, text, text) to authenticated;
