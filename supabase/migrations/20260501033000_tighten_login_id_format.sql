update public.profiles
set login_id = null
where login_id is not null
  and login_id !~ '^[a-z0-9]{4,20}$';

alter table public.profiles
  drop constraint if exists profiles_login_id_format;

alter table public.profiles
  add constraint profiles_login_id_format check (
    login_id is null
    or login_id ~ '^[a-z0-9]{4,20}$'
  );
