# Product: Finesse Logo on Logon Page

## Problem Statement

The sign-in (logon) page has no Finesse branding. Users see only the default Clerk sign-in form inside a plain centered container. There is no logo, product identity, or visual cue that they are signing into a Finesse application. This undermines brand recognition and trust at the first touchpoint of the user experience.

## Product Vision

Users arriving at the sign-in page immediately see the Finesse logo, establishing brand identity before they interact with the authentication form.

## Users

- **End users** who visit the sign-in page to authenticate into the application.
- **Prospective users** encountering the sign-in page for the first time, for whom brand clarity matters.

## Use Cases

1. A user navigates to the sign-in page and sees the Finesse logo prominently displayed above the sign-in form, confirming they are on the correct application.
2. A French-speaking user sees the same logo with properly localized alt text for accessibility.

## Core Workflow

1. User navigates to the sign-in URL.
2. The page loads and displays the Finesse logo above the Clerk sign-in form.
3. User proceeds to sign in as normal.

## Essential Features (MVP)

1. **Finesse logo visible on the sign-in page** -- a logo rendered above the Clerk sign-in form, vertically centered with the form.
2. **Logo asset** -- a Finesse logo file placed in the project's static assets directory.
3. **Accessible alt text** -- internationalized alt text for the logo in both English and French locales.

## Features Explicitly Out of Scope (MVP)

- Rebranding the entire application (e.g., changing the app name from "Nextjs Starter" to "Finesse" in AppConfig or metadata).
- Adding the Finesse logo to the sign-up page (ticket says "logon page," singular).
- Customizing the Clerk sign-in form's internal branding via the Clerk appearance API.
- Adding the logo to any other page (dashboard, landing, etc.).
- Favicon or browser-tab branding changes.

## Success Criteria

1. The Finesse logo is visible on the sign-in page, rendered above the sign-in form.
2. The logo is vertically stacked with and centered relative to the sign-in form.
3. Logo alt text is localized in both English (`en.json`) and French (`fr.json`).
4. All existing quality gates pass (lint, typecheck, dependency check, i18n check, unit tests).
5. No existing functionality is broken.

## Key Design Principles

- **Minimal change**: Add the logo with the smallest change set that achieves the goal.
- **Follow existing patterns**: Use the same image rendering approach already established in the codebase.
- **i18n compliance**: All user-visible strings (including alt text) must go through the internationalization system.
- **Accessibility**: The logo image must have meaningful alt text.

## Scope & Constraints

- **Single page**: The change targets only the sign-in page, not the shared auth layout or other pages.
- **Asset gap**: No Finesse logo asset was provided with the ticket or exists in the repository. A placeholder logo must be created. If a specific brand asset is later provided, it should be a straightforward file replacement.
- **Locale support**: The project supports English and French; alt text must be added to both.
- **Quality gates**: Changes must pass ultracite (lint), tsc (typecheck), knip (dependency check), i18n-check, and vitest (unit tests).

## Future Considerations

- Extending the logo to the sign-up page if consistency across auth pages is desired.
- Replacing the placeholder logo with an official Finesse brand asset when available.
- Broader rebranding of the application (AppConfig name, favicons, metadata) if Finesse becomes the product identity.
- Adding the logo to Clerk's internal form appearance via the Clerk appearance API for deeper brand integration.

## Open Questions / Risks

| # | Question / Risk | Impact |
|---|----------------|--------|
| 1 | No Finesse logo asset was provided or exists in the repo. What is the official logo? | A placeholder must be created; may need replacement later. |
| 2 | Does "Finesse" refer to a product name, company name, or app rebrand? | Affects whether broader rebranding (AppConfig, metadata) is eventually needed. |
| 3 | Should the logo also appear on the sign-up page? | The ticket says "logon page" (singular); MVP scopes to sign-in only. |
| 4 | What are the exact logo dimensions, colors, and design specifications? | Without brand guidelines, the placeholder may not match expectations. |
| 5 | Should the Clerk form's internal branding also be customized? | Out of scope for MVP; can be revisited. |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Understand ticket scope | Title "Finesse logo on logon page" with no attachments or additional details |
| `scout/scout-summary.md` | Review scout analysis of current state | Sign-in page has no branding; no Finesse assets exist; identified i18n and quality gate requirements |
| `scout/reference-map.json` | Structured list of relevant files, facts, and unknowns | Confirmed 13 relevant files; documented the asset gap and 6 unknowns |
| `diagnosis/diagnosis-statement.md` | Root cause analysis and success criteria | Feature addition, not a bug; logo above `<SignIn />` is the preferred minimal approach |
| `diagnosis/apl.json` | Diagnosis Q&A and follow-up assessment | Confirmed sign-in-only scope; established pattern (Sponsors.tsx) for image rendering; i18n alt-text required |
| `repo-guidance.json` | Repo intent classification | `next-js-boilerplate` is the sole target repo |
