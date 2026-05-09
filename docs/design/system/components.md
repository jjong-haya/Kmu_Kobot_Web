# Component System — Catalog

마지막 갱신: 2026-05-10

본 문서는 페이지가 사용해야 할 공용 컴포넌트의 단일 카탈로그다. 페이지에서 새 패턴을 짤 때는 항상 여기서 먼저 찾고, 없을 때만 신설한 뒤 카탈로그를 갱신한다.

## 배럴

```ts
import {
  EmptyState,
  PageHeader,
  FilterBar,
  ListSkeleton,
  ListGrid,
  ViewToggle,
  StatusPill,
  ErrorBoundary,
  ErrorFallback,
} from "@/app/components/primitives";
```

## 카탈로그

### `PageHeader`
파일: [`src/app/components/primitives/PageHeader.tsx`](../../../src/app/components/primitives/PageHeader.tsx)

페이지 최상단의 단일 헤더. 모든 멤버/퍼블릭 페이지가 이걸로 시작해야 한다.

| prop | 의도 |
| --- | --- |
| `eyebrow` | 작은 카테고리 라벨 (선택, 모노 폰트) |
| `title` | 가장 큰 타이포 — 한 페이지 한 개 (필수) |
| `description` | 1줄 요약 (선택) |
| `actions` | 우측 정렬 버튼 슬롯 (선택) |
| `bordered` | 하단 hairline 표시 (기본 true) |

규칙: 페이지 안에서 `<h1>` 인라인 작성 금지. 항상 `PageHeader`.

### `FilterBar`
파일: [`src/app/components/primitives/FilterBar.tsx`](../../../src/app/components/primitives/FilterBar.tsx)

목록·검색 페이지 공통 필터 바. 검색 input, 필터 칩(start), 우측 컨트롤(end) 3슬롯.

| prop | 의도 |
| --- | --- |
| `search` | `{ value, onChange, placeholder?, "aria-label"? }` — 없으면 검색창 숨김 |
| `start` | 좌측 (segmented control, 상태 칩) |
| `end` | 우측 (`ViewToggle`, sort dropdown 등) |

빈 FilterBar 렌더링 금지 — 필터가 없는 페이지면 아예 표시하지 않는다.

### `ViewToggle<TValue>`
파일: [`src/app/components/primitives/ViewToggle.tsx`](../../../src/app/components/primitives/ViewToggle.tsx)

같은 데이터의 두 projection 사이를 switch (예: 카드 vs 리스트). 라벨은 모바일에서 자동 숨김.

```tsx
<ViewToggle<"card" | "list">
  value={viewMode}
  onChange={(next) => setViewMode(next)}
  options={[
    { value: "card", label: "카드", icon: LayoutGrid },
    { value: "list", label: "목록", icon: List },
  ]}
  aria-label="행사 보기 방식"
/>
```

### `ListGrid`
파일: [`src/app/components/primitives/ListGrid.tsx`](../../../src/app/components/primitives/ListGrid.tsx)

`viewMode === "card"` 면 grid, `"list"` 면 hairline divider rows. 페이지는 자체 카드 컴포넌트를 children으로 넘긴다.

### `EmptyState`
파일: [`src/app/components/primitives/EmptyState.tsx`](../../../src/app/components/primitives/EmptyState.tsx)

4슬롯 고정 (icon · title · description · action). `size="sm"` 은 인라인용, `"md"` 가 기본 (전체 화면).

에러 상태는 EmptyState로 만들지 말 것 — `ErrorFallback` 사용.

### `ListSkeleton`
파일: [`src/app/components/primitives/ListSkeleton.tsx`](../../../src/app/components/primitives/ListSkeleton.tsx)

`variant="card" | "list"` + `count` 만 지정. shadcn `Skeleton` 위에서 동작하므로 shimmer 톤은 자동 일관.

### `ErrorBoundary` / `ErrorFallback`
파일: [`src/app/components/primitives/ErrorBoundary.tsx`](../../../src/app/components/primitives/ErrorBoundary.tsx)

페이지·섹션 단위로 감싸 렌더 에러 잡는다. 기본 fallback 은 `EmptyState` 기반의 "다시 시도" 버튼. 페이지가 자체 retry 로직이 있으면 `fallback={(err, reset) => ...}` 으로 커스텀.

### `StatusPill`
파일: [`src/app/components/primitives/StatusPill.tsx`](../../../src/app/components/primitives/StatusPill.tsx)

상태/카테고리 배지. `tone`: `success | warning | danger | info | accent | neutral`. `dot` 옵션으로 라이브 상태 표시.

색상을 커스텀으로 하드코딩하는 일이 생기면 즉시 멈추고 `StatusPill` 의 새 톤으로 추가하라.

### `ConfirmActionDialog` (기존)
파일: [`src/app/components/ConfirmActionDialog.tsx`](../../../src/app/components/ConfirmActionDialog.tsx)

파괴적/일반 액션 컨펌 모달. `destructive` 플래그로 빨간 톤 활성화, `busy` 로 중복 클릭 방지.

규칙: 인라인 `<AlertDialog>` 작성 금지. 항상 `ConfirmActionDialog` 사용. 새 패턴이 필요하면 본 컴포넌트를 확장한다.

## 새 컴포넌트 추가 가이드

1. 사용처가 **2곳 이상** 일 때만 primitive로 승격 (그 이전엔 페이지 로컬 함수)
2. shadcn primitive (`src/app/components/ui/*`) 위에 wrapping
3. 토큰만 사용 — hex/magic 금지
4. props 4개 이내가 좋음. 필수 prop 1~2개, 나머지는 합리적 default
5. 신규 file 만들고 `primitives/index.ts` barrel에 export 추가
6. 본 문서에 표 한 줄 추가
