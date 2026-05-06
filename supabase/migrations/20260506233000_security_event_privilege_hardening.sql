-- Keep sensitive revision/security logs readable only through RLS and writable only through RPCs.

revoke all on public.study_record_revisions from public, anon, authenticated;
revoke all on public.security_event_logs from public, anon, authenticated;

grant select on public.study_record_revisions to authenticated;
grant select on public.security_event_logs to authenticated;

revoke all on function public.record_security_event(text, text, text, uuid, jsonb) from public, anon;
revoke all on function public.update_study_record(uuid, text, text, integer, text[], jsonb, text) from public, anon;
grant execute on function public.record_security_event(text, text, text, uuid, jsonb) to authenticated;
grant execute on function public.update_study_record(uuid, text, text, integer, text[], jsonb, text) to authenticated;
