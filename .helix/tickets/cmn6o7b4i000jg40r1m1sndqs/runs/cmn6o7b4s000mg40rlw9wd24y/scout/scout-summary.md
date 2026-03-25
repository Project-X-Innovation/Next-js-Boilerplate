# Scout Summary

## Problem

The ticket requests adding a "Finesse logo on logon page." The sign-in (logon) page currently renders only the Clerk `<SignIn />` component inside a minimal centered flex layout with no custom branding or logo. No Finesse logo asset or any reference to "Finesse" exists anywhere in the repository.

## Analysis Summary

**Sign-in page structure**: The sign-in page (`src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`) is a thin wrapper around Clerk's `<SignIn />` component with i18n metadata. It is nested inside:
1. A centered layout (`(center)/layout.tsx`) providing `flex min-h-screen items-center justify-center`
2. An auth layout (`(auth)/layout.tsx`) providing `<ClerkProvider>` with locale-aware URLs and Clerk CSS layer config
3. The root locale layout with global CSS and favicon metadata

**Current branding state**: The app is named "Nextjs Starter" in `AppConfig.ts`. All existing logos are sponsor/partner images in `public/assets/images/` and are used via static imports with `next/image`. There is zero Finesse branding in the codebase.

**Asset gap**: No Finesse logo file is attached to the ticket or present in the repo. The implementation will require either creating a placeholder logo asset or obtaining the actual asset externally.

**Logo placement options**: The logo could be added (a) as a sibling element above/below the `<SignIn />` component in the sign-in page, (b) in the shared `(center)/layout.tsx` to appear on both sign-in and sign-up, or (c) via Clerk's appearance API to customize the sign-in form itself.

**i18n requirement**: Per project conventions (AGENTS.md), all user-visible strings must use translation keys. Any alt text for the logo image must be added to both `en.json` and `fr.json` under the `SignIn` namespace.

**Quality gates**: Changes must pass lint (`ultracite`), typecheck (`tsc --noEmit`), dep check (`knip`), i18n check (`i18n-check`), and unit tests (`vitest`).

## Relevant Files

| File | Role |
|------|------|
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Sign-in page - primary target for logo addition |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Centered layout wrapping sign-in/sign-up |
| `src/app/[locale]/(auth)/layout.tsx` | Auth layout with ClerkProvider config |
| `src/app/[locale]/(auth)/(center)/sign-up/[[...sign-up]]/page.tsx` | Sign-up page - sibling under same layout |
| `src/app/[locale]/layout.tsx` | Root locale layout |
| `src/styles/global.css` | Global CSS with Tailwind v4 layers |
| `src/components/Sponsors.tsx` | Pattern reference for logo image usage |
| `public/assets/images/` | Static image assets directory |
| `src/locales/en.json` | English translations (SignIn namespace) |
| `src/locales/fr.json` | French translations (SignIn namespace) |
| `src/utils/AppConfig.ts` | App name and locale configuration |
| `package.json` | Build scripts and quality gates |
| `AGENTS.md` | Coding conventions and i18n rules |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Understand ticket scope | Title "Finesse logo on logon page" with no additional description or attachments |
| `package.json` | Identify quality gates and dependencies | Uses Clerk for auth, Tailwind v4, next-intl; quality gates via ultracite/tsc/knip/i18n-check/vitest |
| `AGENTS.md` | Understand coding conventions | Named exports, Tailwind v4 utilities, i18n required for all user-visible strings, next/image for images |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Inspect current sign-in page | Renders only Clerk `<SignIn />` with no custom branding |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Inspect sign-in wrapper layout | Minimal centered flex container with no branding |
| `src/app/[locale]/(auth)/layout.tsx` | Inspect auth provider boundary | ClerkProvider with cssLayerName:'clerk', locale-aware URLs |
| `src/components/Sponsors.tsx` | Learn established logo image pattern | Static imports from `@/public/assets/images/` with `next/image` `<Image>` component |
| `src/locales/en.json` | Check existing SignIn translations | Contains only meta_title and meta_description keys |
| `src/locales/fr.json` | Check existing French translations | Matches en.json structure for SignIn namespace |
| `public/assets/images/` | Verify existing assets | 19 files (sponsor logos, screenshots); no Finesse assets present |
| `src/utils/AppConfig.ts` | Check app branding config | App named "Nextjs Starter"; no Finesse references |
