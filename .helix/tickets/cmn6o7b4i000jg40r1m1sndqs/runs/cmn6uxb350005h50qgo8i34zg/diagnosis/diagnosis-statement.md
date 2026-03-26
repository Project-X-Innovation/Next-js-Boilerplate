# Diagnosis Statement

## Problem Summary

The ticket requests adding a "Finesse logo on logon page." The sign-in (logon) page currently renders only the Clerk `<SignIn />` component with no custom branding, logo, or Finesse-related content. No Finesse logo asset exists anywhere in the repository, and none was attached to the ticket.

## Root Cause Analysis

This is a **feature addition**, not a bug. The root cause of the missing logo is simply that no Finesse branding has been implemented:

1. **No logo asset**: No file matching "finesse" exists in `public/assets/images/` or anywhere else in the repo. The 18 existing image files are all sponsor/partner logos.
2. **No branding in sign-in page**: The sign-in page (`src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`) returns only `<SignIn path={...} />` (line 29) with no wrapper, no logo, and no custom elements.
3. **No branding in layout**: The centered layout (`src/app/[locale]/(auth)/(center)/layout.tsx`) provides only a flex container for centering — no branding elements.
4. **App name still generic**: `AppConfig.ts` names the app "Nextjs Starter" with no Finesse references.

### Alternative hypothesis considered

- **Clerk appearance API for logo**: Clerk's `<SignIn />` supports an `appearance` prop that can inject a logo into the sign-in form itself. However, this approach is more complex, couples branding to Clerk's internal DOM structure, and is less flexible than adding the logo as a sibling element. The simpler approach — rendering the logo above the `<SignIn />` component — is preferred per the minimal-change principle.

## Evidence Summary

| Evidence | Finding |
|----------|---------|
| `sign-in/page.tsx` line 29 | Renders only `<SignIn />` with no branding |
| `(center)/layout.tsx` line 11 | Bare flex container, no logo |
| `public/assets/images/` listing | 18 files, zero Finesse assets |
| `en.json` SignIn namespace (lines 55-58) | Only `meta_title` and `meta_description` keys |
| `fr.json` SignIn namespace (lines 55-58) | Mirrors en.json — no logo alt text key |
| `Sponsors.tsx` (lines 1-10) | Establishes pattern: static import from `@/public/assets/images/` + `next/image` `<Image>` |
| `AGENTS.md` i18n rule | "Never hard-code user-visible strings" — alt text needs i18n |
| `AppConfig.ts` line 10 | App named "Nextjs Starter" — no Finesse identity |

## Success Criteria

1. A Finesse logo is visible on the sign-in (logon) page, rendered above the Clerk sign-in form.
2. A logo asset file (SVG preferred) exists in `public/assets/images/`.
3. The logo uses the `next/image` `<Image>` component, following the established pattern in `Sponsors.tsx`.
4. Logo alt text is internationalized — keys added to both `en.json` and `fr.json` under the `SignIn` namespace.
5. The sign-in page layout is visually coherent: logo and form are vertically stacked and centered.
6. All quality gates pass: lint (`ultracite`), typecheck (`tsc`), dep check (`knip`), i18n check (`i18n-check`), and tests (`vitest`).
7. No unrelated functionality is broken.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Understand ticket scope and requirements | Title "Finesse logo on logon page" with no attachments or additional description |
| `scout/reference-map.json` | Review scout analysis of problem, files, facts, and unknowns | Confirmed no Finesse assets exist; identified sign-in page structure and i18n requirements |
| `scout/scout-summary.md` | Review high-level scout findings | Confirmed asset gap and placement options; identified quality gates |
| `AGENTS.md` (via system reminder) | Understand coding conventions | Named exports, Tailwind v4, i18n required for all user-visible strings, next/image for images |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Inspect current sign-in page | Renders only Clerk `<SignIn />` with no custom branding (line 29) |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Inspect centered layout | Bare flex container, no branding — potential alternative placement |
| `src/app/[locale]/(auth)/layout.tsx` | Inspect auth layout and ClerkProvider config | cssLayerName: 'clerk' for Tailwind v4 compatibility |
| `src/components/Sponsors.tsx` | Learn established image/logo pattern | Static imports from `@/public/assets/images/` with `next/image` `<Image>` component |
| `src/locales/en.json` | Check existing SignIn i18n keys | Only meta_title and meta_description — needs logo_alt key |
| `src/locales/fr.json` | Check existing French translations | Mirrors en.json — needs corresponding logo_alt key |
| `src/utils/AppConfig.ts` | Check app identity | Named "Nextjs Starter" — no Finesse references |
| `public/assets/images/` directory listing | Verify existing assets | 18 files, none Finesse-related |
