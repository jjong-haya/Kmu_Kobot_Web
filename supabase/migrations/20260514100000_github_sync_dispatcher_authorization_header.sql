-- Supabase Edge Functions still require a valid JWT at the platform layer.
-- The dispatcher sends the public anon JWT for platform verification and the
-- private GITHUB_SYNC_SECRET for function-level authorization.

alter table public.github_sync_dispatch_settings
  add column if not exists authorization_token text;

drop function if exists public.configure_github_sync_dispatcher(text, text, boolean);

create or replace function public.configure_github_sync_dispatcher(
  p_sync_secret text,
  p_function_url text default 'https://tqidhnjmjbvrzdeiqlqo.supabase.co/functions/v1/github-sync',
  p_is_enabled boolean default true,
  p_authorization_token text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
    and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'Only service role can configure GitHub sync dispatching.'
      using errcode = '42501';
  end if;

  if p_is_enabled and nullif(btrim(coalesce(p_sync_secret, '')), '') is null then
    raise exception 'GitHub sync secret is required when enabling dispatching.'
      using errcode = '22023';
  end if;

  insert into public.github_sync_dispatch_settings (
    id,
    function_url,
    sync_secret,
    authorization_token,
    is_enabled
  )
  values (
    true,
    p_function_url,
    nullif(btrim(coalesce(p_sync_secret, '')), ''),
    nullif(btrim(coalesce(p_authorization_token, '')), ''),
    p_is_enabled
  )
  on conflict (id) do update
  set
    function_url = excluded.function_url,
    sync_secret = excluded.sync_secret,
    authorization_token = excluded.authorization_token,
    is_enabled = excluded.is_enabled,
    last_error = null,
    updated_at = now();
end;
$$;

create or replace function public.dispatch_github_sync_jobs()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_settings public.github_sync_dispatch_settings;
  v_request_id bigint;
begin
  select *
    into v_settings
  from public.github_sync_dispatch_settings
  where id = true;

  if v_settings.id is null or not v_settings.is_enabled then
    return;
  end if;

  if nullif(btrim(coalesce(v_settings.sync_secret, '')), '') is null then
    update public.github_sync_dispatch_settings
    set last_error = 'missing_github_sync_secret'
    where id = true;
    return;
  end if;

  if not exists (
    select 1
    from public.github_sync_jobs
    where status = 'pending'
      and run_after <= now()
  ) then
    return;
  end if;

  select net.http_post(
    url := v_settings.function_url,
    headers := jsonb_strip_nulls(jsonb_build_object(
      'content-type', 'application/json',
      'authorization', case
        when nullif(btrim(coalesce(v_settings.authorization_token, '')), '') is null then null
        else 'Bearer ' || v_settings.authorization_token
      end,
      'x-github-sync-secret', v_settings.sync_secret
    )),
    body := jsonb_build_object('limit', 10),
    timeout_milliseconds := 30000
  )
    into v_request_id;

  update public.github_sync_dispatch_settings
  set
    last_dispatched_at = now(),
    last_request_id = v_request_id,
    last_error = null,
    updated_at = now()
  where id = true;
end;
$$;

revoke all on function public.configure_github_sync_dispatcher(text, text, boolean, text)
  from public, anon, authenticated;
revoke all on function public.dispatch_github_sync_jobs()
  from public, anon, authenticated;
grant execute on function public.configure_github_sync_dispatcher(text, text, boolean, text)
  to service_role;
grant execute on function public.dispatch_github_sync_jobs()
  to service_role;

notify pgrst, 'reload schema';
