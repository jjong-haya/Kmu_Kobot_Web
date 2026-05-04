-- Contact requests are privacy-sensitive: accepting a request can disclose
-- email/phone data. Keep state transitions behind RPCs and deny broad client
-- updates on the table.

create or replace function public.current_user_can_use_contact_requests()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.member_accounts ma
    where ma.user_id = auth.uid()
      and ma.status in ('active', 'course_member')
  );
$$;

create or replace function public.create_contact_request(
  recipient_user_id_input uuid,
  reason_input text,
  requested_contact_methods_input text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_reason text := nullif(btrim(reason_input), '');
  normalized_methods text[];
  request_id uuid;
  requester_profile public.profiles%rowtype;
  recipient_exists boolean;
  requester_payload jsonb;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if not public.current_user_can_use_contact_requests() then
    raise exception '연락 요청을 사용할 수 있는 계정이 아닙니다.';
  end if;

  if recipient_user_id_input is null or recipient_user_id_input = current_user_id then
    raise exception '요청 대상을 확인해 주세요.';
  end if;

  if normalized_reason is null or char_length(normalized_reason) < 5 then
    raise exception '요청 사유를 5자 이상 입력해 주세요.';
  end if;

  select array_agg(distinct method order by method)
  into normalized_methods
  from (
    select lower(btrim(value)) as method
    from unnest(coalesce(requested_contact_methods_input, '{}'::text[])) as value
  ) methods
  where method in ('email', 'phone');

  if coalesce(array_length(normalized_methods, 1), 0) = 0 then
    raise exception '공개할 연락처 종류를 선택해 주세요.';
  end if;

  select exists (
    select 1
    from public.member_accounts ma
    where ma.user_id = recipient_user_id_input
      and ma.status in ('active', 'course_member')
  )
  into recipient_exists;

  if not recipient_exists then
    raise exception '요청 대상이 연락 요청을 받을 수 있는 상태가 아닙니다.';
  end if;

  select *
  into requester_profile
  from public.profiles
  where id = current_user_id;

  requester_payload := jsonb_strip_nulls(jsonb_build_object(
    'email', case when 'email' = any(normalized_methods) then nullif(requester_profile.email::text, '') end,
    'phone', case when 'phone' = any(normalized_methods) then nullif(requester_profile.phone, '') end
  ));

  insert into public.contact_requests (
    requester_user_id,
    recipient_user_id,
    status,
    reason,
    requested_contact_methods,
    requester_contact_payload
  )
  values (
    current_user_id,
    recipient_user_id_input,
    'pending',
    normalized_reason,
    normalized_methods,
    requester_payload
  )
  returning id into request_id;

  insert into public.contact_request_events (
    contact_request_id,
    actor_user_id,
    event_type,
    new_status,
    reason,
    metadata
  )
  values (
    request_id,
    current_user_id,
    'created',
    'pending',
    normalized_reason,
    jsonb_build_object('requestedContactMethods', normalized_methods)
  );

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    title,
    body,
    channel,
    importance,
    related_entity_table,
    related_entity_id,
    href,
    metadata
  )
  values (
    recipient_user_id_input,
    current_user_id,
    'contact_request_created',
    '연락 요청이 도착했습니다',
    left(normalized_reason, 160),
    'in_app',
    'important',
    'contact_requests',
    request_id,
    '/member/contact-requests',
    jsonb_build_object('contactRequestId', request_id)
  );

  return request_id;
end;
$$;

