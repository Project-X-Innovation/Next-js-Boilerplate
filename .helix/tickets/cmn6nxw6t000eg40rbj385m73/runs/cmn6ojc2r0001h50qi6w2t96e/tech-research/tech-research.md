# Tech Research: PX Logo on Login Page

## Technology Foundation

- **Framework**: Next.js 16.2+ with App Router
- **Auth**: Clerk (`@clerk/nextjs` ^7.0.6) providing `<SignIn>` component
- **Styling**: Tailwind CSS v4 with CSS layer ordering (`theme, base, clerk, components, utilities`)
- **Image handling**: `next/image` with static imports from `@/public/assets/images/`
- **Conventions**: Named exports (except pages), absolute `@/` imports, TypeScript strict mode

No new dependencies are required. All existing tools and patterns are sufficient.

## Architecture Decision

### Options Considered

| # | Option | Description |
|---|--------|-------------|
| A | **Page-level logo with next/image** | Add an SVG logo file, import it statically in the sign-in page, render above `<SignIn>` using `next/image` in a flex-col wrapper |
| B | Shared center layout modification | Add the logo in `(center)/layout.tsx` so it appears on both sign-in and sign-up pages |
| C | Clerk `appearance.logoImageUrl` API | Configure the logo through Clerk's built-in branding API via the `ClerkProvider` appearance prop |
| D | Inline SVG component | Create a React component that renders the PX logo as inline SVG markup |

### Chosen Option: A - Page-level logo with next/image

**Rationale:**

1. **Scope alignment**: The ticket says "login page" specifically. Option B would also affect the sign-up page, which is out of scope per the product spec.
2. **Pattern consistency**: The codebase already uses static SVG imports with `next/image` (see `Sponsors.tsx` lines 2, 6, 9 and `counter/page.tsx` line 7). This is the established convention.
3. **Simplicity**: Option A requires the smallest change - one new SVG file and one page file modification. Option C requires understanding and configuring Clerk's internal branding system. Option D introduces a pattern not used elsewhere for logos.
4. **Maintainability**: A static SVG file is easy to replace later with an official brand asset. The `next/image` wrapper provides built-in optimization.

### Why Others Were Rejected

- **Option B (shared layout)**: Would add the logo to both sign-in and sign-up pages. The ticket is scoped to "login page" only. Modifying a shared layout has broader blast radius.
- **Option C (Clerk API)**: The `appearance` prop on `ClerkProvider` can accept `logoImageUrl`, but this places the logo inside the Clerk component's internal layout, which offers less control over positioning, sizing, and spacing. It also couples the logo to Clerk's rendering decisions.
- **Option D (inline SVG)**: While technically valid, the codebase consistently uses file-based images with `next/image` for logos. Inline SVG would introduce an inconsistent pattern without clear benefit.

## Core API/Methods

### next/image with static SVG import

```
import Image from 'next/image';
import pxLogo from '@/public/assets/images/px-logo.svg';
// <Image src={pxLogo} alt="Project X" width={...} />
```

This is the same pattern used in `Sponsors.tsx` (lines 1-9) and other page components. Static imports give Next.js the image metadata (dimensions) at build time.

### Sign-in page component pattern

The page currently returns only `<SignIn>`. It needs to return a flex-col wrapper containing the logo and the sign-in form:

```
<div className="flex flex-col items-center">
  <Image ... className="mb-8" />
  <SignIn ... />
</div>
```

The parent center layout (`(center)/layout.tsx` line 11) already provides `flex min-h-screen items-center justify-center`, so the page wrapper just needs vertical stacking.

## Technical Decisions

### 1. Logo asset format: SVG

- **Decision**: Create `public/assets/images/px-logo.svg` as a simple text-based SVG with "PX" lettering.
- **Rationale**: SVGs are already used for logos in this project (arcjet, coderabbit, posthog). SVG is scalable, small file size (~1KB for text-based), and crisp at any resolution. No raster artifacts.
- **Rejected**: PNG (larger file size, not scalable, unnecessary for text-based logo), WebP (not used for logos in this project).

### 2. Logo dimensions for next/image

- **Decision**: Use a `width` prop of approximately 120-150px, consistent with a centered branding element above an auth form. The SVG viewBox should define the intrinsic aspect ratio.
- **Rationale**: The Clerk `<SignIn>` component renders at a standard card width (~400px). A logo width of ~120-150px provides visual balance without overwhelming the form. Exact value should be tuned visually but this is the target range.

### 3. Modification scope: sign-in page only

- **Decision**: Modify only `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`. Do not touch the shared `(center)/layout.tsx` or `(auth)/layout.tsx`.
- **Rationale**: The ticket says "login page". The sign-up page shares the center layout. Changing only the page component ensures zero impact on sign-up or any other page.

### 4. No i18n impact

- **Decision**: The logo is a visual asset with an `alt` attribute. Since this is a brand logo (not user-facing text content), a static English alt text ("Project X" or "PX") is appropriate without i18n key addition.
- **Rationale**: Brand names are typically not translated. The `check:i18n` gate scans `src/` for hardcoded strings but alt text on brand logos is standard practice. If the i18n check flags this, the alt text can be moved to a translation key, but this is unlikely based on how other images in the project use static alt text (see `Sponsors.tsx` lines 19-73).

### 5. No new component file

