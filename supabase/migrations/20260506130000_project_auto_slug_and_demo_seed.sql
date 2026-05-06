-- Project creation UX cleanup:
-- 1) slug is generated on the server when the client sends null/blank.
-- 2) seed a small demo set so multi-project study grouping is visible.

create or replace function public.create_project_team(
  input_slug text,
  input_name text,
  input_summary text default null,
  input_description text default null,
  input_project_type text default 'autonomous',
  input_visibility text default 'private',
  input_metadata jsonb default '{}'::jsonb
)
returns public.project_teams
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_org_id uuid;
  v_requested_slug text := lower(btrim(coalesce(input_slug, '')));
  v_name text := btrim(coalesce(input_name, ''));
  v_slug_base text;
  v_slug_candidate text;
  v_suffix integer := 1;
  v_project public.project_teams;
begin
  if v_actor is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select ma.organization_id
    into v_org_id
  from public.member_accounts ma
  where ma.user_id = v_actor
    and ma.status = 'active'
  limit 1;

  if v_org_id is null then
    raise exception '활성 부원만 프로젝트를 생성할 수 있습니다.';
  end if;

  if not (
    public.current_user_has_permission('projects.create')
    or public.current_user_has_permission('projects.manage')
  ) then
    raise exception '프로젝트 생성 권한이 없습니다.';
  end if;

  if v_name = '' then
    raise exception '프로젝트 이름을 입력해야 합니다.';
  end if;

  if input_project_type not in ('official_based', 'personal', 'autonomous') then
    raise exception '지원하지 않는 프로젝트 유형입니다.';
  end if;

  if input_visibility not in ('public', 'private') then
    raise exception '지원하지 않는 공개 범위입니다.';
  end if;

  if v_requested_slug <> '' then
    if v_requested_slug !~ '^[a-z][a-z0-9_-]{1,30}$' then
      raise exception '프로젝트 slug는 영어 소문자로 시작하고 소문자/숫자/하이픈/언더스코어만 2~31자로 입력해야 합니다.';
    end if;
    v_slug_candidate := v_requested_slug;
  else
    v_slug_base := regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g');
    v_slug_base := regexp_replace(v_slug_base, '(^-+|-+$)', '', 'g');
    v_slug_base := regexp_replace(v_slug_base, '-{2,}', '-', 'g');

    if char_length(v_slug_base) < 2 or v_slug_base !~ '^[a-z]' then
      v_slug_base := 'project';
    end if;

    v_slug_base := left(v_slug_base, 24);
    v_slug_candidate := v_slug_base;

    while exists (
      select 1
      from public.project_teams pt
      where pt.organization_id = v_org_id
        and lower(pt.slug::text) = v_slug_candidate
    ) loop
      v_suffix := v_suffix + 1;
      v_slug_candidate := left(v_slug_base, greatest(2, 30 - char_length(v_suffix::text))) || '-' || v_suffix::text;
    end loop;
  end if;

  insert into public.project_teams (
    organization_id,
    slug,
    name,
    summary,
    description,
    project_type,
    visibility,
    status,
    owner_user_id,
    lead_user_id,
    created_by,
    metadata
  )
  values (
    v_org_id,
    v_slug_candidate::citext,
    v_name,
    nullif(btrim(coalesce(input_summary, '')), ''),
    nullif(btrim(coalesce(input_description, '')), ''),
    input_project_type,
    input_visibility,
    'pending',
    v_actor,
    v_actor,
    v_actor,
    coalesce(input_metadata, '{}'::jsonb)
  )
  returning * into v_project;

  insert into public.project_team_memberships (
    project_team_id,
    user_id,
    role,
    status,
    assigned_by
  )
  values (
    v_project.id,
    v_actor,
    'lead',
    'active',
    v_actor
  )
  on conflict (project_team_id, user_id) do update
  set
    role = excluded.role,
    status = excluded.status,
    assigned_by = excluded.assigned_by,
    left_at = null;

  perform public.create_audit_log(
    'project.create',
    null,
    v_project.id,
    null,
    'project_teams',
    v_project.id,
    null,
    jsonb_build_object(
      'id', v_project.id,
      'slug', v_project.slug,
      'name', v_project.name,
      'status', v_project.status,
      'visibility', v_project.visibility
    ),
    null,
    jsonb_build_object('source', 'create_project_team_rpc', 'slugGenerated', v_requested_slug = '')
  );

  return v_project;
end;
$$;

