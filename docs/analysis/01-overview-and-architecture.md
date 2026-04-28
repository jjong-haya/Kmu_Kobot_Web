# 개요와 아키텍처

## 1. 프로젝트 성격

이 프로젝트는 동아리 또는 커뮤니티 웹사이트를 목표로 한 프론트엔드 중심 SPA다. 코드 구조와 메타 파일을 보면 `Figma Make`에서 생성된 초안 위에 React 라우팅과 shadcn UI를 얹어 확장한 형태에 가깝다.

근거가 되는 파일

- `package.json`
- `vite.config.ts`
- `src/main.tsx`
- `src/app/App.tsx`
- `src/app/routes.tsx`
- `ATTRIBUTIONS.md`

## 2. 현재 인벤토리

- public 페이지: 7개
- member 페이지: 25개
- member 활성 라우트: 21개
- member 비활성 페이지: 4개
- layout: 2개
- UI 컴포넌트 파일: 48개
- 로컬 이미지 자산: 4개

member 비활성 페이지

- `src/app/pages/member/Admin.tsx`
- `src/app/pages/member/Attendance.tsx`
- `src/app/pages/member/Notice.tsx`
- `src/app/pages/member/Study.tsx`

## 3. 렌더링 흐름

앱의 기본 흐름은 매우 단순하다.

1. `index.html`이 `/src/main.tsx`를 불러온다.
2. `src/main.tsx`가 `App`과 전역 CSS를 마운트한다.
3. `src/app/App.tsx`가 `RouterProvider`와 전역 `Toaster`를 렌더링한다.
4. `src/app/routes.tsx`가 `/`와 `/member`를 각각 `PublicLayout`, `MemberLayout`에 연결한다.
5. 각 layout의 `Outlet`에서 실제 페이지가 렌더링된다.

즉, 아키텍처는 복잡하지 않다. 복잡도는 라우팅 계층보다는 개별 페이지 파일 내부에 몰려 있다.

## 4. 라우팅 구조

### public

- `/`
- `/projects`
- `/notice`
- `/recruit`
- `/contact`
- `/activities`
- `/faq`

### member

- `/member`
- `/member/notifications`
- `/member/announcements`
- `/member/qna`
- `/member/study-log`
- `/member/study-playlist`
- `/member/peer-review`
- `/member/projects`
- `/member/showcase`
- `/member/events`
- `/member/office-hours`
- `/member/members`
- `/member/resources`
- `/member/templates`
- `/member/equipment`
- `/member/roadmap`
- `/member/retro`
- `/member/changelog`
- `/member/forms`
- `/member/integrations`
- `/member/permissions`

### fallback

- `* -> NotFound`

## 5. 구조적 특징

### 장점

- public과 member 경험이 별도 layout으로 분리되어 있어 읽기 쉽다.
- 엔트리 파일 수가 적고 전체 진입 흐름이 명확하다.
- `components/ui`를 중심으로 재사용 의도를 갖춘 구조다.

### 한계

- 데이터 레이어가 없다. 대부분의 페이지가 파일 상단의 하드코딩 배열을 직접 렌더링한다.
- 인증과 권한이 없다. member 영역은 사실상 시각적으로만 구분된다.
- 실제 비즈니스 로직보다 화면 시안과 목업이 많다.
- 페이지별 UI와 상태가 커지면서, 단일 파일 비대화가 진행되고 있다. 특히 `src/app/pages/public/Landing.tsx`는 대표적인 거대 파일이다.

## 6. 데이터와 상태 관리 방식

현재 코드베이스의 데이터 전략은 "페이지 내부 정적 배열 + 로컬 state"다.

패턴

- 파일 상단에 더미 배열 선언
- 컴포넌트 내부에서 `filter`, `sort`, `map` 실행
- 검색어, 탭, 모달 열림 여부 정도만 local state로 관리
- 서버 통신, 로더, 캐시, 공통 훅, API client 없음

이 구조는 초기 시안 제작에는 빠르지만, 다음 단계에서 바로 한계가 온다.

- 중복 데이터가 여러 페이지에 복제된다.
- 날짜와 상태가 시간이 지나면서 쉽게 낡는다.
- 폼 제출이나 예약처럼 실제 액션이 필요한 부분이 대부분 목업으로 남는다.

## 7. 현재 코드베이스를 한 줄로 정리하면

정보 구조와 시각 디자인 틀은 이미 넓게 잡혀 있지만, 데이터 연결, 권한 제어, 공통 도메인 모델, 운영 자동화는 아직 거의 시작되지 않은 상태다.
