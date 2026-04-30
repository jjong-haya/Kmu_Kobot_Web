# 06. 디자인 명세서

## 1. 정보 구조

### 1.1 공개 영역과 내부 영역

| 영역 | 목적 | 디자인 원칙 |
| --- | --- | --- |
| Public Showcase | 발표/포트폴리오/시연 | 짧고 명확, 내부 운영 정보 최소화 |
| Login | Member Workspace 진입 | 개발자 경로/원시 오류 노출 금지 |
| Join | 가입 요청서 작성 | 필요한 입력만, 실명 자동 입력, 제출 CTA 명확 |
| Pending | 승인 대기/제한 안내 | 새로고침/문의/로그아웃만 |
| Member Workspace | 실제 운영 | 역할/권한 범위가 보이는 IA |
| Admin/Operation | 운영진 또는 프로젝트 운영 | 전체 운영과 프로젝트 내부 운영 분리 |

## 2. 라우트 정책

### 2.1 현재 라우트 기준

| 라우트 | 접근 | UX 역할 |
| --- | --- | --- |
| `/` | 모두 | 공개 랜딩 |
| `/login` | 모두 | 로그인 |
| `/auth/callback` | OAuth callback | 처리 화면, raw error 숨김 |
| `/member/join` | session + pending incomplete | 가입 요청서 |
| `/member/pending` | session + pending complete/제한 상태 | 승인/상태 안내 |
| `/member/profile` | active only | 프로필 수정 |
| `/member` | active + dashboard permission | 대시보드 |
| `/member/projects` | active + project capability | 프로젝트 목록/운영 진입 |

### 2.2 추가 권장 라우트

| 라우트 | 목적 |
| --- | --- |
| `/member/projects/:projectId` | 프로젝트 상세 |
| `/member/projects/:projectId/apply` | 참여 신청 |
| `/member/projects/:projectId/operators` | 프로젝트 운영진/위임 관리 |
| `/member/projects/:projectId/invitations` | 초대 코드/링크 관리 |
| `/member/projects/:projectId/readme` | README/소개서 미리보기 |
| `/member/admin/members` | 가입 승인 |
| `/member/admin/audit` | 전체/범위 감사 로그 |
| `/member/admin/permissions` | 권한 관리 |

## 3. 사이드바 규칙

### 3.1 노출 그룹

| 그룹 | 대상 | 메뉴 |
| --- | --- | --- |
| 내 활동 | active member 전체 | 대시보드, 알림, 연락 |
| 내 프로젝트 | 프로젝트 참여자 | 내가 참여한 프로젝트, 신청 상태 |
| 프로젝트 운영 | 프로젝트 팀장/operator/임시 위임자 | 해당 프로젝트 내부에서만 초대/신청/자료 관리 |
| 공식 팀 운영 | 공식 팀장 | 자기 공식 팀 승인/초대/검토 |
| 전체 운영 | 회장/부회장 | 가입 승인, 권한, 전체 감사 |
| 시스템 설정 | 회장 중심 | 연동, 정책, 위험 기능 |

### 3.2 금지

- 프로젝트 팀장에게 글로벌 `Admin` 라벨을 보여주지 않는다.
- pending 화면에서 프로필/ID 생성 CTA를 보여주지 않는다.
- `팀장 이상` 문구를 쓰지 않는다.
- Supabase, PKCE, callback path 같은 개발 용어를 사용자 화면에 노출하지 않는다.

## 4. 화면별 문구 원칙

### 4.1 Login

| 잘못된 문구 | 대체 문구 |
| --- | --- |
| `/member로 이동합니다` | 로그인 후 이어서 진행합니다 |
| Supabase 세션 동기화 | 로그인 정보를 확인하는 중입니다 |
| PKCE code verifier not found | 로그인 정보가 이어지지 않았습니다. 다시 로그인해 주세요 |
| 프로필에서 만든 login_id | ID |

### 4.2 Join

- 제목: `가입 요청 정보 입력`
- 설명: `국민대 Google 계정으로 확인된 정보를 바탕으로 KOBOT 활동에 필요한 정보를 입력해 주세요.`
- CTA: `회원가입 요청하기`

### 4.3 Pending

- 제목: `가입 요청이 접수되었습니다`
- 설명: `운영진 승인 후 Member Workspace가 열립니다.`
- CTA whitelist: `상태 새로고침`, `운영진 문의`, `로그아웃`

## 5. 상태별 UI

### 5.1 Loading

로그인 콜백은 단순 스피너보다 단계 문구를 보여준다.

```text
국민대학교 계정인지 확인하는 중...
KOBOT 멤버 상태를 확인하는 중...
워크스페이스로 이동 준비 중...
```

### 5.2 Error

- 사용자가 해결할 수 있는 행동을 먼저 보여준다.
- 원문 기술 오류는 접어서 보이거나 문의용 코드로만 제공한다.
- 취소/실패/권한 없음/비국민대 계정을 구분한다.

### 5.3 Restricted

- 왜 제한되는지 짧게 설명한다.
- 다음 행동은 1~2개만 둔다.
- 내부 메뉴를 보여주지 않는다.

## 6. 모바일/접근성

### 6.1 모바일

- 로그인/가입 화면은 카드 중앙 정렬.
- 좌측 장식 영역은 모바일에서 축약 또는 숨김.
- 긴 설명보다 CTA와 상태 문구 우선.

### 6.2 접근성

- 버튼은 목적이 분명한 텍스트 사용.
- 권한/상태 색상은 텍스트 라벨과 함께 제공.
- 애니메이션은 `prefers-reduced-motion` 고려.
