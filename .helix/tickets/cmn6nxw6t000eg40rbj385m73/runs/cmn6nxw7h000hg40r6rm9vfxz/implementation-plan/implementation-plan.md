# Implementation Plan: PX Logo on Login Page

## Overview

Add a PX (Project X) logo above the Clerk `<SignIn>` form on the login page. This requires two changes: (1) create a new SVG logo asset, and (2) modify the sign-in page component to render the logo above the sign-in form. No shared layouts, dependencies, or other pages are affected.

## Implementation Principles

- **Minimal change**: Two files total — one new SVG, one modified page component.
- **Pattern consistency**: Use the established `next/image` + static import pattern from `Sponsors.tsx`.
- **Scoped impact**: Modify only the sign-in page; the shared center layout and sign-up page remain untouched.
- **Convention compliance**: Named exports (except the default page export), absolute `@/` imports, Tailwind v4 utility classes.

## Implementation Steps Summary

| Step | Goal | Deliverable |
|------|------|-------------|
| 1 | Create PX logo SVG asset | `public/assets/images/px-logo.svg` |
| 2 | Add logo to sign-in page | Modified `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` |
| 3 | Run quality gates | Passing lint, typecheck, deps, i18n, unit tests |

## Detailed Implementation Steps

### Step 1: Create PX Logo SVG Asset

**Goal**: Add a simple, professional PX logo SVG file to the public assets directory.

**What to Build**:
- Create `public/assets/images/px-logo.svg` — a simple text-based SVG with "PX" lettering.
- Use a clean sans-serif font weight (bold), solid dark fill color (e.g., `#1a1a2e` or similar dark neutral), appropriate viewBox for a horizontally-oriented logo.
- Keep it simple: SVG `<text>` or `<path>` based. Approximate intrinsic width ~120-150px logical, with a viewBox defining the aspect ratio.
- Follow the naming convention of existing assets (lowercase, hyphenated): `px-logo.svg`.

**Verification (AI Agent Runs)**:
- `ls public/assets/images/px-logo.svg` — file exists.
- Confirm the SVG is well-formed XML with a `viewBox` attribute.

**Success Criteria**:
- File exists at `public/assets/images/px-logo.svg`.
- File is a valid SVG with proper viewBox and visible "PX" content.
- File size is small (under 5KB).

---

### Step 2: Add Logo to Sign-In Page

**Goal**: Render the PX logo above the Clerk `<SignIn>` component on the sign-in page.

**What to Build**:
- Modify `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`.
- Add a static import for the new SVG: `import pxLogo from '@/public/assets/images/px-logo.svg';`
- Add an import for `Image` from `next/image`.
- Wrap the return value in a `<div>` with `className="flex flex-col items-center"` to stack the logo above the sign-in form.
- Render `<Image src={pxLogo} alt="Project X" width={150} height={...appropriate...} className="mb-8" />` above the existing `<SignIn>` component.
- The `alt` attribute should be `"Project X"` (brand name, not translated — consistent with how `Sponsors.tsx` handles logo alt text).
- Do NOT modify the shared center layout (`(center)/layout.tsx`), auth layout, or the sign-up page.
- The existing `generateMetadata` function and page props remain unchanged.

**Verification (AI Agent Runs)**:
- `bun run check:types` — no type errors.
- `bun run lint` — no lint errors.
- `bun run check:deps` — no unused dependency issues.
- `bun run check:i18n` — no i18n violations.

**Success Criteria**:
- The sign-in page imports and renders the PX logo above the `<SignIn>` component.
- The sign-up page file is completely unchanged.
- The center layout file is completely unchanged.
- All quality gates pass.

---

### Step 3: Run Quality Gates

**Goal**: Verify all existing quality gates pass after the changes.

**What to Build**: Nothing — this is a verification-only step.

**Verification (AI Agent Runs)**:
- `bun run check:types` — exits 0.
- `bun run lint` — exits 0.
- `bun run check:deps` — exits 0.
- `bun run check:i18n` — exits 0.
- `bun run test` — exits 0.

**Success Criteria**:
- All five quality gate commands exit with code 0.
- No regressions in existing tests.

---

## Verification Plan

### Pre-conditions

