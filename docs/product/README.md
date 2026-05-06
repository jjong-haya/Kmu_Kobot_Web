# Product Policy Documents

이 폴더는 Kobot 웹사이트의 제품 정책, 권한 모델, 운영 흐름을 정리하는 공간입니다.

## 문서 목록

### 변경 작업 시 필수 (반복 실수 방지용)

- [변경 체크리스트](./CHANGE_CHECKLIST.md) — 모든 변경 전·후 펼치기. 데이터 흐름 / RLS / 마이그 의존 / 검증 절차 / 실패 패턴 카탈로그.
- [기능-권한 운영 등록부](./feature-permission-register.md) — 전체 기능, 경로, 권한, 데이터/RPC, 감사 기록, 미구현 위험을 한 곳에서 추적한다.
- [문서화 운영 규칙](./documentation-governance.md) — 새 기능·권한·DB·알림·외부 연동이 생길 때 어떤 문서를 같이 갱신해야 하는지 정한다.

### 도메인별 진리원천 (코드 변경 전·후 반드시 동기화)

- [태그 시스템](./tag-system.md) — 권한·소속의 단일 진리원천. 모든 페이지가 여기서 출발한다.
- [태그 렌더링 Touchpoints](./tag-rendering-touchpoints.md) — 태그 칩/선택 UI/초대코드/공지/퀘스트 등 태그가 화면에 보이는 모든 지점. 태그 디자인 변경 전 필수 확인.
- [부원 상태 (lifecycle)](./member-status.md) — `member_accounts.status` 의 의미. 권한 분기에는 절대 안 씀.
- [알림 도메인](./notifications.md) — 알림 상세 팝업, CTA, 원본 이벤트와 처리 화면 연결. 가입 신청은 알림 상세 → 멤버 관리 승인 흐름.
- [초대 코드](./invite-codes.md) — 코드 한 줄로 태그 자동 부여하는 흐름.
- [프로젝트 도메인](./projects.md) — `projects.create` 권한, 생성 RPC, 프로젝트 목록/상세 연결.
- [프로젝트 개발·스터디 DDD](./project-study-development.md) — 프로젝트 작업 공간, 스터디 기록, 자료, 과제, 알림, RLS를 같이 설계한 사전 명세.
- [미션 / 퀘스트](./quests.md) — 미션 승인 시 보상 태그 자동 부여.
- 공지 visibility — 공개(`public`) 또는 선택 태그(`tag_in`)로 읽기 범위를 정한다. 공개 랜딩은 `public_notices`만 읽고, 멤버 공지는 RLS/RPC가 최종 판정한다.
- 투표 eligibility — 별도 구현 예정. 투표마다 포함/제외 태그와 예외 멤버를 저장한다. 졸업은 상태가 아니라 태그이며, 투표별로 제외하거나 예외 허용한다.

### 정책

- [멤버 워크스페이스 정책](./member-workspace-policy.md)
- [출시 전 법적 고지 및 개인정보 체크리스트](./legal-and-compliance-checklist.md)
- [구현 우선순위](./implementation-priority.md)

## 작업 규칙

도메인별 MD 의 **Touchpoints / Invariants** 는 살아있는 명세다. 모델·UI 를 바꿀 때:

1. 먼저 해당 도메인 MD 의 Touchpoints 를 봐서 영향 받는 모든 파일을 식별한다.
2. `feature-permission-register.md`에서 같은 기능의 현재 권한, 데이터, 감사 기록을 확인한다.
3. SQL · API · 페이지를 한 번에 같이 고친다 (한쪽만 고치면 단일 진리원천이 깨진다).
4. 끝나면 MD 의 Touchpoints / Invariants 와 기능-권한 등록부를 새 사실로 업데이트한다.

## 현재 기준

- 공개 메인 페이지는 발표, 포트폴리오, 시연용으로 설계한다.
- 로그인 후 `/member/*` 전체 영역은 실제 동아리 운영용 `멤버 워크스페이스`로 설계한다.
- `/member` 첫 화면은 `대시보드`라고 부른다.
- 권한, 초대, 프로젝트 팀, GitHub 연동, 감사 기록은 구현 전 이 문서를 기준으로 맞춘다.
- 기능이 생기면 기능-권한 운영 등록부에 경로, 권한, 데이터/RPC, 감사/보안 기록, 남은 위험을 남긴다.
