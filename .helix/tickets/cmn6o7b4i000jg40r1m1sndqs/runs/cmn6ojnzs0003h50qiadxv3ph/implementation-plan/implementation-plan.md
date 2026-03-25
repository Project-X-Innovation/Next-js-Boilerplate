# Implementation Plan: Finesse Logo on Logon Page

## Overview

Add a Finesse logo to the sign-in (logon) page, displayed above the Clerk `<SignIn />` component. This requires creating a placeholder SVG logo asset, updating the sign-in page component to render it using `next/image`, and adding internationalized alt-text keys to both locale files.

**Scope**: 4 files changed (1 new SVG asset, 1 modified page component, 2 modified locale JSON files). No new dependencies. Sign-in page only.

## Implementation Principles

- **Minimal change**: Touch only the sign-in page; do not modify shared layouts or other pages.
- **Follow existing patterns**: Use the same static-import + `next/image` `<Image>` pattern established in `Sponsors.tsx`.
- **i18n compliance**: All user-visible strings (alt text) go through next-intl translation keys per AGENTS.md.
- **No new dependencies**: Everything needed is already in the stack (next/image, next-intl, Tailwind v4).

## Implementation Steps Summary

| Step | Goal | Deliverable |
|------|------|-------------|
| 1 | Create Finesse logo SVG asset | `public/assets/images/finesse-logo.svg` |
| 2 | Add i18n alt-text keys to locale files | Updated `src/locales/en.json` and `src/locales/fr.json` |
| 3 | Update sign-in page to render logo above form | Modified `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` |
| 4 | Run quality gates | All quality checks pass |

## Detailed Implementation Steps

### Step 1: Create Finesse Logo SVG Asset

**Goal**: Provide a placeholder Finesse logo image file in the established assets directory.

**What to Build**:
- Create `public/assets/images/finesse-logo.svg` — a clean, text-based SVG logo with the word "Finesse".
- The SVG should have a reasonable viewBox (e.g., `0 0 200 50` or similar), use a dark fill color (e.g., `#1a1a2e` or `#000`), and render the text "Finesse" in a clean sans-serif font.
- Keep the SVG minimal and under 1KB, following the pattern of existing SVG assets in the directory (e.g., `posthog-logo.svg` which uses inline SVG paths).
- The SVG must have `xmlns="http://www.w3.org/2000/svg"` and a `viewBox` attribute for proper scaling with `next/image`.

**Verification (AI Agent Runs)**:
- Confirm the file exists at `public/assets/images/finesse-logo.svg`.
- Confirm the SVG is valid XML with `xmlns` and `viewBox` attributes.

**Success Criteria**:
- `finesse-logo.svg` exists in `public/assets/images/`.
- The file is a valid SVG with proper namespace and viewBox.
- File size is under 2KB.

---

### Step 2: Add i18n Alt-Text Keys to Locale Files

**Goal**: Add internationalized alt text for the logo to both English and French locale files.

**What to Build**:
- In `src/locales/en.json`, add to the `SignIn` namespace: `"logo_alt": "Finesse logo"`.
- In `src/locales/fr.json`, add to the `SignIn` namespace: `"logo_alt": "Logo Finesse"`.
- Place the new key after the existing `meta_description` key to maintain alphabetical-ish order within the namespace.
- Use sentence case per AGENTS.md conventions.

**Verification (AI Agent Runs)**:
- Run `bun run check:i18n` and confirm it passes (both locales have matching keys).

**Success Criteria**:
- `en.json` → `SignIn.logo_alt` = `"Finesse logo"`.
- `fr.json` → `SignIn.logo_alt` = `"Logo Finesse"`.
- `bun run check:i18n` exits with code 0.

---

### Step 3: Update Sign-In Page to Render Logo

**Goal**: Modify the sign-in page component to display the Finesse logo above the Clerk sign-in form.

**What to Build**:
- In `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`:
  1. Add a static import for the SVG: `import finesseLogo from '@/public/assets/images/finesse-logo.svg';`
  2. Add an import for the Image component: `import Image from 'next/image';`
  3. In the `SignInPage` function body, get translations for the `SignIn` namespace using the existing `getTranslations` import (already used in `generateMetadata`, but also call it inside the page function for the alt text).
  4. Wrap the existing `<SignIn />` component and a new `<Image>` in a flex-column container div.
  5. The returned JSX should be:
     ```
     <div className="flex flex-col items-center gap-6">
       <Image src={finesseLogo} alt={t('logo_alt')} width={200} />
       <SignIn path={getI18nPath('/sign-in', locale)} />
     </div>
     ```
  6. The `width={200}` gives the logo reasonable prominence; `height` is auto-calculated from the SVG's aspect ratio.
- Follow AGENTS.md conventions:
  - Access props as `props.foo` (no destructuring) — already done.
  - Use `@/` absolute imports.
  - No default export name change needed (already `SignInPage`).

**Verification (AI Agent Runs)**:
- Run `bun run check:types` — typecheck passes.
- Run `bun run lint` — lint passes.
- Run `bun run check:deps` — dependency check passes (no unused imports).

**Success Criteria**:
- The sign-in page renders an `<Image>` with the Finesse logo above the `<SignIn />` component.
- Both are wrapped in a `flex flex-col items-center` container.
- The logo alt text uses the i18n key `t('logo_alt')`.
- The static import follows the `@/public/assets/images/` pattern.

---

### Step 4: Run All Quality Gates

**Goal**: Verify the entire change set passes all project quality gates.

**What to Build**: Nothing — this is a verification-only step.

