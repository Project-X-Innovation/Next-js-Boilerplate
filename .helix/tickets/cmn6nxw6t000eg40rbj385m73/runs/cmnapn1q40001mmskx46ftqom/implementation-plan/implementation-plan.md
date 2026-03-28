# Implementation Plan: PX Logo on Login Page

## Overview

Add a PX (Project X) logo to the sign-in page. This requires two changes: (1) create an SVG logo asset at `public/assets/images/px-logo.svg`, and (2) modify the sign-in page component to render the logo above the Clerk `<SignIn>` component using the established `next/image` static import pattern. No shared layouts, sign-up page, or other pages are affected.

## Implementation Principles

- **Minimal change**: Only two files touched — one new SVG, one modified page component.
- **Pattern consistency**: Follow the existing `next/image` + static import pattern from `Sponsors.tsx`.
- **Scoped impact**: Modify only the sign-in page; shared `(center)/layout.tsx` and `(auth)/layout.tsx` remain untouched.
- **No new dependencies**: All required tools (`next/image`, Tailwind CSS v4) are already in the project.

## Implementation Steps Summary

| Step | Goal | Deliverable |
|------|------|-------------|
| 1 | Create PX logo SVG asset | `public/assets/images/px-logo.svg` |
| 2 | Add logo to sign-in page component | Modified `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` |
| 3 | Run quality gates | All gates pass (lint, typecheck, tests, deps, i18n) |

## Detailed Implementation Steps

### Step 1: Create PX Logo SVG Asset

**Goal**: Add a clean, professional PX logo SVG file to the public assets directory.

**What to Build**:
- Create `public/assets/images/px-logo.svg` — a simple, text-based SVG displaying "PX" in bold lettering.
- The SVG should have a defined `viewBox` for proper scaling (e.g., `viewBox="0 0 120 50"` or similar based on letter proportions).
- Use a solid dark fill color (e.g., `#1a1a2e` or similar dark navy/charcoal) that is visible on the white/light background of the center layout.
- Keep the SVG minimal: `<svg>` with `<text>` or `<path>` elements. No embedded fonts or external references.
- File naming follows existing convention: lowercase, hyphenated (matching `arcjet-dark.svg`, `posthog-logo.svg`, etc.).

**Verification (AI Agent Runs)**:
- `ls public/assets/images/px-logo.svg` — file exists.
- File is valid SVG: starts with `<svg` and contains viewBox attribute.
- File size is reasonable (under 5KB for a text-based logo).

**Success Criteria**:
- `px-logo.svg` exists in `public/assets/images/`.
- SVG renders correctly (displays "PX" text).
- File follows the naming convention of other logo assets in the directory.

### Step 2: Add Logo to Sign-In Page Component

**Goal**: Render the PX logo above the Clerk `<SignIn>` component on the login page.

**What to Build**:
- Modify `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`.
- Add a static import for the logo: `import pxLogo from '@/public/assets/images/px-logo.svg';`
- Add `Image` import from `next/image`.
- Wrap the existing `<SignIn>` return value in a `<div className="flex flex-col items-center">` container.
- Add `<Image src={pxLogo} alt="Project X" width={120} height={50} className="mb-8" />` above `<SignIn>`.
- Width/height values should match the SVG viewBox aspect ratio. Target width ~120px for visual balance with the Clerk card (~400px wide).
- The parent center layout already provides `flex min-h-screen items-center justify-center`, so the page wrapper only needs vertical stacking.
- Follow AGENTS.md conventions: use `@/` absolute import, `next/image` (not a bare `<img>`), Tailwind utility classes for spacing.
- The page's default export and `generateMetadata` function remain unchanged.

**Verification (AI Agent Runs)**:
- `bun run check:types` — passes (no type errors from new import/JSX).
- `bun run lint` — passes (named Image import, proper alt text).
- Inspect the modified file to confirm: (a) static import for pxLogo, (b) Image import from next/image, (c) flex-col wrapper, (d) Image component above SignIn.

**Success Criteria**:
- Sign-in page component renders PX logo above the Clerk sign-in form.
- No changes to `(center)/layout.tsx`, `(auth)/layout.tsx`, sign-up page, or any other file.
- Code follows existing patterns (static import, `next/image`, Tailwind classes).

### Step 3: Run Quality Gates

**Goal**: Confirm all quality gates pass with the changes.

**What to Build**: Nothing — this is a verification-only step.

**Verification (AI Agent Runs)**:
- `bun run lint` — passes.
- `bun run check:types` — passes.
- `bun run check:deps` — passes (knip recognizes the SVG import).
- `bun run check:i18n` — passes (brand alt text is standard practice).
- `bun run test` — passes (unit tests unaffected).

**Success Criteria**:
- All five quality gate commands exit with code 0.

## Verification Plan

### Pre-conditions

| Dependency | Status | Source/Evidence | Affects checks |
|---|---|---|---|
| Node.js + bun runtime | available | Required to run quality gates; assumed present in workspace | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05 |
| Project dependencies installed (`bun install` or `npm install`) | unknown | Dependencies may or may not be installed in the workspace | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05, CHK-06 |
| Dev server (`bun run dev`) running on localhost | unknown | Required for browser-based verification; must be started | CHK-06 |
| Clerk environment variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, etc.) | unknown | Required for the Clerk `<SignIn>` component to render on the dev server; configured in `.env.local` | CHK-06 |
| Database server (pglite-server) for dev mode | unknown | Dev command starts `pglite-server`; may be needed for page render | CHK-06 |

