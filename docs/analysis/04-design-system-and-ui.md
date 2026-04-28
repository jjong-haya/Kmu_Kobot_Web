# 디자인 시스템과 UI 계층 분석

## 1. 전역 스타일 계층

스타일 진입 순서

1. `src/styles/index.css`
2. `src/styles/fonts.css`
3. `src/styles/tailwind.css`
4. `src/styles/theme.css`

의미

- `fonts.css`: 폰트 슬롯이지만 현재 비어 있음
- `tailwind.css`: Tailwind v4 엔트리와 source 범위 정의
- `theme.css`: 실제 테마 토큰과 base layer 중심

즉, 디자인 시스템의 실질적인 중심은 `theme.css`다.

## 2. 토큰 구조

현재 토큰은 두 층으로 존재한다.

### 실제 사용되는 semantic 토큰

- `--background`
- `--foreground`
- `--primary`
- `--border`
- `--ring`
- `--popover`
- `--sidebar-*`
- `--chart-*`

이 토큰들은 `components/ui`에서 직접 소비된다.

### 사용 비중이 낮은 커스텀 토큰

- `--brand-*`
- `--page-bg`
- `--panel-bg`
- `--card-bg`
- `--text-*`
- `--border-*`
- `--radius-*`
- `--spacing-*`

문제는 두 체계가 나란히 존재하면서, 어떤 토큰이 실제 시스템의 진짜 기준인지 헷갈리게 만든다는 점이다.

## 3. 색상과 테마

라이트 테마는 네이비 브랜드 방향이 분명하다. 하지만 다크 테마는 브랜드 확장이라기보다 shadcn 기본 다크 팔레트에 가깝다.

결과

- 라이트 모드에서의 브랜드 감도는 괜찮다.
- 다크 모드는 브랜드 정체성이 약하다.
- 일부 overlay와 fallback UI는 semantic token 대신 하드코딩 색을 쓴다.

예외 사례

- dialog, sheet, drawer 계열의 overlay
- `ImageWithFallback`

## 4. 타이포그래피

현 상태의 타이포 시스템은 약하다.

- `fonts.css`가 비어 있다.
- `font-family` 전략이 사실상 없다.
- 크기와 굵기는 일부 지정되어 있지만, 프로젝트 전용 폰트 체계는 보이지 않는다.

즉, 색상 체계에 비해 타이포 체계는 아직 비어 있는 상태다.

## 5. UI 컴포넌트 계층

`src/app/components/ui`는 전형적인 shadcn/Radix 래퍼 구조다.

특징

- 파일 하나가 primitive 하나를 감싼다.
- `cn()` 유틸을 통해 클래스 병합을 표준화한다.
- `data-slot`, `asChild`, `cva`, `data-[state=...]` 패턴이 반복된다.

강점

- 재사용성과 일관성이 좋다.
- 새로운 primitive를 추가하기 쉽다.
- 접근성 기본기가 Radix 덕분에 확보된다.

## 6. 특이점과 예외

### 큰 서브시스템

- `form.tsx`: `react-hook-form`와 접근성 연결 담당
- `sidebar.tsx`: 상대적으로 큰 복합 컴포넌트
- `chart.tsx`: CSS variable 기반 chart 레이어

### 시스템 밖 예외

- `src/app/components/figma/ImageWithFallback.tsx`

이 파일은 나머지 UI 시스템과 톤이 다르다.

- `cn` 패턴을 거의 쓰지 않는다.
- semantic token보다 직접 class를 사용한다.
- 이미지 로드 실패 시 대체 `alt` 처리도 접근성 관점에서 좋지 않다.

## 7. 접근성과 반응형

### 장점

- Radix 기반으로 키보드와 포커스 관리가 안정적이다.
- 일부 컴포넌트는 `aria-*`, `sr-only`를 잘 사용한다.
- 모바일 대응은 최소 수준 이상 갖추고 있다.

### 리스크

- 일부 터치 타깃이 44px 권장치보다 작다.
- table, tabs 등은 모바일에서 재배치보다 가로 스크롤 의존이 크다.
- 세로 방향 carousel에 좌우 키만 연결되는 등 세부 a11y 예외가 있다.
- `sidebar.tsx`는 토큰 함수 형식 불일치로 시각 결함 가능성이 있다.

## 8. 디자인 시스템 총평

이 프로젝트는 디자인 시스템 문서보다 코드가 더 앞서 있다. 즉, `theme.css + components/ui`가 이미 시스템 역할을 하고 있지만, 명시적 규칙과 토큰 정리가 부족해서 확장 단계에서 혼선이 생길 가능성이 높다.

우선 정리 대상

1. semantic 토큰과 커스텀 토큰의 역할 구분
2. 폰트 전략 수립
3. 하드코딩 색상 예외 제거
4. 공통 카드와 shell 컴포넌트 추출
5. a11y 예외와 mobile hit target 보강
