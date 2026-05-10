-- One-shot data seed: KOBOT E-Sports 대회 (form + event + notice).
-- Idempotent via ON CONFLICT — re-applying just refreshes the rows.

-- Cleanup any leftover debug form from earlier sessions.
delete from public.forms where id = 'debug-test-form-001';

-- ---------------------------------------------------------------------------
-- 1. KOBOT E-Sports 대회 신청 폼
-- ---------------------------------------------------------------------------
insert into public.forms (id, title, status, category, data, created_by) values (
  'kobot-esports-2026',
  'KOBOT E-Sports 대회',
  'active',
  'event_registration',
  jsonb_build_object(
    'id', 'kobot-esports-2026',
    'title', 'KOBOT E-Sports 대회',
    'description', '제 1회 KOBOT 게임 대회 참가 신청 폼입니다. 게임 종목 + 게임 ID/티어/라인/역할 + 디스코드 사용자명을 받아 친구추가와 팀 매칭에 사용해요.',
    'category', 'event_registration',
    'status', 'active',
    'createdAt', now()::text,
    'updatedAt', now()::text,
    'acceptsResponses', true,
    'requiresLogin', true,
    'commentsEnabled', true,
    'responseWindow', jsonb_build_object('startsAt', '2026-05-07T00:00:00+09:00', 'endsAt', '2026-05-14T23:59:00+09:00'),
    'questions', jsonb_build_array(
      jsonb_build_object(
        'id', 'q-game-pick',
        'title', '참가하실 게임을 선택해 주세요',
        'description', '여러 종목 중복 신청 가능합니다. 선택한 게임마다 아래에 추가 질문이 나타나요.',
        'type', 'multiple_choice',
        'required', true,
        'options', jsonb_build_array(
          jsonb_build_object('id', 'game-lol-rift', 'label', '리그 오브 레전드 (협곡)'),
          jsonb_build_object('id', 'game-lol-aram', 'label', '리그 오브 레전드 (칼바람)'),
          jsonb_build_object('id', 'game-overwatch', 'label', '오버워치 2')
        )
      ),
      jsonb_build_object(
        'id', 'q-lol-rift-name',
        'title', '롤 소환사명 (협곡)',
        'description', '친구추가에 사용돼요. 예: Hide on bush#KR1 (소환사명#태그). 라이엇 클라이언트 우상단 본인 프로필에서 확인할 수 있어요.',
        'type', 'short_text',
        'required', true,
        'visibleWhen', jsonb_build_object('parentQuestionId', 'q-game-pick', 'optionId', 'game-lol-rift')
      ),
      jsonb_build_object(
        'id', 'q-lol-rift-tier',
        'title', '롤 현재 티어',
        'description', '이번 시즌 솔로랭크 기준으로 한 구간만 선택해 주세요.',
        'type', 'single_choice',
        'required', true,
        'visibleWhen', jsonb_build_object('parentQuestionId', 'q-game-pick', 'optionId', 'game-lol-rift'),
        'options', jsonb_build_array(
          jsonb_build_object('id', 'tier-iron-plat', 'label', '아이언 ~ 플래티넘'),
          jsonb_build_object('id', 'tier-emerald-diamond', 'label', '에메랄드 ~ 다이아몬드'),
          jsonb_build_object('id', 'tier-master-challenger', 'label', '마스터 ~ 챌린저')
        )
      ),
      jsonb_build_object(
        'id', 'q-lol-rift-line',
        'title', '롤 주 라인',
        'description', '주 포지션 하나만 선택해 주세요.',
        'type', 'single_choice',
        'required', true,
        'visibleWhen', jsonb_build_object('parentQuestionId', 'q-game-pick', 'optionId', 'game-lol-rift'),
        'options', jsonb_build_array(
          jsonb_build_object('id', 'lane-top', 'label', '탑'),
          jsonb_build_object('id', 'lane-jungle', 'label', '정글'),
          jsonb_build_object('id', 'lane-mid', 'label', '미드'),
          jsonb_build_object('id', 'lane-adc', 'label', '원딜'),
          jsonb_build_object('id', 'lane-support', 'label', '서포터')
        )
      ),
      jsonb_build_object(
        'id', 'q-lol-aram-name',
        'title', '롤 소환사명 (칼바람)',
        'description', '친구추가에 사용돼요. 예: Hide on bush#KR1. 협곡 닉네임과 같다면 동일하게 적어 주세요.',
        'type', 'short_text',
        'required', true,
        'visibleWhen', jsonb_build_object('parentQuestionId', 'q-game-pick', 'optionId', 'game-lol-aram')
      ),
      jsonb_build_object(
        'id', 'q-ow-tag',
        'title', '오버워치 배틀태그',
        'description', '친구추가에 사용돼요. 예: Tracer#1234 (이름#숫자4자리). 게임 내 본인 프로필 또는 Battle.net 좌상단 본인 ID에서 확인할 수 있어요.',
        'type', 'short_text',
        'required', true,
        'visibleWhen', jsonb_build_object('parentQuestionId', 'q-game-pick', 'optionId', 'game-overwatch')
      ),
      jsonb_build_object(
        'id', 'q-ow-role',
        'title', '오버워치 선호 역할',
        'description', '주 역할 하나만 선택해 주세요.',
        'type', 'single_choice',
        'required', true,
        'visibleWhen', jsonb_build_object('parentQuestionId', 'q-game-pick', 'optionId', 'game-overwatch'),
        'options', jsonb_build_array(
          jsonb_build_object('id', 'role-tank', 'label', '탱커'),
          jsonb_build_object('id', 'role-damage', 'label', '딜러'),
          jsonb_build_object('id', 'role-support', 'label', '힐러')
        )
      ),
      jsonb_build_object(
        'id', 'q-discord',
        'title', '디스코드 사용자명',
        'description', '대회 안내·팀 편성 시 친구추가에 사용돼요. 예: jjong0315 (소문자/숫자/마침표/언더스코어만, 옛 #1234 태그는 더 이상 사용하지 않습니다). 디스코드 좌하단 본인 프로필 → 사용자명 탭에서 확인할 수 있어요.',
        'type', 'short_text',
        'required', true
      )
    ),
    'responses', '[]'::jsonb,
    'comments', '[]'::jsonb,
    'tournament', jsonb_build_object('enabled', false, 'title', '', 'maxTeamSize', 5, 'leagueType', 'round_robin', 'teams', '[]'::jsonb, 'matches', '[]'::jsonb)
  ),
  '97dd7a1d-4768-4f2e-8573-a35dea317d44'
) on conflict (id) do update set
  title = excluded.title,
  status = excluded.status,
  category = excluded.category,
  data = excluded.data;

