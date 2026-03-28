# Scout Summary

## Problem

The ticket requests adding a "PX Logo" to the login page. The current sign-in page (`src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`) renders only the Clerk `<SignIn>` component with no custom branding or logo. No PX logo asset exists anywhere in the repository. The GitHub organization is "Project-X-Innovation", suggesting "PX" stands for "Project X".

## Analysis Summary

### Current Login Page Architecture

The sign-in page lives under a nested layout hierarchy:

1. **Root layout** (`src/app/[locale]/layout.tsx`) - HTML shell, i18n provider, favicon metadata
2. **Auth layout** (`src/app/[locale]/(auth)/layout.tsx`) - Wraps children in `ClerkProvider` with `appearance={{ cssLayerName: 'clerk' }}`
3. **Center layout** (`src/app/[locale]/(auth)/(center)/layout.tsx`) - Minimal flex container that centers content vertically and horizontally
4. **Sign-in page** (`src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`) - Renders `<SignIn path={...} />`

The center layout is shared between sign-in and sign-up pages. Neither the layout nor the page component includes any logo or custom branding.

### Logo Patterns in Codebase

- Existing logos (sponsor brands) are stored as static files in `public/assets/images/` and rendered via `next/image` with static imports (pattern visible in `src/components/Sponsors.tsx`).
- No PX-branded asset exists in the repo.
- The Clerk `appearance` prop currently sets only `cssLayerName` - no `logoImageUrl` or other visual customization is applied.

### Key Boundaries

- **Clerk appearance API**: The `ClerkProvider` in the auth layout accepts an `appearance` prop that can customize Clerk component visuals, including logo.
- **Center layout**: Modifying this layout would affect both sign-in and sign-up pages.
- **Page-level change**: Modifying just the sign-in page would scope the logo to login only.
- **Asset requirement**: A PX logo image file must be added to the repository (no existing asset).

### Quality Gates

| Gate | Command |
|------|---------|
| Lint | `ultracite check --type-aware --type-check` |
| Typecheck | `tsc --noEmit` |
| Unit tests | `vitest run` |
| E2E tests | `playwright test` |
| Dep check | `knip` |
| i18n check | `i18n-check` |

### E2E Test Consideration

`tests/e2e/I18n.e2e.ts` navigates to `/sign-in` and checks for Clerk's "Email address" text. Adding a logo above the form should not break this test.

## Relevant Files

| File | Role |
|------|------|
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Sign-in page - renders Clerk `<SignIn>` only |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Center layout - shared by sign-in and sign-up |
| `src/app/[locale]/(auth)/layout.tsx` | Auth layout - ClerkProvider with appearance config |
| `src/app/[locale]/(auth)/(center)/sign-up/[[...sign-up]]/page.tsx` | Sign-up page - identical structure to sign-in |
| `src/app/[locale]/layout.tsx` | Root layout with favicon metadata |
| `src/styles/global.css` | Global CSS with Tailwind v4 layer ordering |
| `public/assets/images/` | Image asset directory (no PX logo present) |
| `src/components/Sponsors.tsx` | Reference for logo rendering pattern (next/image) |
| `src/utils/AppConfig.ts` | App config with name "Nextjs Starter" |
| `tests/e2e/I18n.e2e.ts` | E2E test covering sign-in page navigation |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Primary ticket context | Ticket requests "PX Logo on login page"; repo owned by Project-X-Innovation org |
| `AGENTS.md` | Coding conventions and quality gate commands | Named exports, Tailwind v4, absolute imports, quality gate scripts defined |
| `package.json` | Dependency and script inventory | Uses Clerk for auth, Tailwind v4, Next.js 16, quality gates available |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Sign-in page source | Renders only `<SignIn>` component with no custom content or logo |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Center layout source | Minimal flex centering div, shared by sign-in and sign-up |
| `src/app/[locale]/(auth)/layout.tsx` | Auth layout source | ClerkProvider appearance only sets cssLayerName, no logo config |
| `src/components/Sponsors.tsx` | Existing logo rendering pattern | Uses next/image with static imports from public/assets/images/ |
| `public/assets/images/` (glob) | Image asset inventory | Contains sponsor logos but no PX logo asset |
| `tests/e2e/I18n.e2e.ts` | E2E test covering sign-in | Tests sign-in page for Clerk text; logo addition should not break it |
