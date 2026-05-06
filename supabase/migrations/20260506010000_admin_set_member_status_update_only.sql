-- Bugfix: admin_set_member_status was doing INSERT ... ON CONFLICT DO UPDATE
-- on public.member_accounts, but `organization_id` is NOT NULL with no default,
-- so PostgreSQL rejected the INSERT row (conflict resolution does not run before
-- per-row constraints). Result: 회장이 '승인'을 눌러도 "상태 변경 못했다" 만 떴음.
--
-- 모든 회원의 member_accounts row 는 가입 시 handle_new_user 트리거가 이미
-- 만들어 두기 때문에 INSERT 가 애초에 필요 없다. 순수 UPDATE 로 바꾼다.

create or replace function public.admin_set_member_status(
  target_user_id uuid,
  new_status text
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
    public.current_user_has_permission('members.manage')
    or public.current_user_has_permission('permissions.manage')
  ) then
    raise exception 'forbidden';
  end if;
  if new_status not in ('pending', 'active', 'course_member', 'project_only', 'rejected', 'withdrawn') then
    raise exception 'invalid_status';
  end if;

  update public.member_accounts
    set status = new_status,
        approved_at = case
          when new_status = 'active' and approved_at is null then now()
          else approved_at
        end,
        approved_by = case
          when new_status = 'active' and approved_by is null then v_caller
          else approved_by
        end,
        updated_at = now()
    where user_id = target_user_id;

  if not found then
    raise exception 'member_account_not_found';
  end if;
  return true;
end;
$function$;

grant execute on function public.admin_set_member_status(uuid, text) to authenticated;