create or replace function public.decide_contact_request(
  contact_request_id_input uuid,
  decision_input text,
  decision_reason_input text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_decision text := lower(btrim(decision_input));
  normalized_reason text := nullif(btrim(decision_reason_input), '');
  request_record public.contact_requests%rowtype;
  responder_profile public.profiles%rowtype;
  responder_payload jsonb := '{}'::jsonb;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  if normalized_decision not in ('accepted', 'rejected') then
    raise exception '수락 또는 거절만 처리할 수 있습니다.';
  end if;

  select *
  into request_record
  from public.contact_requests
  where id = contact_request_id_input
  for update;

  if not found then
    raise exception '연락 요청을 찾을 수 없습니다.';
  end if;

  if request_record.status <> 'pending' then
    raise exception '이미 처리된 요청입니다.';
  end if;

  if request_record.recipient_user_id <> current_user_id
     and not public.current_user_has_permission('members.manage') then
    raise exception '연락 요청을 처리할 권한이 없습니다.';
  end if;

  if normalized_decision = 'accepted' then
    select *
    into responder_profile
    from public.profiles
    where id = current_user_id;

    responder_payload := jsonb_strip_nulls(jsonb_build_object(
      'email', case when 'email' = any(request_record.requested_contact_methods) then nullif(responder_profile.email::text, '') end,
      'phone', case when 'phone' = any(request_record.requested_contact_methods) then nullif(responder_profile.phone, '') end
    ));

    if responder_payload = '{}'::jsonb then
      raise exception '선택된 연락처가 프로필에 없습니다.';
    end if;
  end if;

  update public.contact_requests
  set status = normalized_decision,
      responder_contact_payload = case
        when normalized_decision = 'accepted' then responder_payload
        else '{}'::jsonb
      end,
      decision_reason = normalized_reason,
      decided_by = current_user_id,
      decided_at = now()
  where id = request_record.id;

  insert into public.contact_request_events (
    contact_request_id,
    actor_user_id,
    event_type,
    previous_status,
    new_status,
    reason,
    metadata
  )
  values (
    request_record.id,
    current_user_id,
    'decided',
    request_record.status,
    normalized_decision,
    normalized_reason,
    jsonb_build_object('decision', normalized_decision)
  );

  insert into public.notifications (
    recipient_user_id,
    actor_user_id,
    type,
    title,
    body,
    channel,
    importance,
    related_entity_table,
    related_entity_id,
    href,
    metadata
  )
  values (
    request_record.requester_user_id,
    current_user_id,
    'contact_request_decided',
    case
      when normalized_decision = 'accepted' then '연락 요청이 수락되었습니다'
      else '연락 요청이 거절되었습니다'
    end,
    normalized_reason,
    'in_app',
    'normal',
    'contact_requests',
    request_record.id,
    '/member/contact-requests',
    jsonb_build_object('contactRequestId', request_record.id, 'decision', normalized_decision)
  );

  return true;
end;
$$;

create or replace function public.report_contact_request_spam(
  contact_request_id_input uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  request_record public.contact_requests%rowtype;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select *
  into request_record
  from public.contact_requests
  where id = contact_request_id_input
  for update;

  if not found then
    raise exception '연락 요청을 찾을 수 없습니다.';
  end if;

  if request_record.recipient_user_id <> current_user_id
     and not public.current_user_has_permission('members.manage') then
    raise exception '신고할 권한이 없습니다.';
  end if;

  update public.contact_requests
  set status = case when status = 'pending' then 'rejected' else status end,
      decision_reason = coalesce(decision_reason, '스팸 또는 반복 요청으로 신고됨'),
      decided_by = coalesce(decided_by, current_user_id),
      decided_at = coalesce(decided_at, now()),
      spam_reported_at = now(),
      spam_reported_by = current_user_id
  where id = request_record.id;

  insert into public.contact_request_events (
    contact_request_id,
    actor_user_id,
    event_type,
    previous_status,
    new_status,
    reason,
    metadata
  )
  values (
    request_record.id,
    current_user_id,
    'spam_reported',
    request_record.status,
    case when request_record.status = 'pending' then 'rejected' else request_record.status end,
    '스팸 또는 반복 요청으로 신고됨',
    '{}'::jsonb
  );

  return true;
end;
$$;

drop policy if exists "contact_requests_insert_active_requester" on public.contact_requests;
drop policy if exists "contact_requests_insert_members_requester" on public.contact_requests;
create policy "contact_requests_insert_members_requester" on public.contact_requests
for insert with check (
  requester_user_id = auth.uid()
  and public.current_user_can_use_contact_requests()
);

drop policy if exists "contact_requests_update_participants_or_admins" on public.contact_requests;
drop policy if exists "contact_requests_update_no_direct_client" on public.contact_requests;
create policy "contact_requests_update_no_direct_client" on public.contact_requests
for update using (false) with check (false);

drop policy if exists "contact_request_events_insert_participants_or_admins" on public.contact_request_events;
drop policy if exists "contact_request_events_insert_no_direct_client" on public.contact_request_events;
create policy "contact_request_events_insert_no_direct_client" on public.contact_request_events
for insert with check (false);

grant execute on function public.current_user_can_use_contact_requests() to authenticated;
grant execute on function public.create_contact_request(uuid, text, text[]) to authenticated;
grant execute on function public.decide_contact_request(uuid, text, text) to authenticated;
grant execute on function public.report_contact_request_spam(uuid) to authenticated;
