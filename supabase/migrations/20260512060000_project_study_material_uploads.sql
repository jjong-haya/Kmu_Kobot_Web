-- Project study material uploads.
-- Files are private Supabase Storage objects; metadata is stored in study_materials.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'study-materials',
  'study-materials',
  false,
  52428800,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
    'application/x-hwp',
    'application/haansofthwp',
    'application/vnd.hancom.hwp',
    'application/vnd.hancom.hwpx',
    'text/plain',
    'text/markdown',
    'text/csv'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.project_team_id_from_storage_path(object_name text)
returns uuid
language plpgsql
immutable
set search_path = public
as $$
declare
  v_project_id text;
begin
  v_project_id := split_part(coalesce(object_name, ''), '/', 1);

  if v_project_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return null;
  end if;

  return v_project_id::uuid;
exception
  when others then
    return null;
end;
$$;

create or replace function public.study_material_file_type_is_allowed(
  p_file_name text,
  p_mime_type text default null
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select lower(coalesce(p_file_name, '')) ~ '\.(pdf|doc|docx|ppt|pptx|xls|xlsx|odt|odp|ods|hwp|hwpx|zip|txt|md|csv)$'
    and (
      nullif(lower(coalesce(p_mime_type, '')), '') is null
      or lower(p_mime_type) in (
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.presentation',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/zip',
        'application/x-zip-compressed',
        'application/octet-stream',
        'application/x-hwp',
        'application/haansofthwp',
        'application/vnd.hancom.hwp',
        'application/vnd.hancom.hwpx',
        'text/plain',
        'text/markdown',
        'text/csv'
      )
    );
$$;

create or replace function public.current_user_can_write_project_study_material(
  target_project_team_id uuid
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select target_project_team_id is not null
    and exists (
      select 1
      from public.project_teams pt
      where pt.id = target_project_team_id
        and pt.deleted_at is null
        and pt.status in ('pending', 'recruiting', 'active')
    )
    and (
      public.current_user_has_permission('admin.access')
      or public.current_user_has_permission('members.manage')
      or public.current_user_has_permission('projects.manage')
      or public.current_user_has_permission('studies.manage')
      or exists (
        select 1
        from public.project_team_memberships ptm
        where ptm.project_team_id = target_project_team_id
          and ptm.user_id = auth.uid()
          and ptm.status = 'active'
      )
    );
$$;

create unique index if not exists study_materials_storage_path_unique_idx
  on public.study_materials (storage_path)
  where storage_path is not null;

drop policy if exists "Project study materials are readable by project members" on storage.objects;
create policy "Project study materials are readable by project members"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'study-materials'
  and public.current_user_can_read_project_member_scope(
    public.project_team_id_from_storage_path(name)
  )
);

drop policy if exists "Project members can upload study material files" on storage.objects;
create policy "Project members can upload study material files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'study-materials'
  and public.study_material_file_type_is_allowed(name, lower(coalesce((metadata->>'mimetype'), '')))
  and public.current_user_can_write_project_study_material(
    public.project_team_id_from_storage_path(name)
  )
);

drop policy if exists "Project members can remove failed study material uploads" on storage.objects;
create policy "Project members can remove failed study material uploads"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'study-materials'
  and public.current_user_can_write_project_study_material(
    public.project_team_id_from_storage_path(name)
  )
);

create or replace function public.create_project_study_material(
  p_project_team_id uuid,
  p_title text,
  p_description text default null,
  p_file_name text default null,
  p_mime_type text default null,
  p_file_size bigint default null,
  p_storage_path text default null
)
returns public.study_materials
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_project public.project_teams;
  v_material public.study_materials;
  v_title text := btrim(coalesce(p_title, ''));
  v_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_file_name text := nullif(btrim(coalesce(p_file_name, '')), '');
  v_mime_type text := lower(nullif(btrim(coalesce(p_mime_type, '')), ''));
  v_storage_path text := nullif(btrim(coalesce(p_storage_path, '')), '');
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if p_project_team_id is null then
    raise exception '프로젝트를 선택해 주세요.';
  end if;

  select *
    into v_project
  from public.project_teams
  where id = p_project_team_id
  for update;

  if v_project.id is null then
    raise exception '프로젝트를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if v_project.deleted_at is not null then
    raise exception '휴지통에 있는 프로젝트에는 자료를 올릴 수 없습니다.' using errcode = '42501';
  end if;

  if v_project.status not in ('pending', 'recruiting', 'active') then
    raise exception '진행 가능한 프로젝트에만 스터디 자료를 올릴 수 있습니다.';
  end if;

  if not public.current_user_can_write_project_study_material(v_project.id) then
    raise exception '프로젝트 멤버만 스터디 자료를 올릴 수 있습니다.' using errcode = '42501';
  end if;

  if v_file_name is null then
    raise exception '자료 파일 이름을 확인하지 못했습니다.';
  end if;

  if v_storage_path is null
     or public.project_team_id_from_storage_path(v_storage_path) is distinct from v_project.id then
    raise exception '자료 저장 경로가 프로젝트와 일치하지 않습니다.';
  end if;

  if not public.study_material_file_type_is_allowed(v_file_name, v_mime_type) then
    raise exception 'PDF, 문서, 발표 자료, 표, 압축 파일만 올릴 수 있습니다.';
  end if;

  if p_file_size is null or p_file_size <= 0 or p_file_size > 52428800 then
    raise exception '자료 파일은 50MB 이하로 올려 주세요.';
  end if;

  if v_title = '' then
    v_title := regexp_replace(v_file_name, '\.[^.]+$', '');
  end if;

  if char_length(v_title) > 120 then
    raise exception '자료 제목은 120자 이하로 입력해 주세요.';
  end if;

  if v_description is not null and char_length(v_description) > 1000 then
    raise exception '자료 설명은 1000자 이하로 입력해 주세요.';
  end if;

  insert into public.study_materials (
    study_session_id,
    project_team_id,
    title,
    material_type,
    url,
    storage_path,
    visibility,
    created_by,
    metadata
  )
  values (
    null,
    v_project.id,
    v_title,
    'file',
    null,
    v_storage_path,
    'project',
    v_actor,
    jsonb_build_object(
      'bucket', 'study-materials',
      'fileName', v_file_name,
      'mimeType', coalesce(v_mime_type, 'application/octet-stream'),
      'fileSize', p_file_size,
      'description', v_description,
      'uploadedBy', v_actor
    )
  )
  returning * into v_material;

  perform public.create_audit_log(
    'study.material.create',
    v_actor,
    v_project.id,
    null,
    'study_materials',
    v_material.id,
    null,
    to_jsonb(v_material),
    null,
    jsonb_build_object('source', 'create_project_study_material_rpc')
  );

  return v_material;
end;
$$;

revoke all on function public.project_team_id_from_storage_path(text) from public, anon;
revoke all on function public.study_material_file_type_is_allowed(text, text) from public, anon;
revoke all on function public.current_user_can_write_project_study_material(uuid) from public, anon;
revoke all on function public.create_project_study_material(uuid, text, text, text, text, bigint, text) from public, anon, authenticated;

grant execute on function public.project_team_id_from_storage_path(text) to authenticated;
grant execute on function public.study_material_file_type_is_allowed(text, text) to authenticated;
grant execute on function public.current_user_can_write_project_study_material(uuid) to authenticated;
grant execute on function public.create_project_study_material(uuid, text, text, text, text, bigint, text) to authenticated;
grant select on public.study_materials to authenticated;

notify pgrst, 'reload schema';
