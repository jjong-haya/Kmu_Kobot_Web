-- 동아리 태그 분류 (`is_club`).
--
-- 일반 태그(스터디 그룹, 역할, 보상 등) 와 "이 사람의 소속 동아리" 를 구분한다.
-- is_club=true 인 태그는 부원 카드 메타에 건물 아이콘 + 라벨로 노출되며 (예: "🏢 KOBOT"),
-- 칩 자체에도 건물 데코가 자동 적용된다 (슬러그 아이콘 매핑이 우선, 없으면 Building 폴백).
--
-- 신규 컬럼은 default false 라 기존 태그는 모두 일반 태그로 남고, KOBOT/KOSS 두 시스템 태그만
-- 동아리로 표시한다. 회장이 신규 태그 생성 시 토글로 지정 가능 (Tags.tsx).

alter table public.member_tags
  add column if not exists is_club boolean not null default false;

update public.member_tags
   set is_club = true
 where slug in ('kobot', 'koss');
