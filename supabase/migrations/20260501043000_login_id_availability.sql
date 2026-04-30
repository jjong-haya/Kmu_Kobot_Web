create or replace function public.is_login_id_available(login_id_input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when login_id_input is null or btrim(login_id_input) = '' then true
    when lower(btrim(login_id_input)) !~ '^[a-z0-9]{4,20}$' then false
    else not exists (
      select 1
      from public.profiles p
      where p.login_id is not null
        and lower(p.login_id::text) = lower(btrim(login_id_input))
        and p.id <> auth.uid()
    )
  end;
$$;

revoke all on function public.is_login_id_available(text) from public;
grant execute on function public.is_login_id_available(text) to authenticated;
