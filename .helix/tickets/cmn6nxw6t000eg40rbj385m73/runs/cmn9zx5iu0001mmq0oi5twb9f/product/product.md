# Product: PX Logo on Login Page

## Problem Statement

The login page currently shows only the Clerk sign-in form with no custom branding. Users arriving at the sign-in page see a generic authentication form with no visual connection to the Project X (PX) brand. This creates a disjointed experience where the first touchpoint for returning users lacks brand identity.

## Product Vision

Display the PX logo prominently on the login page so users immediately recognize they are signing in to a Project X application. This is a branding enhancement scoped to the login page only.

## Users

- **Existing users** returning to sign in to the application.
- **New visitors** landing on the sign-in page (e.g., via direct link or redirect).

## Use Cases

1. A user navigates to the login page and sees the PX logo above the sign-in form, confirming they are on the correct application.
2. A user is redirected to login after session expiry and sees familiar PX branding, reinforcing trust.

## Core Workflow

1. User arrives at the sign-in page (`/sign-in`).
2. The PX logo is displayed above the Clerk sign-in form.
3. User proceeds to authenticate as normal.

## Essential Features (MVP)

1. **PX logo asset**: A PX logo image file added to the repository's public assets directory.
2. **Logo on sign-in page**: The PX logo rendered above the Clerk sign-in form on the login page, visible on all screen sizes.

## Features Explicitly Out of Scope (MVP)

- Adding the PX logo to the sign-up page (ticket specifies "login page" only).
- Customizing Clerk component appearance/theming beyond logo placement.
- Adding PX branding to other pages (dashboard, navigation, etc.).
- Dark mode / light mode logo variants (no design spec provided).
- Animated or interactive logo behavior.

## Success Criteria

1. The sign-in page displays a PX logo above the Clerk sign-in form.
2. The logo follows the codebase's established image rendering pattern (`next/image` with static imports from `public/assets/images/`).
3. The sign-up page and all other pages remain unchanged.
4. All existing quality gates pass: lint, typecheck, unit tests, e2e tests, dependency check, i18n check.
5. The existing e2e test covering the sign-in page (`tests/e2e/I18n.e2e.ts`) continues to pass.

## Key Design Principles

- **Minimal change**: Add the logo with the smallest set of changes that achieve the goal.
- **Pattern consistency**: Follow the existing image asset and rendering conventions already established in the codebase.
- **Scoped impact**: Only the login page should be affected; shared layouts and other pages must remain untouched.

## Scope & Constraints

- **Single repo**: All changes are within `next-js-boilerplate`.
- **No design spec**: The ticket provides no dimensions, spacing, or visual design guidance for the logo. A sensible default consistent with the page layout should be used.
- **No existing asset**: A PX logo file must be created or sourced since none exists in the repository.
- **Shared layout caution**: The center layout (`(center)/layout.tsx`) is shared by both sign-in and sign-up pages; changes should be made at the page level, not the layout level, to keep the sign-up page unaffected.

## Future Considerations

- Extending PX branding to the sign-up page if desired.
- Adding dark/light mode logo variants.
- Replacing the placeholder logo with an official brand asset once available.
- Applying PX branding more broadly across the application (favicon, navigation, etc.).

## Open Questions / Risks

| # | Question / Risk | Impact |
|---|---|---|
| 1 | No PX logo asset exists in the repo. What format, dimensions, and design should it have? | Without a provided asset, a reasonable SVG placeholder must be created. It may need replacement later with an official brand asset. |
| 2 | The ticket does not specify logo placement details (size, spacing, alignment). | Defaults must be chosen; may require design review or follow-up adjustment. |
| 3 | Should the logo also appear on the sign-up page? | Ticket says "login page" only. If sign-up branding is also desired, a follow-up ticket is needed. |
| 4 | Should the logo link anywhere (e.g., marketing site, home page)? | Not specified. Default to non-linked static image. |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|---|---|---|
| `ticket.md` | Primary ticket definition | Ticket requests "PX Logo on login page"; repo is under Project-X-Innovation org |
| `scout/scout-summary.md` | Scout analysis of codebase structure | Layout hierarchy, existing image patterns, quality gates, no PX logo asset exists |
| `scout/reference-map.json` | File inventory and unknowns | Confirmed relevant files, facts about current state, and unknowns about logo asset/placement |
| `diagnosis/diagnosis-statement.md` | Root cause and success criteria | Confirmed this is a missing feature; logo should go in sign-in page component, not shared layout |
| `diagnosis/apl.json` | Diagnosis questions and answers | Validated placement approach (page-level), logo format (SVG), and rendering pattern (next/image) |
| `repo-guidance.json` | Repo intent metadata | Confirmed next-js-boilerplate is the sole target repo |
