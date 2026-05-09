# 폼 / 참여자 조사

폼은 행사 신청, 참여자 조사, 운영 신청, 피드백을 받는 도메인이다. 질문 구성과 응답, 댓글, 대회 팀/리그전은 폼 도메인 안에서 관리한다.

## 기능

- `/member/forms`: 폼 관리. 카드 앞면은 운영 요약과 신청자 화면 `열기`, 우측 상단 점 3개 메뉴는 수정·삭제·상태변화를 담당한다.
- `/member/forms/new`: 폼 만들기. 단답형, 장문형, 객관식, 체크박스, 드롭다운, 선형 배율, 팀원 검색, 날짜, 시간 질문을 만든다.
- `/member/forms/:formId/edit`: 기존 폼 수정. 생성 화면과 같은 빌더를 쓰되 저장 시 같은 폼 ID, 기존 응답, 댓글, 응답 시트 연결을 유지한다.
- `/member/forms/:formId`: 신청자가 실제로 보는 응답 작성 화면. 운영진은 응답 시트, 댓글, 팀/리그전 관리 탭도 볼 수 있다.
- 게임대회 템플릿은 `kobot-game-cup-2026-registration` 폼을 만든다. 참가자 조사 질문, 팀 등록, 라운드 로빈 리그전 대진표가 같이 켜진다.
- 폼 빌더의 질문 제목/설명은 멀티라인 입력이다. 작성 중 `Shift+Enter`는 저장이 아니라 줄바꿈이어야 하며, 단일 입력창의 Enter도 상위 폼 저장으로 전파되지 않아야 한다.
- 폼 빌더의 헤드 영역은 질문 목록을 감싸지 않는 독립 카드다. 폼 설명은 내부 스크롤을 만들지 않고 내용 길이에 맞춰 카드 높이가 늘어난다.
- 폼 빌더의 작성 중 초안은 수정 즉시 탭 단위 `sessionStorage`에만 임시 저장한다. 새로고침/재마운트 복구용이며, 실제 저장 또는 “저장하지 않고 이동” 시 즉시 삭제한다.
- 연결 질문은 2차원 배열처럼 배치한다. 가로축은 `메인 질문 → 선택지별 연결 카드`이고, 세로축은 해당 선택지에 속한 연결 질문 목록이다. 예를 들어 메인 선택지가 `롤`, `협곡`, `오버워치`라면 오른쪽으로 `롤 연결 카드`, `협곡 연결 카드`, `오버워치 연결 카드`가 각각 생기고, 롤 관련 추가 질문은 롤 연결 카드 안에서 아래로 쌓인다. 질문 카드 폭은 헤드/개인정보 카드와 같은 컬럼 폭을 써야 한다. 메인/선택지별 연결 카드 이동은 카드 바깥 세로 중앙의 배경 없는 좌우 꺾쇠로 처리하고, 각 연결 카드 내부의 세로 스크롤바는 숨긴다. 보이지 않는 연결 질문 페이지 높이가 메인 질문 사이의 세로 간격을 밀어내면 안 된다.
- `팀원 검색` 질문은 응답자가 동아리 가입자를 검색해 선택하는 질문이다. 저장 값은 자유 텍스트 이름이 아니라 `{ userId, displayName, loginId, department, tags }` 형태의 정규화된 회원 참조이며, 질문별 `memberSearchTagIds`로 검색 범위를 제한할 수 있다.

## 권한

- 폼 관리 목록, 생성, 수정, 삭제, 상태변화는 `forms.manage` 권한이 필요하다.
- 부회장 역할 태그도 `forms.manage`와 `/member/forms` 메뉴를 받는다. 회장/부회장 사이드바와 태그 카탈로그, DB 마이그레이션을 함께 갱신해야 한다.
- 개별 폼 응답 페이지는 활성 부원이 직접 링크로 접근할 수 있지만, 상태가 `예정(draft)` 또는 `마감(closed)`이거나 응답 기간 밖이면 신청자는 폼 내용을 볼 수 없다.
- 신청자용 폼 상세 read model은 응답 작성에 필요한 질문과 상태만 포함한다. `forms.manage`가 없는 사용자는 응답 시트, 응답 목록, 댓글, 팀/경기 운영 데이터를 읽기 모델에서도 받으면 안 된다.
- 제출 API(`submitFormResponse`)도 `getFormResponseAvailability`를 다시 검사한다. 화면 차단은 편의이고, 제출 차단이 2차 방어다.
- 경기 점수 저장은 `forms.manage` 권한이 있는 사용자에게만 노출한다.

## 상태 정책

| 상태 | 내부 값 | 신청자 화면 | 제출 API |
| --- | --- | --- | --- |
| 예정 | `draft` | 차단 | `form_not_started` |
| 진행 | `active` | 허용, 단 응답 기간 검사 | 허용, 단 응답 기간 검사 |
| 마감 | `closed` | 차단 | `form_closed` |

상태변화 UI는 카드 뒷면에서 처리한다. 저장 시 `updateFormStatus`가 `status`와 `acceptsResponses`를 같이 바꾼다. `active`만 `acceptsResponses=true`다.

## 데이터 경계

- 질문, 응답, 댓글, 팀, 경기 결과는 폼 도메인 데이터다.
- 팀원 검색 응답은 폼 응답 내부의 회원 참조 데이터다. 이름 문자열 후처리용 자유 텍스트를 저장하지 않고, 회원 디렉터리 원본 데이터나 태그 배정 데이터를 폼 응답에 복제하지 않는다.
- 작성 중 초안은 세션 범위의 임시 UI 편집 데이터다. 저장된 폼 aggregate나 태그/행사/응답 도메인에 섞지 않는다.
- 행사 도메인은 내부 폼 URL만 연결한다. 행사 본문 안에 응답이나 대진표 데이터를 중복 저장하지 않는다.
- 현재 구현은 `src/app/api/forms.ts`의 로컬 저장소 기반이다. Supabase 영구 저장으로 옮길 때도 같은 aggregate 경계를 유지한다.

## Touchpoints

폼 관리나 상태 정책을 바꾸면 아래를 같이 확인한다.

- `src/app/pages/member/Forms.tsx` — 폼 관리 카드, 점 3개 메뉴, 카드 뒤집기 상태변화, 삭제 확인창.
- `src/app/pages/member/FormCreate.tsx` — 새 폼/기존 폼 수정 빌더, 저장 후 상세 이동, 연결 질문 빌더, 팀원 검색 질문 설정과 태그 제한.
- `src/app/pages/member/FormDetail.tsx` — 신청자 응답 화면, 운영진 관리 탭, 신청자 접근 차단, 회원 디렉터리 기반 팀원 검색 입력.
- `src/app/api/forms.ts` — `saveForm`, `updateFormStatus`, `deleteForm`, `getFormResponseAvailability`, `submitFormResponse`, 질문/응답 정규화.
- `src/app/routes.tsx` — `/member/forms`, `/member/forms/new`, `/member/forms/:formId/edit`, `/member/forms/:formId`.
- `src/app/layouts/MemberLayout.tsx` — 회장/부회장 사이드바의 `폼 관리` 메뉴.
- `src/app/config/nav-catalog.ts` — 태그 상세·태그 생성에서 선택하는 사이드바 메뉴 카탈로그.
- `supabase/migrations/*forms_management*` — 배포 DB의 역할 태그 권한과 메뉴 seed.
- `scripts/forms-policy.test.mjs` — 폼 상태/접근/관리 UI 회귀 테스트.
