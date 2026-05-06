# UX/UI Design Review — KOOBOT

Scope: visual consistency, IA, empty/loading/error states, mobile, interaction quality, Korean-specific UX. Accessibility is excluded (separate agent).

## Top 5 UX Problems

### 1. Member sidebar is overgrown and only collapses on `md+` breakpoint
**Where:** `src/app/layouts/MemberLayout.tsx` (1020 lines, ~28 `href:` entries split into role-gated sections like `부원 / 운영 / 어드민`). `src/app/components/member/MemberShell.tsx` is a thin 73-line wrapper — the real shell is `MemberLayout`.
**Problem:** ~28 nav items in one rail with role-gated sections. Sidebar uses `md:w-72`/`md:w-16` and a `md:hidden` hamburger; below 768px the sidebar becomes a fixed-position sheet (lines 843+) that is hand-rolled, not the existing `vaul` `Drawer` primitive. Tablet width (768–1024) shows the full 28-item rail with no density tuning.
**Impact:** Cognitive overload for new members; tablet users see desktop density.
**Fix direction:** Group nav into 3–4 collapsibles, hide admin section behind a switcher, swap the custom mobile sheet for `components/ui/drawer.tsx` (`vaul`).

### 2. `next-themes` is installed but not actually wired
**Where:** Only `src/app/components/ui/sonner.tsx` calls `useTheme()`. There is no `<ThemeProvider>` mount, no theme-toggle UI anywhere in `MemberLayout` or `PublicHeader`. Dark-mode `dark:` classes exist on shadcn primitives, but the `dark` class is never set on `<html>`.
**Impact:** Dark mode is dead code. Sonner toasts will mis-theme any user whose OS prefers dark because the surrounding app stays light. Doc `04-design-system-and-ui.md` already calls dark mode "브랜드 정체성이 약하다."
**Fix direction:** Either wire `<ThemeProvider attribute="class">` in `App.tsx` and add a toggle in MemberLayout topbar, or remove `next-themes` and the `dark:` variants to stop signalling a feature that doesn't exist.

### 3. Public landing/header doesn't tell first-time visitors what KOOBOT is
**Where:** `src/app/components/public/PublicHeader.tsx` ships only a logo + 4 nav links (활동/프로젝트/공지/모집), no tagline, no login CTA. `Landing.tsx` is 1803 lines but the header itself fails the "what is this?" test in 5 seconds.
**Impact:** Public arrivals (e.g., recruiting funnel) don't see "Kookmin University Robotics Club" nor a sign-in path until they scroll. Inline `style={{}}` props (`borderBottom: "1px solid var(--kb-hairline)"`) bypass the design system entirely.
**Fix direction:** Add a one-line subtitle in the header ("국민대학교 로봇동아리"), a visible "로그인" button, and replace inline styles with Tailwind tokens.

