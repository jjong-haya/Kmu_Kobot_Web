# 대시보드 개발 계획

## 1. 현재 결론

현재 [Dashboard.tsx](c:/Users/jongh/Desktop/kook/2026-1/코봇/Web_final/src/app/pages/member/Dashboard.tsx)는 "완성된 대시보드"가 아니라 "대시보드 목업"에 가깝다.

근거

- 모든 데이터가 컴포넌트 내부 하드코딩 배열이다.
- 사용자 정보가 `John Doe`로 고정되어 있다.
- 내부 이동에 `Link` 대신 `<a href>`가 섞여 있다.
- 일부 링크는 현재 활성 라우트와 맞지 않는다.
- 문자열 인코딩이 깨져 보이는 텍스트가 많다.
- 카드, 할 일, 일정, 공지, 자료, 프로젝트가 전부 정적 더미 데이터다.

즉, 지금 필요한 것은 “디자인 미세 개선”보다 “대시보드를 실제 서비스 화면으로 재정의하는 개발”이다.

## 2. 현재 대시보드가 하는 일

현재 파일은 아래 영역으로 구성되어 있다.

- 상단 인사말과 알림 버튼
- KPI 카드 4개
- Quick Actions
- 이번 주 일정
- 오늘 할 일
- 최근 공지
- 최근 자료
- 내 프로젝트 테이블

이 구성 자체는 나쁘지 않다. 문제는 각 섹션이 실제 도메인 데이터와 연결되어 있지 않다는 점이다.

## 3. 대시보드가 진짜로 해야 할 일

대시보드는 member 서비스의 첫 화면이므로, “모든 것을 많이 보여주는 화면”이 아니라 “지금 이 사용자가 바로 행동해야 하는 것”을 보여줘야 한다.

핵심 목적

- 오늘 해야 할 일 보여주기
- 최근 중요한 공지 보여주기
- 다가오는 일정 보여주기
- 내 프로젝트 상태 요약 보여주기
- 자주 가는 기능으로 빠르게 이동시키기

즉, 대시보드는 정보 허브가 아니라 “행동 중심 시작 화면”이어야 한다.

## 4. MVP 범위

대시보드 1차 개발에서는 아래만 제대로 만들면 된다.

### 반드시 포함

- 사용자 인사말과 역할
- 오늘 또는 이번 주 일정
- 미완료 할 일
- 최근 공지 3~5개
- 내 프로젝트 1~3개 요약
- 빠른 이동 버튼

### 있으면 좋은 것

- 읽지 않은 알림 개수
- 출석률, 과제 수, 진행 프로젝트 수 같은 KPI
- 최근 학습 로그
- 최근 자료

### 1차에서 빼도 되는 것

- 복잡한 차트
- 개인화 추천
- 실시간 활동 피드
- drag and drop 위젯
- 커스터마이징 가능한 레이아웃

## 5. 추천 정보 구조

### 상단

- 페이지 제목
- 사용자 이름
- 역할 배지
- 알림 버튼

### 첫 번째 줄

- 오늘 할 일
- 이번 주 일정

이 두 블록이 가장 중요하다. 사용자가 대시보드에 들어온 이유와 가장 잘 맞는다.

### 두 번째 줄

- 최근 공지
- 내 프로젝트 요약

### 세 번째 줄

- 빠른 이동
- 최근 자료 또는 최근 학습 로그

### KPI 배치 원칙

KPI는 가장 위가 아니라 상단 요약 영역 옆이나 아래 보조 정보로 두는 것이 좋다. 현재처럼 KPI를 첫 화면 핵심으로 두면 실제 행동 흐름보다 숫자 장식이 앞선다.

## 6. 데이터 모델 초안

대시보드는 여러 도메인을 가져와 조합하므로, 적어도 아래 형태의 view model이 필요하다.

```ts
type DashboardViewModel = {
  user: {
    id: string;
    name: string;
    role: "admin" | "leadership" | "member" | "guest";
    unreadNotifications: number;
  };
  stats: {
    attendanceRate?: number;
    activeProjects?: number;
    pendingTasks?: number;
    upcomingEvents?: number;
  };
  todos: Array<{
    id: string;
    title: string;
    priority: "high" | "medium" | "low";
    dueDate?: string;
    completed: boolean;
    href?: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    date: string;
    time?: string;
    type?: string;
    href?: string;
  }>;
  notices: Array<{
    id: string;
    title: string;
    category: string;
    date: string;
    href?: string;
  }>;
  projects: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    progress: number;
    href: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    icon: string;
  }>;
};
```