revoke all on function public.create_project_team(text, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.create_project_team(text, text, text, text, text, text, jsonb) to authenticated;

do $$
declare
  v_org_id uuid;
  v_users constant uuid[] := array[
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    '33333333-3333-4333-8333-333333333333'::uuid,
    '44444444-4444-4444-8444-444444444444'::uuid
  ];
begin
  select id into v_org_id from public.organizations where slug = 'kobot' limit 1;

  if v_org_id is null then
    return;
  end if;

  insert into auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  values
    (
      v_users[1],
      'authenticated',
      'authenticated',
      'demo.project.lead@kookmin.ac.kr',
      crypt('demo-project-lead-' || gen_random_uuid()::text, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"source":"demo"}'::jsonb,
      '{"display_name":"데모 리드","full_name":"데모 리드"}'::jsonb,
      now(),
      now()
    ),
    (
      v_users[2],
      'authenticated',
      'authenticated',
      'demo.vision.member@kookmin.ac.kr',
      crypt('demo-vision-member-' || gen_random_uuid()::text, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"source":"demo"}'::jsonb,
      '{"display_name":"비전 데모","full_name":"비전 데모"}'::jsonb,
      now(),
      now()
    ),
    (
      v_users[3],
      'authenticated',
      'authenticated',
      'demo.ros.member@kookmin.ac.kr',
      crypt('demo-ros-member-' || gen_random_uuid()::text, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"source":"demo"}'::jsonb,
      '{"display_name":"ROS 데모","full_name":"ROS 데모"}'::jsonb,
      now(),
      now()
    ),
    (
      v_users[4],
      'authenticated',
      'authenticated',
      'demo.study.member@kookmin.ac.kr',
      crypt('demo-study-member-' || gen_random_uuid()::text, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"],"source":"demo"}'::jsonb,
      '{"display_name":"스터디 데모","full_name":"스터디 데모"}'::jsonb,
      now(),
      now()
    )
  on conflict (id) do nothing;

  insert into public.profiles (id, email, display_name, full_name, login_id)
  values
    (v_users[1], 'demo.project.lead@kookmin.ac.kr', '데모 리드', '데모 리드', 'demolead'),
    (v_users[2], 'demo.vision.member@kookmin.ac.kr', '비전 데모', '비전 데모', 'demovision'),
    (v_users[3], 'demo.ros.member@kookmin.ac.kr', 'ROS 데모', 'ROS 데모', 'demoros'),
    (v_users[4], 'demo.study.member@kookmin.ac.kr', '스터디 데모', '스터디 데모', 'demostudy')
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    full_name = excluded.full_name,
    login_id = excluded.login_id;

  insert into public.member_accounts (user_id, organization_id, status, approved_at)
  select user_id, v_org_id, 'active', now()
  from unnest(v_users) as user_id
  on conflict (user_id) do update
  set status = 'active',
      organization_id = excluded.organization_id,
      approved_at = coalesce(public.member_accounts.approved_at, now()),
      updated_at = now();

  insert into public.project_teams (
    organization_id,
    slug,
    name,
    summary,
    description,
    project_type,
    visibility,
    status,
    owner_user_id,
    lead_user_id,
    created_by,
    approved_by,
    approved_at,
    metadata
  )
  values
    (
      v_org_id,
      'demo-robot-arm',
      '데모 로봇팔 제어',
      '로봇팔 제어기와 시뮬레이션 파이프라인을 만드는 데모 프로젝트',
      '모터 제어, 궤적 생성, 테스트 시나리오를 함께 관리하는 샘플 프로젝트입니다.',
      'autonomous',
      'public',
      'active',
      v_users[1],
      v_users[1],
      v_users[1],
      v_users[1],
      now(),
      '{"progress":42,"guide":"작업은 이슈 단위로 쪼개고 스터디 기록은 프로젝트에 연결합니다.","idRule":"ARM-001","branchRule":"feat/ARM-001"}'::jsonb
    ),
    (
      v_org_id,
      'demo-vision-lab',
      '데모 비전 인식',
      '카메라 입력과 객체 인식 모델을 실험하는 데모 프로젝트',
      '데이터셋, 모델 실험, 추론 결과를 프로젝트 스터디 기록으로 남깁니다.',
      'official_based',
      'public',
      'active',
      v_users[2],
      v_users[2],
      v_users[2],
      v_users[1],
      now(),
      '{"progress":68,"guide":"실험 결과는 기록으로 남기고 재현 가능한 설정을 적습니다.","idRule":"VIS-001","branchRule":"exp/VIS-001"}'::jsonb
    ),
    (
      v_org_id,
      'demo-ros-navigation',
      '데모 ROS 주행',
      'ROS2 기반 자율주행 노드와 맵핑 흐름을 검증하는 데모 프로젝트',
      'SLAM, navigation, 센서 fusion 스터디를 프로젝트별로 나누어 확인합니다.',
      'autonomous',
      'private',
      'pending',
      v_users[3],
      v_users[3],
      v_users[3],
      null,
      null,
      '{"progress":12,"guide":"승인 전 프로젝트 샘플입니다.","idRule":"ROS-001","branchRule":"feat/ROS-001"}'::jsonb
    ),
    (
      v_org_id,
      'demo-ai-safety',
      '데모 AI 안전성',
      '정책 검토가 필요한 AI 실험 프로젝트 예시',
      '반려 상태와 관리 페이지 흐름을 확인하기 위한 샘플입니다.',
      'personal',
      'private',
      'rejected',
      v_users[4],
      v_users[4],
      v_users[4],
      null,
      null,
      '{"progress":0,"lastReview":{"decision":"reject","reason":"범위와 데이터 출처 보완 필요","reviewedAt":"2026-05-05T00:00:00Z"}}'::jsonb
    )
  on conflict (organization_id, slug) do update
  set
    name = excluded.name,
    summary = excluded.summary,
    description = excluded.description,
    project_type = excluded.project_type,
    visibility = excluded.visibility,
    status = excluded.status,
    owner_user_id = excluded.owner_user_id,
    lead_user_id = excluded.lead_user_id,
    metadata = excluded.metadata,
    updated_at = now();

  insert into public.project_team_memberships (project_team_id, user_id, role, status, assigned_by)
  select pt.id, membership.user_id, membership.role, 'active', v_users[1]
  from public.project_teams pt
  join (
    values
      ('demo-robot-arm'::citext, v_users[1], 'lead'::text),
      ('demo-robot-arm'::citext, v_users[4], 'member'::text),
      ('demo-vision-lab'::citext, v_users[2], 'lead'::text),
      ('demo-vision-lab'::citext, v_users[4], 'member'::text),
      ('demo-ros-navigation'::citext, v_users[3], 'lead'::text),
      ('demo-ai-safety'::citext, v_users[4], 'lead'::text)
  ) as membership(slug, user_id, role)
    on membership.slug = pt.slug
  where pt.organization_id = v_org_id
  on conflict (project_team_id, user_id) do update
  set role = excluded.role,
      status = 'active',
      assigned_by = excluded.assigned_by,
      left_at = null;

  insert into public.study_records (
    project_team_id,
    author_user_id,
    title,
    body,
    duration_minutes,
    occurred_at,
    status,
    visibility,
    metadata
  )
  select pt.id, record.author_user_id, record.title, record.body, record.duration_minutes, record.occurred_at, 'submitted', record.visibility, '{"source":"demo"}'::jsonb
  from public.project_teams pt
  join (
    values
      (
        'demo-robot-arm'::citext,
        v_users[1],
        'PID 게인 튜닝 기록'::text,
        '관절별 overshoot를 줄이기 위해 P/I/D 값을 분리해서 테스트했습니다. 다음 작업은 부하가 걸린 상태에서 같은 조건을 반복하는 것입니다.'::text,
        90,
        now() - interval '2 days',
        'project'::text
      ),
      (
        'demo-robot-arm'::citext,
        v_users[4],
        '시뮬레이터 충돌 케이스 정리'::text,
        'Gazebo에서 충돌 판정이 불안정한 케이스를 모았고, 재현 조건을 작업 이슈로 분리해야 합니다.'::text,
        45,
        now() - interval '1 day',
        'member'::text
      ),
      (
        'demo-vision-lab'::citext,
        v_users[2],
        'YOLO 추론 속도 비교'::text,
        '이미지 크기별 FPS와 정확도 차이를 비교했습니다. 프로젝트 자료에는 표 형태로 정리할 예정입니다.'::text,
        75,
        now() - interval '3 days',
        'member'::text
      ),
      (
        'demo-vision-lab'::citext,
        v_users[4],
        '라벨링 규칙 스터디'::text,
        '팀마다 다른 라벨 기준을 통일하기 위해 클래스 이름과 애매한 예시를 정리했습니다.'::text,
        50,
        now() - interval '6 hours',
        'member'::text
      ),
      (
        'demo-ros-navigation'::citext,
        v_users[3],
        'Nav2 behavior tree 흐름 확인'::text,
        'pending 프로젝트에서도 리드가 내부 기록을 남기는 케이스를 확인하기 위한 데모 기록입니다.'::text,
        60,
        now() - interval '4 hours',
        'project'::text
      )
  ) as record(slug, author_user_id, title, body, duration_minutes, occurred_at, visibility)
    on record.slug = pt.slug
  where pt.organization_id = v_org_id
    and not exists (
      select 1
      from public.study_records sr
      where sr.project_team_id = pt.id
        and sr.author_user_id = record.author_user_id
        and sr.title = record.title
    );
end;
$$;
