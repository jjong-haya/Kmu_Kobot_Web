-- Membership application notifications are user-facing Korean UI copy.
-- Replace the already-applied RPC because old migrations are not re-run in
-- Supabase, and clean rows that were persisted with English toast text.

create or replace function public.submit_current_membership_application()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile_record record;
  application_id uuid;
  missing_fields text[];
  applicant_label text;
begin
  if current_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select
    p.id,
    p.email,
    p.display_name,
    p.nickname_display,
    p.nickname_slug,
    p.full_name,
    p.student_id,
    p.phone,
    p.college,
    p.department,
    p.club_affiliation,
    ma.organization_id,
    ma.status as member_status
  into profile_record
  from public.profiles p
  join public.member_accounts ma
    on ma.user_id = p.id
  where p.id = current_user_id;

  if profile_record.id is null then
    raise exception '멤버 계정을 찾을 수 없습니다.';
  end if;

  if profile_record.member_status <> 'pending' then
    raise exception '승인 대기 회원만 가입 신청을 제출할 수 있습니다.';
  end if;

  missing_fields := array_remove(array[
    case when nullif(btrim(coalesce(profile_record.nickname_display, '')), '') is null then 'nicknameDisplay' end,
    case when nullif(btrim(coalesce(profile_record.full_name, '')), '') is null then 'fullName' end,
    case when nullif(btrim(coalesce(profile_record.student_id, '')), '') is null then 'studentId' end,
    case when nullif(btrim(coalesce(profile_record.phone, '')), '') is null then 'phone' end,
    case when nullif(btrim(coalesce(profile_record.college, '')), '') is null then 'college' end,
    case when nullif(btrim(coalesce(profile_record.department, '')), '') is null then 'department' end
  ], null);

  if array_length(missing_fields, 1) is not null then
    raise exception '필수 프로필 항목이 비어 있습니다: %', array_to_string(missing_fields, ', ');
  end if;

  applicant_label := coalesce(
    nullif(btrim(profile_record.full_name), ''),
    nullif(btrim(profile_record.nickname_display), ''),
    nullif(btrim(profile_record.email::text), ''),
    '새 회원'
  );

  insert into public.membership_applications (
    user_id,
    organization_id,
    status,
    submitted_at,
    reviewed_by,
    reviewed_at,
    review_reason,
    profile_snapshot,
    metadata
  ) values (
    current_user_id,
    profile_record.organization_id,
    'submitted',
    now(),
    null,
    null,
    null,
    jsonb_build_object(
      'email', profile_record.email,
      'displayName', profile_record.display_name,
      'nicknameDisplay', profile_record.nickname_display,
      'nicknameSlug', profile_record.nickname_slug,
      'fullName', profile_record.full_name,
      'studentId', profile_record.student_id,
      'phone', profile_record.phone,
      'college', profile_record.college,
      'department', profile_record.department,
      'clubAffiliation', profile_record.club_affiliation
    ),
    jsonb_build_object('source', 'member_profile_settings')
  )
  on conflict (user_id, organization_id)
  do update set
    status = 'submitted',
    submitted_at = excluded.submitted_at,
    reviewed_by = null,
    reviewed_at = null,
    review_reason = null,
    profile_snapshot = excluded.profile_snapshot,
    metadata = membership_applications.metadata || excluded.metadata,
    updated_at = now()
  returning id into application_id;

  insert into public.audit_logs (
    actor_user_id,
    target_user_id,
    action_type,
    entity_table,
    entity_id,
    old_data,
    new_data,
    reason,
    metadata
  ) values (
    current_user_id,
    current_user_id,
    'membership_application.submitted',
    'membership_applications',
    application_id,
    null,
    jsonb_build_object(
      'applicationId', application_id,
      'profileFields', jsonb_build_object(
        'email', profile_record.email is not null,
        'nicknameDisplay', profile_record.nickname_display is not null,
        'fullName', profile_record.full_name is not null,
        'studentId', profile_record.student_id is not null,
        'phone', profile_record.phone is not null,
        'college', profile_record.college is not null,
        'department', profile_record.department is not null,
        'clubAffiliation', profile_record.club_affiliation is not null
      )
    ),
    '회원이 가입 신청을 제출했습니다.',
    jsonb_build_object(
      'redaction', 'profile field presence only; raw PII remains in membership_applications.profile_snapshot'
    )
  );

  with manager_users as (
    select distinct opa.user_id
    from public.org_position_assignments opa
    join public.org_position_permissions opp
      on opp.org_position_id = opa.org_position_id
    join public.permissions perm
      on perm.id = opp.permission_id
    where opa.organization_id = profile_record.organization_id
      and opa.active = true
      and perm.code in ('admin.access', 'members.manage')
      and opa.user_id <> current_user_id
    union
    select distinct tm.user_id
    from public.team_memberships tm
    join public.team_role_permissions trp
      on trp.team_role_id = tm.team_role_id
    join public.permissions perm
      on perm.id = trp.permission_id
    where tm.organization_id = profile_record.organization_id
      and tm.active = true
      and perm.code in ('admin.access', 'members.manage')
      and tm.user_id <> current_user_id
  )
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
  select
    manager_users.user_id,
    current_user_id,
    'membership_application_submitted',
    '가입 신청이 도착했습니다',
    applicant_label || ' 님이 가입 신청서를 제출했습니다.',
    'in_app',
    'important',
    'membership_applications',
    application_id,
    '/member/member-admin?filter=submitted',
    jsonb_build_object('applicationId', application_id)
  from manager_users;

  return application_id;
end;
$$;

update public.notifications n
set
  title = '가입 신청이 도착했습니다',
  body = coalesce(
    nullif(btrim(p.full_name), ''),
    nullif(btrim(p.nickname_display), ''),
    nullif(btrim(p.email::text), ''),
    case
      when n.body like '% submitted a membership application.'
      then nullif(btrim(regexp_replace(n.body, ' submitted a membership application\.$', '')), '')
      else null
    end,
    '새 회원'
  ) || ' 님이 가입 신청서를 제출했습니다.',
  href = '/member/member-admin?filter=submitted'
from public.profiles p
where n.actor_user_id = p.id
  and n.type = 'membership_application_submitted'
  and n.related_entity_table = 'membership_applications';

update public.notifications n
set
  title = '가입 신청이 도착했습니다',
  body = coalesce(
    case
      when n.body like '% submitted a membership application.'
      then nullif(btrim(regexp_replace(n.body, ' submitted a membership application\.$', '')), '')
      else null
    end,
    '새 회원'
  ) || ' 님이 가입 신청서를 제출했습니다.',
  href = '/member/member-admin?filter=submitted'
where n.type = 'membership_application_submitted'
  and n.related_entity_table = 'membership_applications'
  and not exists (
    select 1
    from public.profiles p
    where p.id = n.actor_user_id
  );

grant execute on function public.submit_current_membership_application() to authenticated;
