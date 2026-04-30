# 10. 검증 및 릴리스 기록

## 1. 릴리스 게이트

### 1.1 코드 검증

- [ ] `git diff --check`
- [ ] `npm run build`
- [ ] 변경된 경로의 주요 사용자 흐름 수동 확인

### 1.2 DB 검증

- [ ] migration 파일이 additive인지 확인
- [ ] 기존 데이터와 충돌하는 constraint가 없는지 확인
- [ ] Supabase 원격 DB에 migration 적용
- [ ] RPC 또는 RLS 변경이 있으면 최소 존재 여부 확인

### 1.3 보안/개인정보 검증

- [ ] raw Supabase/PostgREST/PKCE 오류가 사용자에게 그대로 노출되지 않는다.
- [ ] 개인정보, 토큰, 비공개 README, 투표 선택값이 감사 로그 payload에 저장되지 않는다.
- [ ] anon에게 열 필요 없는 RPC는 authenticated만 grant한다.

## 2. 2026-05-01 Auth/LoginId 중복 검사 검증

### 2.1 검증 대상

| 구분 | 파일 |
| --- | --- |
| DB | `supabase/migrations/20260501043000_login_id_availability.sql` |
| Auth | `src/app/auth/AuthProvider.tsx` |
| Types | `src/app/auth/types.ts` |
| UI | `src/app/pages/member/ProfileSettings.tsx` |
| DDD | `docs/ddd-workflow/13-full-project-ddd-revalidation-2026-05-01.md` |

### 2.2 기대 동작

1. ID 입력칸에서 형식이 맞는 ID를 blur하면 중복 확인을 시도한다.
2. 이미 사용 중이면 "이미 사용 중인 ID입니다."를 ID 입력칸 아래에 표시한다.
3. 회원가입 요청 버튼을 눌렀을 때 중복이면 ID 입력칸으로 스크롤하고 빨간 테두리/진동을 적용한다.
4. 저장 직전 다시 중복 확인을 수행한다.
5. 동시에 같은 ID를 제출하면 DB unique index가 최종 차단한다.
6. 익명 사용자는 availability RPC를 호출할 수 없다.

### 2.3 실행 결과

| 명령 | 목적 | 결과 |
| --- | --- | --- |
| `git diff --check` | whitespace 및 patch sanity | 통과 |
| `npm run build` | TypeScript/Vite production build | 통과. Vite chunk size warning만 존재 |
| `npx supabase db push --db-url ... --yes` | 원격 Supabase RPC 반영 | 통과. `20260501043000` 적용 |
| `npx supabase migration list --db-url ...` | 원격 migration 이력 확인 | 통과. local/remote 모두 `20260501043000` 일치 |

## 3. 릴리스 주의

### 3.1 Vercel과 Supabase 순서

이번 변경은 프론트 코드가 새 RPC `is_login_id_available`를 호출한다. 따라서 Vercel 배포 전에 Supabase migration이 원격 DB에 적용되어야 한다.

### 3.2 실패 시 사용자 경험

RPC가 없거나 실패하면 사용자에게 raw DB 오류 대신 "ID 중복 확인을 완료하지 못했습니다." 계열의 안전한 문구를 보여준다.

### 3.3 알려진 잔여 경고

Vite production build에서 chunk size warning이 발생할 수 있다. 이는 이번 기능의 실패는 아니지만 route-level lazy loading으로 추후 개선할 수 있다.