-- ---------------------------------------------------------------------------
-- 2. 행사 (events) — 폼과 연결, 본문에 공지 전문
-- ---------------------------------------------------------------------------
insert into public.events (
  id, title, description, starts_at, ends_at, location, organizer, capacity_label,
  image_tone, image_tones, schedule, features, form_id, form_title, created_by
) values (
  'a1b2c3d4-e5f6-4789-abcd-ef0123456789'::uuid,
  'KOBOT E-Sports 대회',
  E'안녕하세요 코봇 부원 여러분,\n제 1회 KOBOT 게임 대회를 개최합니다!\n팀원들과 합을 맞추며 스트레스도 풀고, 커피 쿠폰까지 챙겨갈 수 있는 기회!\n\n이번 대회는 부원들 간의 친목을 위한 이벤트이니만큼,\n초보자분들도 걱정 말고 신청해 주세요!\n\n🤖 코봇 부원 여러분의 많은 참여 바랍니다! 🤖\n\n📍 대회 안내\n일시: 2026.05.16 (토) 17:00\n장소: 온라인 (디스코드 + 게임 클라이언트)\n참가 자격: 코봇 동아리원 누구나\n\n📋 신청 안내\n신청 기간: 05.07 ~ 05.14 23:59까지\n신청 방법: 본 페이지의 "참여하기" 버튼 → KOBOT 참여 폼 작성\n\n* 팀 단위 신청은 각자 폼 작성 후, 회장(함종하)에게 갠톡으로 팀원 전체 명단을 꼭 보내주세요!\n\n⚔️ 경기 방식 및 상품\n진행 방식: 예선 단판 / 결승 3판 2선승\n우승 상품: 카페나무 5천원권 (인당 지급)\n\n* 상세 시간은 신청 인원 확정 후 추후 개별 공지 예정입니다.\n\n👀 관전 안내\n직접 참가하지 않아도 응원과 구경은 언제나 환영!\n관전을 희망하시는 분은 회장(함종하)에게 갠톡으로 디스코드 아이디를 보내주시기 바랍니다.',
  '2026-05-16T17:00:00+09:00',
  '2026-05-16T22:00:00+09:00',
  '온라인 (디스코드 + 게임 클라이언트)',
  'KOBOT 운영진',
  '동아리원 누구나',
  'navy',
  array['navy']::text[],
  '[]'::jsonb,
  '{}'::jsonb,
  'kobot-esports-2026',
  'KOBOT E-Sports 대회',
  '97dd7a1d-4768-4f2e-8573-a35dea317d44'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  location = excluded.location,
  organizer = excluded.organizer,
  capacity_label = excluded.capacity_label,
  form_id = excluded.form_id,
  form_title = excluded.form_title;

-- ---------------------------------------------------------------------------
-- 3. 공지 (notices)
-- ---------------------------------------------------------------------------
insert into public.notices (id, title, body, status, author_id, audience_mode) values (
  'b2c3d4e5-f6a7-4890-bcde-f01234567890'::uuid,
  '[공지] 제 1회 KOBOT 게임 대회 안내 🎮',
  E'안녕하세요 코봇 부원 여러분,\n제 1회 KOBOT 게임 대회를 개최합니다!\n팀원들과 합을 맞추며 스트레스도 풀고, 커피 쿠폰까지 챙겨갈 수 있는 기회!\n\n이번 대회는 부원들 간의 친목을 위한 이벤트이니만큼,\n초보자분들도 걱정 말고 신청해 주세요!\n\n🤖 코봇 부원 여러분의 많은 참여 바랍니다! 🤖\n\n📍 대회 안내\n일시: 2026.05.16 (토) 17:00\n장소: 온라인 (디스코드 + 게임 클라이언트)\n참가 자격: 코봇 동아리원 누구나\n\n📋 신청 안내\n신청 기간: 05.07 ~ 05.14 23:59까지\n신청 방법: 행사 페이지 → "참여하기" → KOBOT 참여 폼 작성\n\n* 팀 단위 신청은 각자 폼 작성 후, 회장(함종하)에게 갠톡으로 팀원 전체 명단을 꼭 보내주세요!\n\n⚔️ 경기 방식 및 상품\n진행 방식: 예선 단판 / 결승 3판 2선승\n우승 상품: 카페나무 5천원권 (인당 지급)\n\n* 상세 시간은 신청 인원 확정 후 추후 개별 공지 예정입니다.\n\n👀 관전 안내\n직접 참가하지 않아도 응원과 구경은 언제나 환영!\n관전을 희망하시는 분은 회장(함종하)에게 갠톡으로 디스코드 아이디를 보내주시기 바랍니다.',
  'published',
  '97dd7a1d-4768-4f2e-8573-a35dea317d44',
  'public'
) on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  status = excluded.status;

notify pgrst, 'reload schema';
