# Design Tokens — Single Source of Truth

마지막 갱신: 2026-05-10

모든 색·여백·모션·z-index 결정은 [`src/styles/design-tokens.css`](../../../src/styles/design-tokens.css) 의 CSS 변수만 사용한다. 페이지·컴포넌트에서 hex 코드, `rgba()` 직접값, magic 숫자 z-index, 임의 transition duration을 도입하면 즉시 회귀로 본다.

## Naming convention

- prefix: `--kb-*`
- scale 토큰은 단계 번호로 표기 (`--kb-navy-500`, `--kb-space-4`, `--kb-radius-md`)
- semantic alias는 의미 기반 (`--kb-text-primary`, `--kb-surface-raised`, `--kb-accent`)
- 페이지 코드는 가능하면 **semantic alias** 를 쓰고, 라벨/스테이터스 같이 의미가 명확한 곳에서만 raw 토큰을 쓴다.

## Color tokens

### Brand & accent
| token | role | light value |
| --- | --- | --- |
| `--kb-navy-500` | Primary brand accent (links, focus ring base) | `#3b6bc4` |
| `--kb-navy-700` | Strong accent on text + icons | `#1c3f8a` |
| `--kb-navy-900` | Primary action background, deep hover | `#082058` |
| `--kb-navy-50` / `--kb-navy-100` | Soft accent surfaces (callouts) | `#f4f7fc` / `#e8eef9` |
| `--kb-accent` | Semantic alias → `--kb-navy-500` | |
| `--kb-accent-strong` | Semantic alias → `--kb-navy-700` | |
| `--kb-on-accent` | Foreground on `--kb-ink-900` / accent buttons | `#ffffff` |

### Surfaces (warm neutral)
| token | role |
| --- | --- |
| `--kb-paper` / `--kb-surface-raised` | Card, dialog, page background (default) |
| `--kb-paper-2` / `--kb-surface-sunken` | Inset surface (filter bars, sidebars) |
| `--kb-paper-3` / `--kb-surface-muted` | Quiet chip backgrounds |
| `--kb-hairline` / `--kb-border-subtle` | Default 1px border between surfaces |
| `--kb-hairline-2` / `--kb-border-strong` | Stronger separator (panel boundaries) |

### Ink (text)
| token | role |
| --- | --- |
| `--kb-ink-900` / `--kb-text-primary` | Headings, primary copy |
| `--kb-ink-700` | Body copy on light surface |
| `--kb-ink-500` / `--kb-text-secondary` | Captions, metadata |
| `--kb-ink-400` / `--kb-text-muted` | Hint text, disabled labels |
| `--kb-ink-300` | Hairline-level disabled icons |

### Status (semantic)
Status 컬러는 `StatusPill` primitive를 통해 사용한다. raw 토큰 직접 사용은 토스트·alert 등 한정.
| group | tones |
| --- | --- |
| success | `--kb-success-50/500/700` |
| warning | `--kb-warning-50/500/700` |
| danger | `--kb-danger-50/500/700` |
| info | `--kb-info-50/500/700` |

## Typography

| stack | use | source |
| --- | --- | --- |
| `--kb-font-display` | h1·h2·통계 숫자 | Nunito |
| `--kb-font-body` (default) | 본문, 버튼 | Pretendard |
| `--kb-font-mono` | 짧은 라벨, eyebrow, 숫자 픽셀 카운터 | JetBrains Mono |
| `--kb-font-serif` | 강조용 (비상시) | Instrument Serif |

Utility 클래스: `.kb-display`, `.kb-mono`, `.kb-serif`.

## Spacing scale

`--kb-space-1` (4px) ~ `--kb-space-16` (64px). Tailwind spacing(`p-4` 등)을 우선 쓰고, 인라인 style이 필요할 때만 `--kb-space-*` 토큰을 쓴다.

## Radius

| token | px | use |
| --- | --- | --- |
| `--kb-radius-xs` | 4 | tag 칩 |
| `--kb-radius-sm` | 6 | 버튼, input, 작은 카드 |
| `--kb-radius-md` | 10 | 카드, 다이얼로그, 섹션 |
| `--kb-radius-lg` | 14 | 페이지 레벨 카드 |
| `--kb-radius-xl` | 20 | 메인 hero/landing |
| `--kb-radius-full` | 999 | pill, 아바타 |

## Shadow

| token | use |
| --- | --- |
| `--kb-shadow-sm` | 카드 기본 |
| `--kb-shadow-md` | hover, 강조 |
| `--kb-shadow-lg` | popover, dropdown, dialog |
| `--kb-shadow-focus` | focus-visible 링 |

## Motion

| token | duration | use |
| --- | --- | --- |
| `--kb-duration-fast` | 120ms | hover transitions |
| `--kb-duration-normal` | 200ms | 색·테두리 전환 (default) |
| `--kb-duration-slow` | 320ms | flip card, 진행률 |
| `--kb-duration-deliberate` | 480ms | 페이지 fade-in |

| easing | curve | use |
| --- | --- | --- |
| `--kb-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 기본 |
| `--kb-ease-emphasis` | `cubic-bezier(0.16, 1, 0.3, 1)` | 강조 진입 (kb-fade-up도 이걸 사용) |
| `--kb-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | 종료 |

기존 utility class도 그대로 쓸 수 있다: `.kb-fade-up`, `kb-tab-in` keyframe.

## Z-index layers

| token | value |
| --- | --- |
| `--kb-z-base` | 0 |
| `--kb-z-sticky` | 100 |
| `--kb-z-overlay` | 900 |
| `--kb-z-dialog` | 1000 |
| `--kb-z-popover` | 1100 |
| `--kb-z-toast` | 1200 |
| `--kb-z-tooltip` | 1300 |

## Breakpoints

`--kb-bp-sm/md/lg/xl/2xl` 토큰은 reference 용. enforcement는 Tailwind 기본(`sm:` 640 / `md:` 768 / `lg:` 1024 / `xl:` 1280 / `2xl:` 1536)을 따른다.

## Dark theme

`[data-theme="dark"]` 셀렉터에서 `--kb-paper`, `--kb-ink-*`, `--kb-surface-*`, `--kb-accent` 가 dark variant로 override 된다. 토큰만 준비된 상태이며 실제 토글 위치는 Phase 5에서 확정한다.

## Adding a new token

1. 같은 의미의 토큰이 이미 있는지 grep
2. 없으면 `design-tokens.css` 의 의미에 맞는 그룹에 추가 (Brand → 색, Surface → 표면, Motion → 시간 등)
3. 본 문서에 표 갱신
4. 페이지에서 hex/magic number를 토큰으로 교체하는 마이그레이션 PR 분리
