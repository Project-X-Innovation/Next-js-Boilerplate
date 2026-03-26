# Tech Research: Finesse Logo on Logon Page

## Technology Foundation

- **Framework**: Next.js 16 with App Router (React 19, TypeScript 5.9)
- **Styling**: Tailwind CSS v4 with CSS-first configuration (no `tailwind.config.js`); Clerk styles in a dedicated `clerk` CSS layer
- **Auth**: Clerk (`@clerk/nextjs` v7) with `<SignIn />` component
- **i18n**: next-intl v4 with `en` and `fr` locales
- **Image handling**: `next/image` (`<Image>`) with static imports from `@/public/assets/images/`
- **Quality gates**: ultracite (lint), tsc (typecheck), knip (dep check), i18n-check, vitest (unit tests)

No new dependencies are required. All technology is already in the stack.

## Architecture Decision

### Options Considered

| # | Option | Description |
|---|--------|-------------|
| A | **Logo as sibling element above `<SignIn />`** | Add an `<Image>` component rendering the Finesse logo above the Clerk form in the sign-in page component, wrapped in a flex-column container. |
| B | **Logo in shared centered layout** | Add the logo in `(center)/layout.tsx` so it appears on both sign-in and sign-up pages. |
| C | **Logo via Clerk appearance API** | Inject the logo into the Clerk `<SignIn />` form's header using Clerk's `appearance.elements` or `appearance.layout.logoImageUrl` configuration. |

### Chosen Option: A — Logo as sibling element above `<SignIn />`

**Rationale**:
- **Minimal scope**: The ticket says "logon page" (singular). Option A targets only the sign-in page, matching the ticket's intent. Option B would also change the sign-up page, which is explicitly out of scope per product.md.
- **Simplicity**: Option A requires adding a wrapper `<div>` and an `<Image>` element — two lines of JSX. Option C requires understanding Clerk's appearance API internals and couples branding to Clerk's DOM structure.
- **Maintainability**: The logo is a standard `next/image` element, easy to update or replace. Option C ties the logo to Clerk-specific configuration that may change across Clerk major versions.
- **Pattern consistency**: Option A follows the exact pattern used in `Sponsors.tsx` — static import + `<Image>` component.

## Core API/Methods

| API | Usage |
|-----|-------|
| `next/image` `<Image>` | Render the logo with automatic optimization and sizing |
| `getTranslations` (next-intl server) | Retrieve i18n alt text for the logo on the server-rendered sign-in page |
| Static SVG import (`@/public/assets/images/finesse-logo.svg`) | Import the logo asset following the established pattern |

## Technical Decisions

### 1. Logo Asset Format: SVG

**Decision**: Create a placeholder SVG file at `public/assets/images/finesse-logo.svg`.

**Rationale**: The codebase already uses SVG for several logos (arcjet-light.svg, posthog-logo.svg, coderabbit-logo-light.svg). SVG is scalable, lightweight (<1KB for a text logo), and resolution-independent. Since no official logo was provided, a clean text-based SVG with "Finesse" serves as a recognizable placeholder that can be swapped for the official asset later with zero code changes.

**Rejected alternatives**:
- **PNG**: Would require specific dimensions and would not scale cleanly. Creates a larger file for a text-only placeholder.
- **Inline SVG JSX**: Would avoid a file but breaks the established static-import pattern and makes future asset replacement harder (code change instead of file swap).

### 2. Logo Placement: Sign-in Page Component Only

**Decision**: Add the logo inside `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`, not in the shared layout.

**Rationale**: The ticket references "logon page" (singular). The product specification explicitly puts the sign-up page out of scope. The centered layout (`(center)/layout.tsx`) is shared by both sign-in and sign-up — modifying it would have broader impact.

**Rejected alternatives**:
- **Shared layout**: Would affect both sign-in and sign-up pages, exceeding ticket scope.
- **Auth layout (`(auth)/layout.tsx`)**: Even broader impact — would affect all auth pages including non-centered ones.

### 3. Layout Structure: Flex Column Wrapper

**Decision**: Wrap the logo `<Image>` and `<SignIn />` component in a `<div>` with Tailwind classes `flex flex-col items-center gap-6` (or similar gap value).

**Rationale**: The parent `(center)/layout.tsx` already provides full-screen centering (`flex min-h-screen items-center justify-center`). The sign-in page just needs to stack its children vertically. A simple flex-col wrapper is the most minimal structural change.

### 4. i18n: Alt Text Under SignIn Namespace

**Decision**: Add a `logo_alt` key to the `SignIn` namespace in both `en.json` and `fr.json`.

**Rationale**: AGENTS.md mandates "Never hard-code user-visible strings." The existing `SignIn` namespace (currently containing only `meta_title` and `meta_description`) is the natural location for sign-in page strings. Using `getTranslations` (already imported in the page) requires no additional imports.

**Key values**:
- `en.json` → `"SignIn.logo_alt": "Finesse logo"`
- `fr.json` → `"SignIn.logo_alt": "Logo Finesse"`

### 5. Image Sizing

**Decision**: Use an explicit `width` prop on the `<Image>` component (e.g., `width={200}`) with automatic height, matching the pattern in `Sponsors.tsx` where all images use explicit `width`.

**Rationale**: The established pattern in `Sponsors.tsx` (lines 18-22) uses explicit `width` props. For an SVG with a known viewBox, `next/image` will calculate the height from the intrinsic aspect ratio. This keeps the logo proportional and consistent with existing image usage.