| # | Dependency | Status | Source/Evidence | Affects checks |
|---|-----------|--------|-----------------|----------------|
| 1 | Node.js >= 20, bun runtime | available | `package.json` engines field; sandbox environment | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05, CHK-06 |
| 2 | npm/bun dependencies installed | available | Run `bun install` before checks | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05, CHK-06 |
| 3 | Clerk environment variables for dev server | unknown | `.env.local` may or may not be configured; Clerk keys needed for `<SignIn>` to render | CHK-06 |
| 4 | Playwright browsers installed | unknown | Required for e2e and browser verification | CHK-06 |
| 5 | Dev server can start (`bun run dev:next`) | unknown | Requires Clerk env vars and database setup | CHK-06 |

### Required Checks

**[CHK-01]** TypeScript type check passes.
- **Action:** Run `bun run check:types` from the repository root.
- **Expected Outcome:** Command exits with code 0 and no type errors reported.
- **Required Evidence:** Full command output showing successful completion with exit code 0.

**[CHK-02]** Lint check passes.
- **Action:** Run `bun run lint` from the repository root.
- **Expected Outcome:** Command exits with code 0 and no lint errors reported.
- **Required Evidence:** Full command output showing successful completion with exit code 0.

**[CHK-03]** Dependency check passes.
- **Action:** Run `bun run check:deps` from the repository root.
- **Expected Outcome:** Command exits with code 0 with no unused dependencies or imports flagged.
- **Required Evidence:** Full command output showing successful completion with exit code 0.

**[CHK-04]** i18n check passes.
- **Action:** Run `bun run check:i18n` from the repository root.
- **Expected Outcome:** Command exits with code 0 with no i18n violations. The static `alt="Project X"` on the logo image is acceptable (brand name, not user-facing text, consistent with `Sponsors.tsx` alt text pattern).
- **Required Evidence:** Full command output showing successful completion with exit code 0.

**[CHK-05]** Unit tests pass.
- **Action:** Run `bun run test` from the repository root.
- **Expected Outcome:** Command exits with code 0 with all existing tests passing and no regressions.
- **Required Evidence:** Full command output showing test results and exit code 0.

**[CHK-06]** Browser verification — PX logo visible on sign-in page.
- **Action:** Start the dev server (`bun run dev:next`), open the sign-in page at `http://localhost:3000/sign-in` in the browser, and visually verify the page.
- **Expected Outcome:** The PX logo is visible above the Clerk sign-in form. The logo shows "PX" text/branding. The Clerk sign-in form (with "Email address" field) renders below the logo. The page layout is vertically centered.
- **Required Evidence:** Browser screenshot of the sign-in page showing the PX logo above the Clerk sign-in form.

## Success Metrics

1. A PX logo SVG file exists at `public/assets/images/px-logo.svg`.
2. The sign-in page renders the PX logo above the Clerk `<SignIn>` component.
3. The sign-up page (`sign-up/[[...sign-up]]/page.tsx`) is completely unchanged.
4. The shared center layout (`(center)/layout.tsx`) is completely unchanged.
5. All quality gates pass: typecheck, lint, deps, i18n, unit tests.
6. Total files changed: 1 new file (SVG), 1 modified file (sign-in page).

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Primary ticket definition | Requests "PX Logo on login page"; org is Project-X-Innovation |
| `scout/reference-map.json` | File inventory and unknowns | No PX logo exists; identified sign-in page, layouts, image patterns |
| `scout/scout-summary.md` | Codebase analysis | Layout hierarchy, quality gates, Clerk config, existing image patterns |
| `diagnosis/diagnosis-statement.md` | Root cause and success criteria | Missing feature: need SVG asset + page modification; sign-in page only |
| `diagnosis/apl.json` | Diagnosis decisions | Page-level placement, SVG format, next/image pattern confirmed |
| `product/product.md` | Product scope and constraints | Login page only; no sign-up; no design spec; shared layout caution |
| `tech-research/tech-research.md` | Architecture decision and technical details | Option A chosen (page-level next/image); flex-col wrapper pattern; SVG ~120-150px width |
| `tech-research/apl.json` | Technical answers | Confirmed static import pattern, no CSS layer conflicts, no new dependencies |
| `repo-guidance.json` | Repo intent | Single target repo: next-js-boilerplate |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Current sign-in page source | Returns only `<SignIn>` with no wrapper or logo; needs flex-col container added |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Center layout source | Provides `flex min-h-screen items-center justify-center`; must not be modified |
| `src/components/Sponsors.tsx` | Logo rendering pattern | Static SVG imports + `next/image` with `width` prop is the established pattern |
| `tests/e2e/I18n.e2e.ts` | E2E test covering sign-in | Checks for "Email address" text; adding logo above form does not break this |
| `AGENTS.md` | Coding conventions | Named exports, `@/` imports, Tailwind v4, conventional commits |
