# Design Renewal — Conventions

마지막 갱신: 2026-05-10

본 문서는 멤버 워크스페이스 디자인 리뉴얼이 끝날 때까지 모든 페이지 작업이 따라야 할 규칙이다. 어기면 회귀로 본다.

## 핵심 원칙

1. **추측 금지.** 새 패턴 만들기 전에 grep, 기존 토큰/primitive 먼저.
2. **결정마다 why 한 줄.** "예쁘게 만들었다" 자평 금지.
3. **일관성 > 개성.** 페이지마다 다른 버튼·다른 모달 = 즉시 fail.
4. **shadcn primitive 위에서.** `src/app/components/ui/*` 의 47개 primitive를 베이스로.
5. **토큰만.** hex/`rgba()`/magic z-index/임의 transition은 즉시 제거.

## 페이지 6단계 playbook

페이지를 새로 만들거나 리디자인할 때마다:

```
1. before 스크린샷 + 현재 문제 리스트
2. 정보 위계 재설계 — 가장 중요한 것이 가장 크고 위
3. 모바일 우선 → 데스크탑 확장
4. empty / loading / error 세 상태 모두 디자인
5. 페이지에서 트리거되는 모달·토스트·드로어 같이 다듬기
6. 옆 페이지 진입/이탈 동선 점검
```

페이지 PR 설명에 6단계 체크리스트를 그대로 붙여 어떤 항목을 충족했는지 표시한다.

## 페이지 구조 템플릿

```tsx
import { PageHeader, FilterBar, EmptyState, ErrorFallback, ListSkeleton } from "@/app/components/primitives";

const PAGE_STYLE = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-surface-page)",
};

export default function MyPage() {
  // ... data hooks ...

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6">
        <PageHeader
          eyebrow="Section"
          title="페이지 제목"
          description="한 줄 요약"
          actions={<>{/* 우측 버튼 */}</>}
        />

        {/* 필터가 있으면 */}
        <FilterBar search={...} start={...} end={...} />

        {/* error → ErrorFallback, loading → ListSkeleton, empty → EmptyState, 정상 → 본문 */}
        <div className="kb-fade-up">{renderBody()}</div>
      </div>
    </div>
  );
}
```

## 색상

| 의도 | 사용 토큰 |
| --- | --- |
| 버튼 primary background | `var(--kb-ink-900)` (호버 `--kb-navy-900`) |
| 텍스트 primary | `var(--kb-ink-900)` |
| 텍스트 secondary | `var(--kb-ink-500)` |
| 표면 (card) | `var(--kb-surface-raised)` |
| 표면 (sidebar/inset) | `var(--kb-surface-sunken)` |
| 1px hairline | `var(--kb-border-subtle)` |
| 강조 outline focus | `var(--kb-navy-500)` |
| 액센트 영역 (callout) | `var(--kb-navy-50)` 배경 + `--kb-navy-700` 텍스트 |

상태 색은 항상 `StatusPill` 또는 `--kb-success/warning/danger/info-*` 토큰. 인라인 hex 금지.

## 타이포그래피

| 슬롯 | 클래스 / 크기 |
| --- | --- |
| 페이지 h1 | `kb-display`, 26~36px, `font-semibold tracking-tight` |
| section h2 | `kb-display`, 18~22px, `font-semibold` |
| body | 14~15px, `leading-6 ~ leading-7` |
| metadata | 12~13px, `font-medium` |
| eyebrow | `kb-mono`, 10.5px, `uppercase tracking-[0.12em ~ 0.16em]` |
| 큰 숫자 (stat) | `kb-display`, 24~34px, `font-semibold leading-none` |

`font-black` 대신 `font-semibold` + `tracking-tight`. 본 프로젝트는 무거운 weight 대신 위계로 인지를 만든다.

## 인터랙션 / 모션

- 호버: `--kb-duration-normal` (200ms) 색·테두리만. transform 사용은 카드 lift 같이 정해진 곳만.
- 페이지 진입: `kb-fade-up` (700ms 내부 keyframe) 한 번만, body 컨테이너에.
- 카드 호버 lift: `hover:-translate-y-0.5 + hover:shadow-[var(--kb-shadow-md)]`.
- focus-visible: 모든 인터랙티브 요소에 `focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]`.

## 모달 / 오버레이

| 종류 | 용도 | 컴포넌트 |
| --- | --- | --- |
| 컨펌 (작음) | 삭제·아카이브·전송 등 단발 액션 | `ConfirmActionDialog` |
| 입력 (중간) | 새 항목 만들기·편집 | shadcn `Dialog` 직접 |
| 콘텐츠 (큰 화면) | 상세 보기·복합 워크플로우 | shadcn `Sheet` (drawer) |

ESC 종료, 외부 클릭 종료, 포커스 트랩은 shadcn 기본 동작에 의존 — 직접 구현 금지.

## 토스트

`sonner`의 `toast()` 4종만:
- `toast.success("저장됐어요.")`
- `toast.error("저장 실패. 잠시 후 다시 시도해 주세요.")`
- `toast.info(...)`
- `toast.warning(...)`

위치/duration 커스터마이즈는 글로벌 1회만. 페이지에서 `toast()` 옵션 인자 직접 넘기면 회귀로 본다.

## 빈 상태

`EmptyState` 4슬롯 고정. 자체 빈 화면 그리지 말 것.

```tsx
<EmptyState
  icon={ClipboardList}
  title="표시할 행사가 없습니다"
  description="새 행사를 만들거나 다른 상태 필터를 선택해 보세요."
  action={<Link to="/member/events/new">새 행사 만들기</Link>}
/>
```

## 권한 거부 / 미승인 화면

`RequirePermission`, `RequireActiveMember` fallback 은 항상 `EmptyState` + 명확한 안내. 빈 화면 금지.

## 모바일

- Tailwind 기본 sm/md/lg/xl 그대로.
- 페이지 `max-w-[1180px]` 또는 `max-w-[1240px]` 컨테이너 + `mx-auto`.
- 헤더 actions: 작은 화면에서 라벨 숨기고 아이콘만 (예: 새로고침은 `<span className="hidden sm:inline">새로고침</span>`).

## 접근성

- 인터랙티브 요소는 모두 키보드 접근 가능 + visible focus ring.
- icon-only 버튼은 `aria-label`.
- decorative icon은 `aria-hidden`.
- `role="radiogroup"` / `role="radio"` 등 의미 있는 role 사용.

## 안티패턴 (즉시 fail)

- 페이지에 직접 `<h1>` 작성 (PageHeader 미사용)
- hex 색상 인라인 (`bg-[#103078]`)
- `font-black` 남발 (디자인이 무거워짐)
- 카드 남발 — 단순 텍스트 그룹은 여백·구분선·타이포로
- 페이지마다 다른 모달 컴포넌트
- 자체 EmptyState/ErrorFallback 인라인
- magic z-index (`z-[9999]`)
- `transition-all` (성능 + 일관성 양쪽 다 깨짐)
