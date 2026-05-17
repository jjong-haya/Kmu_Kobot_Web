-- Allow project study material files to be removed through a guarded RPC.

create or replace function public.delete_project_study_material(
  p_material_id uuid
)
returns public.study_materials
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_material public.study_materials;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.' using errcode = '42501';
  end if;

  if p_material_id is null then
    raise exception '삭제할 자료를 선택해 주세요.' using errcode = '22023';
  end if;

  select *
    into v_material
  from public.study_materials
  where id = p_material_id
  for update;

  if v_material.id is null then
    raise exception '스터디 자료를 찾을 수 없습니다.' using errcode = 'P0002';
  end if;

  if v_material.material_type <> 'file'
     or v_material.storage_path is null
     or v_material.project_team_id is null then
    raise exception '파일 자료만 삭제할 수 있습니다.' using errcode = '22023';
  end if;

  if not public.current_user_can_write_project_study_material(v_material.project_team_id) then
    raise exception '스터디 자료를 삭제할 권한이 없습니다.' using errcode = '42501';
  end if;

  delete from public.study_materials
  where id = v_material.id;

  perform public.create_audit_log(
    'study.material.delete',
    v_actor,
    v_material.project_team_id,
    null,
    'study_materials',
    v_material.id,
    to_jsonb(v_material),
    null,
    null,
    jsonb_build_object(
      'source', 'delete_project_study_material_rpc',
      'storagePath', v_material.storage_path
    )
  );

  return v_material;
end;
$$;

revoke all on function public.delete_project_study_material(uuid) from public, anon, authenticated;
grant execute on function public.delete_project_study_material(uuid) to authenticated;

notify pgrst, 'reload schema';