- **Decision**: Render the logo directly in the sign-in page component using `next/image`. Do not create a separate `PxLogo.tsx` component.
- **Rationale**: The logo appears on a single page. Creating a component adds indirection without reuse benefit. If the logo is later needed on other pages, extraction to a component is a straightforward follow-up.

## Cross-Platform Considerations

- **Responsive**: The `next/image` component handles responsive rendering. The SVG is inherently scalable. The flex-col wrapper with `items-center` ensures centering on all screen widths.
- **Accessibility**: The `<Image>` component requires an `alt` prop. Setting `alt="Project X"` provides screen reader access to the brand identity.
- **Dark mode**: No dark/light mode variants are in scope (product spec explicitly excludes this). The SVG should use a color that is visible on the white/light background of the center layout.

## Performance Expectations

- **Bundle impact**: Negligible. One small SVG file (~1KB) added to the public assets. Static imports are handled at build time.
- **Render impact**: None. The `next/image` component is already used elsewhere. Adding one image to the sign-in page adds no new client-side JavaScript.
- **Build impact**: None. No new dependencies, no new API routes, no changes to Next.js config.

## Dependencies

| Dependency | Version | Already in Project | Purpose |
|---|---|---|---|
| `next/image` | (part of Next.js 16) | Yes | Image rendering with optimization |
| `@clerk/nextjs` | ^7.0.6 | Yes | `<SignIn>` component (unchanged) |
| Tailwind CSS v4 | (existing) | Yes | Utility classes for layout |

**No new dependencies required.**

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | PX logo SVG placeholder may not match official brand guidelines | Medium | Low | SVG file is easily replaceable. Use clean, professional styling. |
| 2 | `check:i18n` may flag hardcoded alt text | Low | Low | Brand logo alt text is standard practice. Can add i18n key if flagged. |
| 3 | E2E test `I18n.e2e.ts` could be affected by DOM changes on sign-in page | Low | Low | Test checks for "Email address" text from Clerk form, not page structure. Adding a logo above the form should not affect this. |
| 4 | `check:deps` (knip) may flag the new SVG import as unused if misconfigured | Very Low | Low | Static import used directly in JSX is standard; knip should recognize it. |

## Deferred to Round 2

- Dark/light mode logo variants
- Extending PX logo to sign-up page
- Replacing placeholder SVG with official brand asset
- Adding PX branding to other parts of the application (nav, favicon, etc.)
- Logo link behavior (e.g., linking to home page)

## Summary Table

| Aspect | Decision |
|---|---|
| Asset format | SVG file at `public/assets/images/px-logo.svg` |
| Rendering | `next/image` with static import (matches `Sponsors.tsx` pattern) |
| Placement | Inside sign-in page component, above `<SignIn>` |
| Layout approach | Flex-col wrapper in page; shared layouts untouched |
| New dependencies | None |
| Files changed | 1 new file (SVG), 1 modified file (sign-in page) |
| Scope | Sign-in page only; sign-up and other pages unaffected |
| i18n | Static alt text for brand logo; no translation keys |
| Quality gates | All expected to pass (lint, typecheck, tests, e2e, deps, i18n) |

## APL Statement Reference

The implementation requires two changes: (1) Create a simple PX logo SVG file at `public/assets/images/px-logo.svg`, and (2) Modify the sign-in page component to import and render the logo above the Clerk `<SignIn>` component using a flex-col wrapper with `next/image`. The approach uses the established static import + `next/image` pattern from `Sponsors.tsx`, modifies only the sign-in page (not shared layouts), and requires no new dependencies or CSS changes.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|---|---|---|
| `ticket.md` | Primary ticket definition | Ticket requests "PX Logo on login page"; org is Project-X-Innovation |
| `scout/reference-map.json` | File inventory, facts, and unknowns | Confirmed no PX logo asset exists; identified relevant files and codebase patterns |
| `scout/scout-summary.md` | Structured analysis of codebase | Layout hierarchy (root > auth > center > page), quality gates, Clerk appearance config |
| `diagnosis/apl.json` | Diagnosis questions and resolved answers | Confirmed page-level placement (not layout), SVG format, next/image rendering pattern |
| `diagnosis/diagnosis-statement.md` | Root cause and success criteria | Missing feature; two deliverables: SVG asset + page modification |
| `product/product.md` | Product scope and constraints | Login page only, no design spec, shared layout caution, explicit out-of-scope items |
| `repo-guidance.json` | Repo intent | Confirmed single-repo (next-js-boilerplate) target |
| `src/app/[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx` | Direct source inspection | Currently returns only `<SignIn>` with no wrapper; needs flex-col container |
| `src/app/[locale]/(auth)/(center)/layout.tsx` | Direct source inspection | Shared center layout provides `flex min-h-screen items-center justify-center` |
| `src/app/[locale]/(auth)/layout.tsx` | Direct source inspection | ClerkProvider appearance only has `cssLayerName: 'clerk'` |
| `src/components/Sponsors.tsx` | Logo rendering pattern reference | Static SVG imports + `next/image` with `width` prop is the established pattern |
| `src/styles/global.css` | CSS layer ordering | `@layer theme, base, clerk, components, utilities` - no conflicts expected |
| `public/assets/images/` directory listing | Asset inventory | Contains existing SVGs (arcjet, coderabbit, posthog); establishes naming convention |
| `AGENTS.md` | Coding conventions | Named exports, `@/` imports, Tailwind v4 utilities, no unnecessary abstractions |