### Required Checks

[CHK-01] Typecheck passes with the new logo import and JSX.
- Action: Run `bun run check:types` from the repository root.
- Expected Outcome: Command exits with code 0, no type errors reported.
- Required Evidence: Full command output showing successful completion with exit code 0.

[CHK-02] Lint passes with the modified sign-in page.
- Action: Run `bun run lint` from the repository root.
- Expected Outcome: Command exits with code 0, no lint errors or warnings.
- Required Evidence: Full command output showing successful completion with exit code 0.

[CHK-03] Dependency check passes with the new SVG import.
- Action: Run `bun run check:deps` from the repository root.
- Expected Outcome: Command exits with code 0, knip does not flag the new SVG import as unused or the Image import as missing.
- Required Evidence: Full command output showing successful completion with exit code 0.

[CHK-04] i18n check passes with brand logo alt text.
- Action: Run `bun run check:i18n` from the repository root.
- Expected Outcome: Command exits with code 0, no new i18n violations from the static alt text on the brand logo.
- Required Evidence: Full command output showing successful completion with exit code 0.

[CHK-05] Unit tests pass.
- Action: Run `bun run test` from the repository root.
- Expected Outcome: Command exits with code 0, all existing unit tests pass.
- Required Evidence: Full command output showing test results and exit code 0.

[CHK-06] PX logo is visible above the Clerk sign-in form on the login page.
- Action: Start the dev server with `bun run dev`, then use agent-browser to navigate to `http://localhost:3000/sign-in`. Take a screenshot of the sign-in page.
- Expected Outcome: The page displays the PX logo image above the Clerk sign-in form. The logo is centered and visually separated from the form by spacing (margin-bottom). The Clerk sign-in form remains fully functional below the logo.
- Required Evidence: Browser screenshot of the `/sign-in` page showing both the PX logo and the Clerk sign-in form rendered together. If the Clerk component requires environment variables that are unavailable, the screenshot must still show the PX logo `<img>` element rendered in the correct position (above where the Clerk form would appear).

[CHK-07] Sign-up page is unaffected.
- Action: Use agent-browser to navigate to `http://localhost:3000/sign-up` (with dev server running from CHK-06).
- Expected Outcome: The sign-up page does not display any PX logo. It renders only the Clerk `<SignUp>` component, identical to its state before these changes.
- Required Evidence: Browser screenshot of the `/sign-up` page showing no PX logo is present.

[CHK-08] SVG logo asset exists and is valid.
- Action: Verify that `public/assets/images/px-logo.svg` exists and inspect its contents.
- Expected Outcome: The file exists, starts with `<svg`, contains a `viewBox` attribute, and renders the text "PX".
- Required Evidence: File contents output showing valid SVG markup.

[CHK-09] Only the expected files are changed.
- Action: Run `git diff --name-only` (or equivalent) to list all modified/added files.
- Expected Outcome: Exactly two files are affected: (1) `public/assets/images/px-logo.svg` (new), and (2) `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` (modified). No other files are changed.
- Required Evidence: Git diff output showing only the two expected files.

## Success Metrics

1. PX logo SVG asset exists at `public/assets/images/px-logo.svg`.
2. Sign-in page displays the PX logo above the Clerk sign-in form.
3. Sign-up page and all other pages are unaffected.
4. All quality gates pass: lint, typecheck, unit tests, dep check, i18n check.
5. Only two files are changed (one new, one modified).

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|---|---|---|
| `ticket.md` | Primary ticket definition | Ticket requests "PX Logo on login page"; org is Project-X-Innovation |
| `scout/reference-map.json` | File inventory and unknowns | No PX logo asset exists; identified sign-in page, layouts, and image rendering patterns |
| `scout/scout-summary.md` | Structured codebase analysis | Layout hierarchy, quality gate commands, Clerk appearance has no logo config |
| `diagnosis/diagnosis-statement.md` | Root cause and success criteria | Missing feature: needs SVG asset + page-level modification; not shared layout |
| `diagnosis/apl.json` | Diagnosis resolution | Confirmed page-level placement, SVG format, next/image static import pattern |
| `product/product.md` | Product scope and constraints | Login page only; sign-up out of scope; no design spec; shared layout caution |
| `tech-research/tech-research.md` | Architecture decision and technical details | Option A chosen (page-level next/image); flex-col wrapper; ~120px width; no new deps |
| `tech-research/apl.json` | Tech research resolution | Confirmed no CSS layer conflicts; static import is established pattern |
| `repo-guidance.json` | Repo intent | Single repo target: next-js-boilerplate |
| `AGENTS.md` | Coding conventions | Named exports, @/ imports, Tailwind v4, conventional commits |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Current sign-in page source | Returns only `<SignIn>` with no wrapper; primary modification target |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Center layout source | Shared by sign-in/sign-up; provides flex centering; must not be modified |
| `src/components/Sponsors.tsx` | Logo rendering pattern reference | Static imports from `@/public/assets/images/` + `next/image` with width prop |
| `public/assets/images/` directory listing | Asset inventory | 18 existing files; no PX logo; SVGs present (arcjet, coderabbit, posthog) |
| `tests/e2e/I18n.e2e.ts` | E2E test covering sign-in page | Checks for "Email address" text; logo addition should not break this test |
