# Member 영역 분석

## 1. MemberLayout 구조

파일: `src/app/layouts/MemberLayout.tsx`

정보 구조는 아래 8개 섹션으로 나뉜다.

- Overview
- Communication
- Learning
- Projects
- Events & People
- Resources
- Management
- Admin

레이아웃 구성

- 데스크톱 고정 사이드바
- 모바일 오버레이 사이드바
- 상단 헤더
- 검색 버튼과 검색 모달
- 알림 배지
- 계정 메뉴
- `Outlet` 기반 본문

현재 가정

- `isAdmin = true`로 관리자 메뉴가 항상 노출된다.
- 사용자 정보는 `John Doe`, `JD`, `Member`로 고정이다.
- 검색 UI는 있으나 검색 로직은 없다.

즉, member shell은 "권한이 있는 실제 서비스 레이아웃"처럼 보이지만, 구현은 아직 시각적 스캐폴딩에 가깝다.

## 2. 활성 페이지와 비활성 페이지

### 활성 페이지

- Dashboard
- Notifications
- Announcements
- QnA
- StudyLog
- StudyPlaylist
- PeerReview
- Projects
- Showcase
- Events
- OfficeHours
- Members
- Resources
- Templates
- Equipment
- Roadmap
- Retro
- Changelog
- Forms
- Integrations
- Permissions

### 비활성 페이지

- Notice
- Attendance
- Study
- Admin

비활성 페이지는 파일은 남아 있으나 `routes.tsx`에 연결되지 않았다. 이 때문에 현재 정보 구조와 과거 시안이 한 저장소 안에 동시에 남아 있는 상태다.

## 3. 기능군별 분류

### 개요

- `Dashboard`: 완성형에 가까운 허브 화면
- `Notifications`: 읽음/미읽음/멘션 구분은 있으나 액션은 얕음

### 소통

- `Announcements`: 비교적 완성도가 높음
- `QnA`: 브라우징은 되지만 질문 생성과 답변 흐름이 없음
- `Notice`: 구형 공지 보드, 현재 비활성

### 학습

- `StudyLog`: 피드와 태그 구조가 잘 잡힘
- `StudyPlaylist`: 학습 경로형 화면으로 닫힌 구조
- `PeerReview`: 리뷰 요청/목록은 있으나 핵심 행동이 비어 있음
- `Study`: 구형 과제 제출 화면, 비활성

### 프로젝트

- `Projects`: member 영역에서 비교적 완성형
- `Showcase`: 브라우징은 되지만 제출과 상세 흐름이 비어 있음

### 이벤트와 사람

- `Events`: 리스트는 괜찮지만 캘린더 탭은 미완성
- `OfficeHours`: 예약 흐름이 없음
- `Members`: 디렉터리 브라우징은 되지만 검색/필터/액션이 얕음
- `Attendance`: 구형 출석 입력 화면, 비활성

### 리소스

- `Resources`: 가장 완성형에 가까운 페이지 중 하나
- `Templates`: 카테고리 브라우징 중심
- `Equipment`: 재고와 상태 표현은 좋지만 대여/반납이 미구현

### 운영과 관리자

- `Roadmap`: 조회형 페이지로 안정적
- `Retro`: 보기 구조는 있으나 생성과 편집은 비어 있음
- `Changelog`: 조회형 페이지로 안정적
- `Forms`: 운영 도구 시안
- `Integrations`: 운영 대시보드 시안
- `Permissions`: 설명형 권한 매트릭스
- `Admin`: 통합형 구버전 관리자 페이지, 비활성

## 4. 반복 패턴

member 영역은 개별 페이지 수가 많지만 렌더링 패턴은 매우 비슷하다.

대표 패턴

- 페이지 헤더 + 설명 + 우측 CTA
- 통계 카드 그리드
- `Tabs + filter + map`
- 카드형 엔터티 목록
- 상태 배지
- 하단 가이드 카드

재사용 후보

- 멤버/멘토/쇼케이스 카드
- 통계 카드
- 관리용 테이블
- 페이지 헤더 블록
- 정책/가이드 박스

현재는 이 패턴들이 각 페이지 안에 직접 복제되어 있다.

## 5. 핵심 기술 부채

### 인증과 권한 부재

- 실제 라우트 가드가 없다.
- `isAdmin = true` 하드코딩으로 관리자 UI를 노출한다.
- `Permissions` 페이지가 설명하는 4단계 모델과 layout이 가정하는 2단계 모델이 어긋난다.

### 라우트 드리프트

- 대시보드 내부 링크가 `/member/notice`처럼 현재 없는 활성 라우트로 연결된다.
- 비활성 페이지 파일이 남아 있어 IA를 혼란스럽게 만든다.

### 목업성 액션

- 버튼이 토스트만 띄우거나 아무 동작도 하지 않는 경우가 많다.
- 예약, 제출, 다운로드, 공유, 즐겨찾기 등 핵심 액션이 대부분 실제 서비스 동작으로 이어지지 않는다.

### 검색/필터 일관성 부족

- 일부 페이지는 진짜 필터링을 한다.
- 일부 페이지는 검색창만 있고 상태 연결이 없다.

### 내부 라우팅 방식 혼재

- `Link`와 `<a href>`가 섞여 있다.
- 내부 이동에서도 전체 리로드 위험이 있다.

### 데이터 구조 부재

- 페이지별로 더미 배열을 직접 선언한다.
- 타입, 도메인 모델, 공통 API 계층이 없다.

## 6. Member 영역 총평

member 영역은 "서비스 메뉴판"으로서는 매우 넓고 풍부하다. 하지만 "실제 운영되는 내부 서비스"로 보려면 아래 순서의 정리가 필요하다.

1. 활성 라우트와 비활성 페이지 정리
2. 인증과 권한 모델 확정
3. 공통 데이터 모델 정의
4. 핵심 행동 흐름 연결
5. 중복 카드와 레이아웃 컴포넌트 추출