### 4. Empty/loading states are inconsistent and mostly bare strings
**Where:** Empty handling is ad-hoc Korean strings (`검색 결과가 없습니다`, `아직 등록된 공지가 없습니다`, `프로젝트 소개가 아직 없습니다.`) scattered across `Notice.tsx`, `MobileNotice.tsx`, `TagDetail.tsx`, `StudyLog.tsx`. No shared `EmptyState` component. `Skeleton` exists in `components/ui/skeleton.tsx` but is referenced only by `sidebar.tsx` itself — no list page (`Members`, `Notice`, `Dashboard`, `TagDetail`) renders skeletons during fetch. Errors throw to the boundary instead of inline.
**Impact:** Pages flash blank → pop content; failures are silent or jarring; tone of empty messages is uneven (some end with period, some don't, no illustrations or CTAs).
**Fix direction:** Build one `EmptyState` (icon + title + helper + optional CTA), one `ListSkeleton` pattern, apply to Members/Notice/Tags/Notifications.

### 5. Forms ignore the bundled `react-hook-form` infrastructure
**Where:** `src/app/components/ui/form.tsx` provides the full `Form*` primitives, but **no page actually imports `useForm` or `zodResolver`** — the only file using them is `form.tsx` itself. Pages like `ProfileSettings.tsx`, `Admin.tsx`, `Recruit.tsx`, `Contact.tsx` use raw `useState` + manual submit handlers; success uses `toast.success("...되었습니다")` but field-level validation is absent.
**Impact:** No inline error messaging, no `aria-invalid`, no required-field affordances. Toasts after the fact instead of "fix this field" feedback. `toast.error` is used in only ~1 place (`ProfileSettings.tsx:628`).
**Fix direction:** Migrate at least the high-traffic forms (Recruit, Contact, ProfileSettings) to `Form` + zod schemas. Standardize error toast on every API failure.

## Bonus findings

- **Korean date formatting:** `date-fns` is in `package.json` but **zero `from "date-fns"` imports** in `src`. Dates are likely raw ISO strings or `toLocaleDateString` — Korean locale (`date-fns/locale/ko` with `formatDistanceToNow`) is unused.
- **Tag system live preview:** logic lives in `TagDetail.tsx`/`Tags.tsx` and uses inline `style={{ color: empty ? "var(--kb-ink-400)" : "var(--kb-ink-900)" }}` — references the legacy `--kb-*` token system that doc `04-...md` already flagged as parallel to the canonical semantic tokens. Two token systems = drift.
- **Admin pages** (`Admin.tsx`, `MemberAdmin.tsx`, `ProjectAdmin.tsx`) live inside the same `MemberLayout` with no visual differentiation (no banner, no "관리자" badge, no separate color accent). Easy for a president-role user to confuse member view with admin view.
- **Dialogs:** Page code uses Radix `DialogContent` / `AlertDialog` from shadcn — Esc/focus return is handled by Radix automatically. No issues found here.

## Design System Adoption Score: **6 / 10**

Justification: shadcn/Radix primitive set is comprehensive (~50 files in `components/ui/`) and well-built, but adoption is uneven. Pluses: `Button`, `Card`, `Dialog`, `DropdownMenu`, `Sonner Toaster` are imported broadly. Minuses: (1) `Form` + `react-hook-form` is unused outside its own file, (2) two parallel token systems (`--background/--foreground/--sidebar-*` semantic vs `--kb-*` / `--brand-*` legacy) per `docs/04`, (3) heavy inline `style={{}}` in `PublicHeader`, `Tags`, `Landing`, (4) `Skeleton` orphaned, (5) `vaul` `Drawer` primitive built but not used by the actual mobile sidebar, (6) typography slot is empty.

## Mobile Readiness Verdict: **Partial / desktop-first**

`useIsMobile` exists in two places (`hooks/useIsMobile.ts` and `components/ui/use-mobile.ts`) but only `Notice.tsx` and the shadcn sidebar internals use it. `MemberLayout` does responsive work via Tailwind `md:` only — fine on phones, but the mobile sheet is hand-rolled, ignoring `vaul`. Public pages have explicit `MobileLanding.tsx`/`MobileNotice.tsx` (parallel mobile components rather than responsive design) — duplication risk. Verdict: works on phones, not delightful, and tablet (768–1024) is the weakest tier.

## Quick Wins

1. **Mount `ThemeProvider`** in `App.tsx` (`attribute="class"`, `defaultTheme="system"`) and add a toggle next to the user dropdown in `MemberLayout` — already wired into Sonner; ~10 LOC.
2. **Create `EmptyState` + `ListSkeleton`** components in `components/ui/` and replace the 6+ duplicated `<p className="text-gray-500">검색 결과가 없습니다</p>` instances.
3. **Add a tagline + login button** to `PublicHeader` (delete the inline `style` props at the same time).
4. **Replace `MemberLayout` mobile sheet (lines 843+) with `Drawer` from `components/ui/drawer.tsx`** — already imported elsewhere, removes ~50 lines of custom slide logic.
5. **Standardize toast on API failures**: add `toast.error(sanitizeUserError(err, FALLBACK))` in the catch blocks of `Admin.tsx`, `Recruit.tsx`, `Contact.tsx`, `Attendance.tsx` (currently silent on error).