처음에는 이 모델을 mock 데이터로 채워도 된다. 중요한 것은 `Dashboard.tsx` 내부에 하드코딩 배열을 직접 박지 않고, 대시보드 전용 데이터 계층을 분리하는 것이다.

## 7. 현재 파일에서 바로 손봐야 하는 문제

### 구조 문제

- [Dashboard.tsx](c:/Users/jongh/Desktop/kook/2026-1/코봇/Web_final/src/app/pages/member/Dashboard.tsx)는 데이터 선언, 레이아웃, 카드 렌더링이 한 파일에 섞여 있다.

### 라우팅 문제

- [Dashboard.tsx](c:/Users/jongh/Desktop/kook/2026-1/코봇/Web_final/src/app/pages/member/Dashboard.tsx:288) 는 `/member/notice`로 링크하지만 현재 활성 라우트는 `announcements`다.
- 내부 이동도 `<a href>`를 많이 써서 SPA 내비게이션 일관성이 깨진다.

### 콘텐츠 문제

- 문자열 깨짐이 심하다.
- 날짜가 낡았다.
- 사용자 이름이 목업 상태다.

### 제품 문제

- KPI가 실제 사용자 행동보다 앞에 배치되어 있다.
- 중요한 카드와 장식성 카드의 우선순위가 뒤섞여 있다.

## 8. 권장 구현 단계

### 1단계

- 깨진 문자열 복구
- 내부 링크를 `Link`로 교체
- 잘못된 라우트 경로 수정

### 2단계

- 대시보드 mock 데이터를 파일 밖으로 분리
- `types` 또는 `data` 레이어 도입
- 섹션별 컴포넌트 분리

추천 분리 대상

- `DashboardHeader`
- `DashboardTodoCard`
- `DashboardEventsCard`
- `DashboardAnnouncementsCard`
- `DashboardProjectsCard`
- `DashboardQuickActions`
- `DashboardStats`

### 3단계

- 정보 우선순위 재배치
- KPI를 보조 정보로 이동
- “오늘 할 일 / 이번 주 일정”을 첫 줄 핵심 블록으로 승격

### 4단계

- 실제 도메인 데이터 연결 준비
- 공지, 일정, 프로젝트, 할 일의 데이터 공급 인터페이스 정의

## 9. 구현 전에 확정해야 할 것

대시보드 개발 전에 아래는 결정해야 한다.

- 대시보드의 1차 사용자: 일반 member 중심인지, admin도 같은 화면을 쓸지
- 할 일의 출처: 과제, 프로젝트, 운영 업무 중 어디까지 포함할지
- 일정의 출처: events만 보여줄지, office hours와 study 일정도 합칠지
- 공지의 출처: announcements를 그대로 재사용할지
- KPI를 실제 지표로 넣을지, 1차에서는 제거할지

이게 정해지지 않으면 대시보드는 계속 “보기 좋은 종합 카드 모음”으로 남는다.

## 10. 현재 기준 추천 방향

가장 현실적인 방향은 이렇다.

1. member 공통 대시보드를 먼저 만든다.
2. admin 전용 대시보드는 나중에 분리한다.
3. 1차는 mock 기반이더라도 데이터 구조는 실제처럼 설계한다.
4. 공지, 일정, 프로젝트, 할 일 4개 축만 먼저 완성한다.
5. KPI와 최근 자료는 2차로 미룬다.

## 11. 지금 문서화된 범위

현재까지 기록된 내용은 아래 수준이다.

- 레포 전체 개선 포인트 기록 완료
- member 영역 문제 기록 완료
- 대시보드가 아직 목업이라는 판단 근거 기록 완료
- 대시보드 개발 방향과 MVP 초안 기록 완료

아직 없는 것

- 최종 UI 시안 명세
- 실제 API 스펙
- 권한별 분기 정책 확정안
- 대시보드 구현 착수용 세부 작업 티켓 분해