**Verification (AI Agent Runs)**:
- `bun run lint` — lint passes (exit 0).
- `bun run check:types` — typecheck passes (exit 0).
- `bun run check:deps` — dependency check passes (exit 0).
- `bun run check:i18n` — i18n consistency check passes (exit 0).
- `bun run test` — unit tests pass (exit 0).
- `bun run build-local` — build succeeds (exit 0).

**Success Criteria**:
- All six commands exit with code 0.
- No regressions introduced.

---

## Verification Plan

### Pre-conditions

| Dependency | Status | Source/Evidence | Affects checks |
|------------|--------|-----------------|----------------|
| Node.js >= 20 | available | `package.json` engines field; workspace environment | [CHK-01] through [CHK-07] |
| `bun` runtime | available | Project uses `bun run` for all scripts | [CHK-01] through [CHK-06] |
| `npm install` / `bun install` completed | available | Dependencies must be installed before running scripts | [CHK-01] through [CHK-07] |
| Clerk environment variables (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY) | unknown | Required for `bun run build-local` and dev server; not in dev setup config | [CHK-06], [CHK-07] |
| Database (PGlite) | available | `build-local` script uses in-memory PGlite via `db-server:memory` | [CHK-06] |

### Required Checks

[CHK-01] Run lint check.
- Action: Execute `bun run lint` in the repository root.
- Expected Outcome: Command exits with code 0 and reports no errors.
- Required Evidence: Terminal output showing successful completion with exit code 0.

[CHK-02] Run typecheck.
- Action: Execute `bun run check:types` in the repository root.
- Expected Outcome: Command exits with code 0 with no type errors.
- Required Evidence: Terminal output showing successful completion with exit code 0.

[CHK-03] Run dependency check.
- Action: Execute `bun run check:deps` in the repository root.
- Expected Outcome: Command exits with code 0 with no unused dependencies or exports flagged for the changed files.
- Required Evidence: Terminal output showing successful completion with exit code 0.

[CHK-04] Run i18n consistency check.
- Action: Execute `bun run check:i18n` in the repository root.
- Expected Outcome: Command exits with code 0, confirming `en.json` and `fr.json` have matching keys including the new `SignIn.logo_alt` key.
- Required Evidence: Terminal output showing successful completion with exit code 0.

[CHK-05] Run unit tests.
- Action: Execute `bun run test` in the repository root.
- Expected Outcome: All existing tests pass with exit code 0. No regressions.
- Required Evidence: Terminal output showing test results and exit code 0.

[CHK-06] Run build.
- Action: Execute `bun run build-local` in the repository root.
- Expected Outcome: Next.js build completes successfully with exit code 0.
- Required Evidence: Terminal output showing successful build completion with exit code 0.

[CHK-07] Browser verification of sign-in page with Finesse logo.
- Action: Start the dev server with `bun run dev:next`, navigate to `http://localhost:3000/sign-in` in a browser, and visually inspect the page.
- Expected Outcome: The Finesse logo is visible above the Clerk sign-in form. The logo and form are vertically stacked and horizontally centered on the page.
- Required Evidence: Browser screenshot showing the Finesse logo rendered above the Clerk sign-in form on the sign-in page, with both elements visually centered.

## Success Metrics

1. A Finesse logo SVG asset exists at `public/assets/images/finesse-logo.svg`.
2. The sign-in page renders the Finesse logo above the Clerk sign-in form using `next/image`.
3. Logo alt text is internationalized in both `en.json` and `fr.json` under the `SignIn` namespace.
4. The logo and sign-in form are vertically stacked and centered.
5. All quality gates pass: lint, typecheck, dep check, i18n check, unit tests, and build.
6. No files outside the 4-file scope are modified.
7. No new dependencies are introduced.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Understand ticket scope | "Finesse logo on logon page" — singular page, no attachments |
| `scout/scout-summary.md` | Review scout analysis | Sign-in page has no branding; no Finesse assets exist; i18n and quality gate requirements identified |
| `scout/reference-map.json` | Structured analysis of files, facts, unknowns | 13 relevant files; confirmed asset gap and sign-in page structure |
| `diagnosis/diagnosis-statement.md` | Root cause and success criteria | Feature addition; logo above `<SignIn />` preferred; 7 success criteria defined |
| `diagnosis/apl.json` | Diagnosis Q&A | Confirmed sign-in-only scope; static import + next/image pattern; i18n alt text required |
| `product/product.md` | Product requirements and scope | Sign-up page, Clerk appearance API, broader rebranding all out of scope; logo above form with i18n alt text |
| `tech-research/tech-research.md` | Technology decisions | SVG format, sign-in page placement, flex-col wrapper, `logo_alt` key in SignIn namespace, no new deps |
| `tech-research/apl.json` | Tech research Q&A | Confirmed approach: static SVG import, next/image, i18n via getTranslations |
| `repo-guidance.json` | Repo intent classification | `next-js-boilerplate` is the sole target repo |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Current sign-in page code | Renders only `<SignIn />` with getTranslations for metadata |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Centered layout | Provides flex centering — no changes needed |
| `src/components/Sponsors.tsx` | Established image/logo pattern | Static imports from `@/public/assets/images/` + `<Image>` with explicit `width` |
| `src/locales/en.json` | Current English translations | SignIn namespace has only meta_title and meta_description |
| `src/locales/fr.json` | Current French translations | Mirrors en.json — needs logo_alt key |
| `package.json` | Quality gate scripts and dependencies | Confirmed all quality gate commands and that no new deps are needed |
| `AGENTS.md` | Coding conventions | Named exports, Tailwind v4, i18n required, next/image, no prop destructuring |
| `public/assets/images/posthog-logo.svg` | SVG format reference | Inline SVG with xmlns and viewBox — pattern to follow for logo asset |
