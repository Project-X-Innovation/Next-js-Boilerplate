# Product: Changeable List of Favorite Restaurants

## Problem Statement

Users have no way to maintain a personal list of favorite restaurants. The application currently lacks any restaurant, favorites, or user-scoped list functionality. The only existing data feature is a simple global counter with no user ownership.

## Product Vision

Give each authenticated user a personal, editable list of their favorite restaurants — accessible from the dashboard — so they can track and manage the places they enjoy.

## Users

- **Authenticated users**: Any user who has signed in via Clerk. The feature is behind the auth boundary and each user sees only their own list.

## Use Cases

1. **View favorites**: A user navigates to the favorites page and sees their current list of favorite restaurants.
2. **Add a restaurant**: A user types a restaurant name and adds it to their list.
3. **Remove a restaurant**: A user removes a restaurant they no longer want on their list.

## Core Workflow

1. User signs in and navigates to the favorites page via a new dashboard nav link.
2. The page displays the user's current list of favorite restaurants (empty state on first visit).
3. User enters a restaurant name in a form and submits to add it.
4. The new restaurant appears in the list.
5. User clicks a remove action on any list item to delete it.
6. The list updates to reflect the removal.

## Essential Features (MVP)

- **User-scoped list**: Each user has their own list, isolated from other users.
- **Add restaurant**: A form to add a restaurant by name.
- **View list**: Display all of the user's favorite restaurants.
- **Remove restaurant**: Delete an individual restaurant from the list.
- **Dashboard navigation**: A link in the dashboard sidebar to reach the favorites page.
- **Internationalization**: All user-visible strings available in both English and French.

## Features Explicitly Out of Scope (MVP)

- **Edit/rename restaurant entries**: The ticket says "changeable list" (add/remove), not "editable entries." Update of individual entries is deferred.
- **Rich restaurant data**: Fields beyond name (address, cuisine, rating, phone, URL, notes) are not implied by the ticket.
- **Restaurant catalog / search**: Users enter free-form names; there is no predefined restaurant directory.
- **List reordering / sorting**: No drag-and-drop or custom sort order.
- **Sharing / public lists**: Lists are private to each user.
- **Pagination / infinite scroll**: Defer until list size becomes a concern.
- **Offline support**: Standard online-only behavior.

## Success Criteria

1. An authenticated user can add a restaurant by name to their personal favorites list.
2. An authenticated user can view all restaurants on their favorites list.
3. An authenticated user can remove any restaurant from their favorites list.
4. Each user's list is isolated — users cannot see or modify another user's list.
5. A dashboard navigation link leads to the favorites page.
6. All user-facing text is internationalized (en + fr).
7. All existing quality gates pass (lint, type-check, dependency check, i18n completeness check).

## Key Design Principles

- **Follow existing patterns**: The counter feature provides a proven vertical-slice pattern (schema, API, validation, form, display, i18n, tests). The favorites feature should mirror it.
- **Minimal data model**: A restaurant entry needs only a name and a user association. Start simple.
- **User-scoped by default**: Every query and mutation must be filtered to the authenticated user's ID.

## Scope & Constraints

- Single repository (`next-js-boilerplate`) contains all layers (DB, API, UI, i18n, tests).
- Must stay within the existing tech stack: Drizzle ORM + PostgreSQL, Clerk auth, next-intl, react-hook-form + Zod, Tailwind CSS v4.
- Must satisfy all pre-existing quality gates (lint, type-check, dep-check, i18n-check, tests).
- Feature must live within the `(auth)` route group to ensure authentication.

## Future Considerations

- Editing restaurant names or adding richer metadata (address, cuisine, rating).
- Ordering / reordering list items.
- Pagination or virtual scrolling for large lists.
- Search or autocomplete against an external restaurant API.

## Open Questions / Risks

| # | Question / Risk | Impact |
|---|----------------|--------|
| 1 | Does "changeable" imply edit-in-place on entries, or just add/remove? Product interpretation: add/remove only for MVP. | Could expand scope if edit is required. |
| 2 | How should the Clerk user ID be stored in the DB? No existing user-scoped data pattern to reference. | Technical design decision — not a product blocker. |
| 3 | Should there be a cap on the number of favorites per user? | Unbounded lists could grow large; defer unless performance issue arises. |
| 4 | Are there any uniqueness constraints (e.g., same restaurant name twice)? | Product assumption: allow duplicates for MVP simplicity. |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Understand the feature request | Simple request: "changeable list of my favorite restaurants" with no elaboration |
| `scout/scout-summary.md` | Understand current codebase state and patterns | No restaurant/favorite concept exists; counter feature is the reference pattern; stack is Next.js 16 + Drizzle + Clerk + next-intl |
| `scout/reference-map.json` | Detailed file-level mapping and unknowns | Identified all files needing changes; confirmed wildcard schema import auto-discovers new tables; listed 7 key unknowns |
| `diagnosis/diagnosis-statement.md` | Root-cause analysis and design decisions | Confirmed greenfield feature; proposed data model, API routes, UI location, and success criteria |
| `diagnosis/apl.json` | Structured diagnosis questions and answers | Validated minimal CRUD scope (add/view/remove), user-scoping via Clerk, and dashboard placement |
| `repo-guidance.json` | Repo intent classification | Single repo (`next-js-boilerplate`) is the target for all changes |
