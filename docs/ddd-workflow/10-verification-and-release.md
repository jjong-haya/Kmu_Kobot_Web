# 10. 검증과 릴리스

## 1. 이번 작업 검증

### 1.1 스킬 검증

| 확인 | 방법 | 결과 | 비고 |
| --- | --- | --- | --- |
| skill directory 생성 | `C:\Users\jongh\.codex\skills\ddd-spec-workflow` 확인 | Pass | `SKILL.md`, references, scripts, agents 생성 |
| skill validation | `quick_validate.py` | Pass | Windows 인코딩 문제로 `PYTHONUTF8=1` 사용 |
| scaffold script | `scaffold_ddd_workflow.py --root ... --project "KOBOT Web"` | Pass | `docs/ddd-workflow` 12개 파일 생성 |

### 1.2 문서 검증

| 확인 | 방법 | 결과 | 비고 |
| --- | --- | --- | --- |
| 사용자 결정 파일 | `00-user-decision-checklist.md` | Pass | P0/P1 결정 분리 |
| 전체 파일 인벤토리 | `01-project-inventory.md` | Pass | 자동 생성 파일 목록 포함 |
| 도메인 발견 | `02-domain-discovery.md` | Pass | 12개 context 정리 |
| 이벤트 스토밍 | `03-event-storming.md` | Pass | Commands/Events/Policies/Read Models 작성 |
| 데이터/RLS 위험 | `04-data-schema-and-security.md` | Pass | P0 DB 위험 정리 |
| 기능 명세 | `05-functional-spec.md` | Pass | Auth/Project/Invite/GitHub/Contact/Vote 포함 |
| 디자인 명세 | `06-design-spec.md` | Pass | IA, route, copy, state 규칙 작성 |
| 구현 계획 | `07-implementation-plan.md` | Pass | Phase별 계획 작성 |
| task checklist | `08-task-checklist.md` | Pass | 작은 작업 단위 작성 |
| agent review log | `09-agent-review-log.md` | Pass | 서브 에이전트 발견 반영 |
| production build | `npm run build` | Pass | Vite build 성공, chunk size warning만 존재 |
| auth/join UX patch build | `npm run build` | Pass | 2026-04-30, raw error 문구 정리 및 `next` 보존 이후 Vite build 성공 |

## 2. 코드 검증

### 2.1 이번 작업의 코드 영향

이번 작업에서는 문서/스킬 기반 위에 Auth/Join/Pending 1차 UX 패치를 반영했습니다.

| 영역 | 결과 |
| --- | --- |
| OAuth callback | PKCE 실패/취소/제한 계정 안내를 사용자 친화 문구로 정리 |
| Supabase client | `detectSessionInUrl: false`로 callback 컴포넌트가 code 교환을 단독 처리 |
| next 보존 | 로그인, callback, join, pending 이동 사이에서 safe internal path만 유지 |
| pending 화면 | ID 생성/프로필 수정 CTA 없이 승인 대기 안내만 표시 |
| join 화면 | Google 이름을 실명으로 단정하지 않고 수정 가능 안내 |
| landing CTA | 비로그인은 `/login?next=%2Fmember`, 로그인 사용자는 상태별 CTA 표시 |
| member status | `project_only`, `withdrawn` 타입과 안내 문구 추가 |
| build | `npm run build` 통과, chunk size warning만 존재 |

### 2.2 다음 코드 작업 전 필수 검증

| 검증 | 명령/방법 | 기준 |
| --- | --- | --- |
| build | `npm run build` | Vite build 성공 |
| auth flow | localhost + production redirect | PKCE 오류 없음 |
| join/pending | 수동 브라우저 테스트 | pending 화면에 ID 생성 CTA 없음 |
| RLS/RPC | Supabase SQL review | 상태 전이 direct update 없음 |
| mobile | 브라우저 responsive | 로그인/join/pending 화면 깨짐 없음 |

## 3. 릴리스 Gate

### 3.1 배포 전

- [ ] P0 결정 모두 Accepted 또는 명시적 ASSUMPTION.
- [ ] Supabase migration은 rollback 가능한 additive 방식.
- [ ] Vercel 환경변수 확인.
- [ ] Supabase Redirect URLs에 localhost와 production callback 등록.
- [ ] 개인정보 처리방침/약관이 실제 수집 항목과 일치.
- [ ] 감사 로그 payload redaction 확인.

### 3.2 배포 후

- [ ] Google login production 테스트.
- [ ] 첫 로그인 → join → pending 흐름 테스트.
- [ ] active 계정 workspace 진입 테스트.
- [ ] 비국민대 계정 제한 안내 테스트.
- [ ] 주요 오류 화면 raw technical message 노출 여부 확인.
