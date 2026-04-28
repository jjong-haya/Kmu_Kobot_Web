# Supabase Auth Setup

이 프로젝트의 member 인증 흐름은 `Google OAuth 우선 + 승인 상태 + 팀/직책 기반 권한` 구조로 설계되어 있습니다.

현재 연결 대상 Supabase URL은 다음과 같습니다.

```text
https://tqidhnjmjbvrzdeiqlqo.supabase.co
```

Supabase Dashboard의 `Project Settings -> General -> Region`에서 프로젝트 리전이 `Northeast Asia (Seoul)`, `ap-northeast-2`인지 확인해야 합니다.

## 1. 데이터베이스 적용

1. Supabase 프로젝트를 `Northeast Asia (Seoul)`, `ap-northeast-2` 리전으로 만든 뒤 `supabase/migrations/20260325150000_auth_rbac.sql`을 실행합니다.
2. 이 migration은 다음을 생성합니다.
   - `profiles`, `member_accounts`
   - `allowed_login_exceptions`
   - `org_positions`, `teams`, `team_roles`
   - `permissions` 및 매핑 테이블
   - `before_user_created_kobot` hook 함수
   - `get_my_authorization_context`, `resolve_login_email`
3. 최초 최고권한 이메일은 `jongha0315@kookmin.ac.kr`로 seed 됩니다.

## 2. Google OAuth 설정

Supabase Dashboard에서 `Authentication -> Providers -> Google`을 활성화합니다.

현재 프로젝트는 Google 최초 로그인을 전제로 하므로, Google provider가 꺼져 있으면 로그인 플로우가 동작하지 않습니다.

Google OAuth 사용자 유형은 `External`을 기준으로 합니다.

실제 학교 구성원 여부와 예외 계정 허용은 Google OAuth 설정이 아니라 Supabase Auth Hook과 DB 정책에서 판단합니다.

현재 Google OAuth Client ID는 다음과 같습니다.

```text
90336747619-5vb0mtujtvai7md1mufaebc9bpjp11gc.apps.googleusercontent.com
```

Client Secret은 Git에 커밋하지 않고 Supabase Dashboard의 Google Provider 설정에만 입력합니다.

필수 redirect URL 예시:

- `http://localhost:5173/auth/callback`
- 배포 도메인 사용 시 `https://<your-domain>/auth/callback`

Google Console OAuth 설정에도 같은 callback/redirect URL을 맞춰야 합니다.

## 3. Auth Hook 연결

Supabase Dashboard에서 `Authentication -> Hooks`로 이동해서 `Before User Created` hook을 연결합니다.

- Hook function: `public.before_user_created_kobot`

이 hook은 다음 정책을 강제합니다.

- 신규 계정 생성은 `Google OAuth`여야 함
- `hd = kookmin.ac.kr` 우선 허용
- `hd`가 없더라도 `@kookmin.ac.kr` suffix 허용
- `allowed_login_exceptions`에 승인된 예외 이메일 허용

## 4. 프론트 환경변수

`.env` 파일에 아래 값을 설정합니다.

```env
VITE_SUPABASE_URL=https://tqidhnjmjbvrzdeiqlqo.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

예시는 `.env.example`에 포함되어 있습니다.

## 5. 운영진 승인 플로우

기본 첫 로그인 사용자는 `member_accounts.status = pending`으로 생성됩니다.

- `active`: member workspace 접근 허용
- `pending`: 승인 대기 화면만 노출
- `suspended`, `rejected`, `alumni`: member workspace 차단

외부 Google 계정 예외 허용은 `allowed_login_exceptions`에 이메일을 추가해서 처리합니다.

## 6. 아이디 로그인

아이디 로그인은 새 계정을 만드는 방식이 아니라, **Google로 만든 같은 계정**에 추가 로그인 수단을 붙이는 구조입니다.

흐름:

1. Google 로그인
2. `/member/profile`에서 `login_id` 등록
3. 같은 화면에서 비밀번호 등록
4. 이후 `/login`에서 `login_id + password` 로그인 가능

실제 로그인 해석은 아래 RPC를 통해 처리됩니다.

- `resolve_login_email(login_id_input text)`

즉 화면에서는 아이디를 받지만, 내부적으로는 해당 아이디에 연결된 이메일 계정을 찾은 뒤 Supabase password login을 수행합니다.

## 7. 권한 구조

초기 seed 기준:

- 조직 직책
  - `president`
  - `vice-president`
- 팀 역할
  - `team-lead`
  - `team-member`
- 팀
  - `dev-a`
  - `dev-b`
  - `dev-c`
  - `dev-d`
  - `research`
  - `web-iot`

권한 체크는 프론트 메뉴 숨김만이 아니라 DB 함수 + RLS까지 연결되어 있습니다.

## 8. 현재 구현 범위

프론트에 포함된 흐름:

- `/login`
- `/auth/callback`
- `/member/pending`
- `/member/profile`
- `/member` 이하 session/active/permission guard

아직 남아 있는 운영 UI:

- 예외 이메일 관리 화면
- 멤버 승인/팀 배정/직책 배정 관리자 화면
- 실제 dashboard 데이터 연결
