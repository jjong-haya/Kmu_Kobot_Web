-- Fix db lint ambiguity in the existing quest completion RPC.

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
  v_quest_id uuid := submit_quest_completion.quest_id;
  v_evidence text := submit_quest_completion.evidence;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'auth_required';
  end if;

  v_visible := public.current_user_can_see_quest(v_quest_id);
  if not v_visible then
    raise exception 'not_visible';
  end if;

  insert into public.member_quest_completions (quest_id, user_id, evidence)
  values (v_quest_id, v_caller, v_evidence)
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

revoke all on function public.submit_quest_completion(uuid, text) from public, anon;
grant execute on function public.submit_quest_completion(uuid, text) to authenticated;
