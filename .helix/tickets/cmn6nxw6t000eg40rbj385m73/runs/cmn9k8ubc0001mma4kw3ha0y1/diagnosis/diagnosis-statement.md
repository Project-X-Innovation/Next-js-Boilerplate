# Diagnosis Statement

## Problem Summary

The login page (sign-in) currently renders only the Clerk `<SignIn>` component with no custom branding. The ticket requests adding a "PX Logo" to the login page. No PX logo asset exists anywhere in the repository. "PX" refers to "Project X" based on the GitHub organization name "Project-X-Innovation".

## Root Cause Analysis

This is a **missing feature**, not a bug. The sign-in page at `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` was built as a minimal wrapper around Clerk's `<SignIn>` component with no custom branding or logo. The center layout provides only flex centering. The auth layout configures ClerkProvider with only `cssLayerName` in its appearance prop, with no visual customization.

Two things are missing:
1. **Logo asset**: No PX logo file exists in `public/assets/images/` or anywhere else in the repository.
2. **Logo rendering**: The sign-in page component returns only `<SignIn>` with no wrapper markup for additional content like a logo.

### Alternative hypotheses considered

| Hypothesis | Assessment |
|---|---|
| Logo should go in the shared center layout (affecting sign-in AND sign-up) | Rejected: ticket says "login page" specifically, not "auth pages" |
| Logo should be set via Clerk's `appearance.logoImageUrl` API | Rejected: more complex, less control over placement/styling, and Clerk's internal branding differs from placing a logo above the form |
| A PX logo asset already exists elsewhere (external CDN, other repo) | No evidence: grep found no PX logo references in source code |

## Evidence Summary

| Evidence | Finding |
|---|---|
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` (line 29) | Returns only `<SignIn path={...} />` with no surrounding content |
| `src/app/[locale]/(auth)/(center)/layout.tsx` (line 11) | Minimal flex container, shared with sign-up |
| `src/app/[locale]/(auth)/layout.tsx` (lines 29-41) | ClerkProvider appearance has only `cssLayerName: 'clerk'` |
| `public/assets/images/` directory listing | 18 files, all sponsor/third-party logos; no PX logo |
| Grep for PX/Project-X patterns in source | No matches outside .helix artifacts |
| `src/components/Sponsors.tsx` | Establishes pattern: static import from `@/public/assets/images/`, render with `next/image` |
| `ticket.md` line 7 | repo_url points to `Project-X-Innovation` org, confirming PX = Project X |

## Success Criteria

1. A PX logo SVG asset exists in `public/assets/images/` (following the established convention).
2. The sign-in page (`src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`) displays the PX logo above the Clerk `<SignIn>` component.
3. The logo is rendered using the `next/image` pattern consistent with `Sponsors.tsx`.
4. The sign-up page and other pages remain unaffected.
5. All existing quality gates pass (lint, typecheck, tests, e2e, dep-check, i18n-check).
6. The e2e test at `tests/e2e/I18n.e2e.ts` continues to pass (it checks for "Email address" text on the sign-in page).

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|---|---|---|
| `ticket.md` | Primary ticket definition | Ticket requests "PX Logo on login page"; org is Project-X-Innovation |
| `scout/reference-map.json` | Scout-identified files and unknowns | Confirmed no PX logo asset exists; identified sign-in page, layouts, and image patterns as key files |
| `scout/scout-summary.md` | Scout analysis summary | Provided layout hierarchy, confirmed Clerk appearance has no logo config, documented quality gates |
| `AGENTS.md` (system context) | Coding conventions | Named exports, Tailwind v4, absolute imports, next/image pattern for assets |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Direct inspection of sign-in page | Renders only `<SignIn>` with no custom content |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Direct inspection of center layout | Shared by sign-in and sign-up; minimal flex centering |
| `src/app/[locale]/(auth)/layout.tsx` | Direct inspection of auth layout | ClerkProvider appearance only has cssLayerName |
| `src/components/Sponsors.tsx` | Logo rendering pattern reference | Uses next/image with static imports from @/public/assets/images/ |
| `public/assets/images/` directory listing | Asset inventory | Contains only sponsor logos, no PX branding |
| `src/utils/AppConfig.ts` | App configuration | App name is "Nextjs Starter", no PX branding present |
