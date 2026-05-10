# Page Audit Framework

마지막 갱신: 2026-05-10

각 Wave 첫 단계는 페이지 단위 audit 카드 작성이다. 한 페이지당 한 파일을 `docs/design/audit/<page>.md` 로 만든다.

## audit 카드 템플릿

```md
# <PageName> audit

라우트: `/member/<...>`
파일: `src/app/pages/.../<File>.tsx`
담당 Wave: W?

## Before
- 데스크탑 스크린샷 / 모바일 스크린샷 (퍼블릭 path 또는 Claude Preview 캡처)
- 첫 인상 1줄

## 문제 리스트
- [ ] 정보 위계: 가장 큰 게 가장 중요한가?
- [ ] hex/임의 색 사용 위치 (`grep "#[0-9a-fA-F]\{3,6\}" file.tsx`)
- [ ] 모바일 깨짐 여부 (sm 미만)
- [ ] empty 상태 디자인 부재
- [ ] loading 상태 디자인 부재
- [ ] error 상태 디자인 부재
- [ ] 권한 거부 fallback 부재
- [ ] 자체 모달/AlertDialog 인라인 (`ConfirmActionDialog` 미사용)
- [ ] inline `<h1>` (PageHeader 미사용)
- [ ] 페이지에서 트리거되는 모달·토스트·드로어 톤 흐트러짐

## 인접 페이지 동선
- 이 페이지 진입: 어디서?
- 이 페이지 이탈: 어디로? (back, primary CTA, secondary)

## 적용할 6단계 playbook
1. Before 문서화
2. 정보 위계 재설계 메모
3. 모바일 우선 wireframe
4. empty/loading/error 케이스 디자인
5. 모달·토스트 정합
6. 인접 동선 점검

## 테스트 invariants (사전 grep)
`grep -nE "assert\.(match|doesNotMatch).*$PAGE" scripts/*.test.mjs` 로 사전 추출. 변경 후 모든 정규식 통과 확인.

## After
- 데스크탑 / 모바일 스크린샷
- 한 줄 요약 (X 했고 Y 효과)
- PR 링크
```

## audit 우선순위 (Wave 매핑)

| Wave | 페이지 | audit 파일 |
| --- | --- | --- |
| W1 | Events.tsx | `events.md` (작성됨 — 본 리뉴얼 PR 포함) |
| W1 | EventDetail.tsx | `event-detail.md` |
| W1 | EventCreate.tsx | `event-create.md` (token-only pass 권장) |
| W1 | Forms.tsx | `forms.md` (작성됨 — 본 리뉴얼 PR 포함) |
| W1 | FormDetail.tsx | `form-detail.md` |
| W1 | FormCreate.tsx | `form-create.md` (token-only pass 권장) |
| W2 | Dashboard, Members, Profile, Notice, Announcements, AnnouncementDetail, Tags | per file |
| W3 | Admin, MemberAdmin, Permissions, InviteCodes, Security, Integrations, ContactRequests | per file |
| W4 | SpaceBooking, Quests, Templates, Attendance, ProjectStudyPanel, ProjectDetail, StudyPostWrite, Welcome, ProfileSettings, AccountInfo, ApprovalPending | per file |
| W5 | Landing, Login, Recruit, Privacy, Terms, Contact, public Notice, NoticeDetail | per file |
| W6 | ComingSoonPage | `coming-soon.md` (적용됨) |

## 페이지 사이즈가 커서 즉시 풀 리디자인이 어려운 경우

EventCreate (1113L), FormCreate (1964L), FormDetail (844L) 처럼 큰 페이지는 다음 순서:

1. **Token-only pass**: hex/magic 값을 토큰으로 치환하는 PR 1개
2. **Primitive adoption pass**: PageHeader/EmptyState/ConfirmActionDialog 도입 PR 1개
3. **Layout/hierarchy pass**: 정보 위계 재설계 PR 1개 (가장 위험, 정책 테스트 위반 가능성)

이 3-pass 접근은 각 PR 회귀 위험을 격리하고 리뷰를 빠르게 만든다.