## Cross-Platform Considerations

Not applicable — this is a web-only Next.js application. The logo will render identically across browsers due to SVG format and `next/image` handling.

## Performance Expectations

- **Bundle impact**: Near-zero. The SVG file is < 1KB. `next/image` is already used elsewhere, so no new JS is loaded.
- **Render impact**: None measurable. One additional static `<Image>` element on a page that already renders the Clerk widget (which is significantly heavier).
- **LCP impact**: The logo is above the fold but lightweight; it will not delay LCP. The Clerk `<SignIn />` widget's loading time dominates page load.

## Dependencies

| Dependency | Version | Already in Project | Purpose |
|------------|---------|-------------------|---------|
| `next/image` | part of `next@^16.2.1` | Yes | Image rendering |
| `next-intl` | `^4.8.3` | Yes | i18n alt text |
| Tailwind CSS v4 | `^4.2.2` | Yes | Styling the wrapper |

**No new dependencies required.**

## Risks

| # | Risk | Mitigation |
|---|------|------------|
| 1 | **No official logo asset provided** — the placeholder may not match Finesse brand guidelines | Create a clean, neutral placeholder SVG. Design it for easy file-swap replacement: same filename, any format works with `next/image`. |
| 2 | **i18n-check might fail** if key naming or structure is incorrect | Follow the exact pattern of existing keys in the `SignIn` namespace. Run `bun run check:i18n` to verify. |
| 3 | **knip (dep check) might flag unused imports** if the static SVG import pattern differs from expectations | The same pattern works in `Sponsors.tsx` without knip issues, so this is low risk. |
| 4 | **Clerk form width may not align with logo width** | Set the logo width to approximately match Clerk's form width (~350-400px container). Fine-tune with Tailwind `max-w-*` if needed. |

## Deferred to Round 2

- Extending the logo to the sign-up page (if consistency across auth pages is later desired).
- Replacing the placeholder SVG with an official Finesse brand asset when provided.
- Broader app rebranding (changing `AppConfig.name` from "Nextjs Starter" to "Finesse", favicons, metadata).
- Deeper Clerk appearance customization (injecting logo into the Clerk form header).

## Summary Table

| Aspect | Decision |
|--------|----------|
| **Asset format** | SVG placeholder at `public/assets/images/finesse-logo.svg` |
| **Rendering** | `next/image` `<Image>` with static import |
| **Placement** | Inside sign-in page component, above `<SignIn />` |
| **Layout** | Flex-col wrapper with gap for vertical stacking |
| **i18n** | `logo_alt` key in `SignIn` namespace (en + fr) |
| **Styling** | Tailwind utility classes only |
| **New deps** | None |
| **Files changed** | 4 (sign-in page.tsx, en.json, fr.json, new SVG asset) |

## APL Statement Reference

Create a placeholder SVG logo for Finesse, place it in `public/assets/images/`, and render it above the Clerk `<SignIn />` component using `next/image` with a static import. The sign-in page wraps logo + form in a flex-col container. i18n alt-text keys are added to `en.json` and `fr.json` under the `SignIn` namespace. The change is scoped to the sign-in page only. No new dependencies are needed.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Understand ticket scope | "Finesse logo on logon page" — singular page, no attachments or additional description |
| `scout/reference-map.json` | Structured analysis of files, facts, unknowns | No Finesse assets exist; sign-in page renders only `<SignIn />`; established image pattern via Sponsors.tsx |
| `scout/scout-summary.md` | High-level scout findings | Confirmed asset gap, i18n requirements, quality gates, and placement options |
| `diagnosis/apl.json` | Diagnosis Q&A and investigation results | Confirmed sign-in-only scope; static import + next/image pattern; i18n alt text required |
| `diagnosis/diagnosis-statement.md` | Root cause and success criteria | Feature addition; logo above `<SignIn />` preferred; 7 success criteria defined |
| `product/product.md` | Product requirements and scope | Sign-up page, Clerk appearance API, and broader rebranding are out of scope; logo above form with i18n alt text |
| `repo-guidance.json` | Repo intent classification | `next-js-boilerplate` is the sole target repo |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Current sign-in page code | Renders only `<SignIn />` with locale path; uses `getTranslations` for metadata |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Centered layout wrapping auth pages | Provides `flex min-h-screen items-center justify-center` — no changes needed here |
| `src/app/[locale]/(auth)/layout.tsx` | Auth layout with ClerkProvider | `cssLayerName: 'clerk'` for Tailwind v4 compatibility — no changes needed here |
| `src/components/Sponsors.tsx` | Established image/logo rendering pattern | Static imports from `@/public/assets/images/` + `<Image>` with explicit `width` |
| `src/locales/en.json` | Current English translations | `SignIn` namespace has `meta_title` and `meta_description` — needs `logo_alt` key added |
| `src/locales/fr.json` | Current French translations | Mirrors en.json structure — needs corresponding `logo_alt` key added |
| `src/styles/global.css` | Tailwind v4 layer configuration | Layer ordering `theme, base, clerk, components, utilities` — no changes needed |
| `package.json` | Dependencies and quality gate scripts | Confirmed next@^16, tailwind@^4.2, all quality gate commands |
| `AGENTS.md` | Coding conventions | Named exports, Tailwind v4 utilities, i18n required, next/image for images, no prop destructuring |
