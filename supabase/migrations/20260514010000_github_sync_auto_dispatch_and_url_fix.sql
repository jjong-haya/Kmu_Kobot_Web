-- Make GitHub sync dispatch durable and tighten GitHub profile parsing.
--
-- The lifecycle triggers enqueue rows in github_sync_jobs. This migration adds
-- a database-side dispatcher that can invoke the github-sync Edge Function on a
-- cron, so repo provisioning does not depend on a browser tab staying alive.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

create table if not exists public.github_sync_dispatch_settings (
  id boolean primary key default true check (id),
  function_url text not null,
  sync_secret text,
  authorization_token text,
  is_enabled boolean not null default false,
  last_dispatched_at timestamptz,
  last_request_id bigint,
  last_error text,
  updated_at timestamptz not null default now()
);

insert into public.github_sync_dispatch_settings (id, function_url, is_enabled)
values (
  true,
  'https://tqidhnjmjbvrzdeiqlqo.supabase.co/functions/v1/github-sync',
  false
)
on conflict (id) do update
set
  function_url = excluded.function_url,
  updated_at = now();

alter table public.github_sync_dispatch_settings enable row level security;

revoke all on public.github_sync_dispatch_settings from public, anon, authenticated;

drop trigger if exists github_sync_dispatch_settings_set_updated_at
  on public.github_sync_dispatch_settings;
create trigger github_sync_dispatch_settings_set_updated_at
before update on public.github_sync_dispatch_settings
for each row execute function public.set_updated_at();

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

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'github-sync-dispatcher'
  ) then
    perform cron.unschedule('github-sync-dispatcher');
  end if;
end;
$$;

select cron.schedule(
  'github-sync-dispatcher',
  '* * * * *',
  $$select public.dispatch_github_sync_jobs();$$
);

create or replace function public.extract_github_login(p_github_url text)
returns text
language plpgsql
immutable
as $$
declare
  v_url text := btrim(coalesce(p_github_url, ''));
  v_matches text[];
  v_login text;
begin
  if v_url = '' then
    return null;
  end if;

  v_matches := regexp_match(v_url, '^https://github\.com/([^/?#]+)(?:[/?#].*)?$');
  if v_matches is null then
    return null;
  end if;

  v_login := lower(v_matches[1]);

  if v_login in (
    'about', 'apps', 'blog', 'collections', 'contact', 'customer-stories',
    'enterprise', 'events', 'explore', 'features', 'github', 'login',
    'marketplace', 'new', 'notifications', 'orgs', 'organizations', 'pricing',
    'pulls', 'search', 'settings', 'sponsors', 'topics', 'users'
  ) then
    return null;
  end if;

  if v_login !~ '^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$' then
    return null;
  end if;

  return v_login;
end;
$$;

do $$
declare
  v_profile record;
begin
  for v_profile in
    select id from public.profiles where github_url is not null
  loop
    perform public.refresh_member_github_identity(v_profile.id);
  end loop;
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
grant execute on function public.extract_github_login(text) to authenticated;

notify pgrst, 'reload schema';
