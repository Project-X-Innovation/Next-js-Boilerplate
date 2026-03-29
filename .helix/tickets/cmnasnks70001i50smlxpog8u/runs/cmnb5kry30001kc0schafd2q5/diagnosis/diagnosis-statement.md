# Diagnosis Statement

## Problem Summary

The ticket requests a "changeable list of my favorite restaurants." No restaurant, favorite, or user-scoped list concept exists anywhere in the codebase. The only data-backed feature is a simple counter with a single DB table (`counter`) that has no user-scoping. This is a greenfield feature addition requiring a full vertical slice: database schema, migration, API routes, validation, UI components, i18n strings, and navigation integration.

## Root Cause Analysis

This is not a defect — it is a missing feature. The codebase has never included any concept of restaurants, favorites, or user-scoped lists. The "root cause" of the gap is that the feature was never implemented.

**Key design decisions derived from evidence:**

1. **Data model**: A new `favorite_restaurant` table in Drizzle ORM, scoped per user via a `userId` column storing the Clerk user ID string. Minimum columns: `id` (serial PK), `userId` (text, not null), `name` (text, not null), `updatedAt` (timestamp), `createdAt` (timestamp). No additional fields (address, cuisine, rating) are implied by the ticket.

2. **API layer**: New API route(s) under `src/app/[locale]/api/favorite-restaurants/` supporting:
   - `GET` — list favorites for the authenticated user
   - `POST` — add a restaurant to favorites
   - `DELETE` — remove a restaurant from favorites

   These follow the existing counter API pattern (Zod validation, NextResponse.json, status 422 for validation errors). Authentication is enforced via `currentUser()` in each handler.

3. **User scoping**: Server-side `currentUser()` from `@clerk/nextjs/server` provides the Clerk user ID. API routes must verify the user is authenticated and scope all queries to `userId`. The server list component also uses `currentUser()` to filter data.

4. **UI**: A new page at `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx` with:
   - A server component to display the current list (following `CurrentCount.tsx` pattern with `db.query`)
   - A client component form to add a new restaurant (following `CounterForm.tsx` pattern with react-hook-form + zodResolver)
   - Delete action per list item

5. **Navigation**: Add a nav link in `src/app/[locale]/(auth)/dashboard/layout.tsx` pointing to the new page.

6. **i18n**: New namespace keys in both `src/locales/en.json` and `src/locales/fr.json` for all user-visible strings in the favorites feature.

7. **Migration**: After schema changes, run `npm run db:generate` to produce a new migration file alongside the existing `0000_init-db.sql`.

**Disconfirming checks performed:**
- Searched for any existing restaurant, favorite, or list concept across the codebase — none found. The feature must be built from scratch.
- Checked if "changeable" could mean only reordering — unlikely given no list exists to reorder; "changeable" most naturally means the ability to add and remove items.
- Checked if the feature could be global rather than user-scoped — "my" strongly implies per-user, and the `(auth)` route group with Clerk integration confirms user identity is available.

## Evidence Summary

| Evidence | Finding |
|----------|---------|
| `src/models/Schema.ts` (lines 16-24) | Only `counterSchema` table exists; uses pgTable with serial PK and timestamps |
| `migrations/` directory | Single migration `0000_init-db.sql` for counter table; no other tables |
| `src/utils/DBConnection.ts` | Wildcard `import * as schema` — new schema exports auto-available without changes |
| `src/components/Hello.tsx` (lines 1, 7) | `currentUser()` from Clerk provides authenticated user identity server-side |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` (lines 20-38) | Dashboard nav has `dashboard_link` and `user_profile_link` via BaseTemplate leftNav; new link needed |
| `src/app/[locale]/api/counter/route.ts` | Reference API pattern: Zod safeParse, Drizzle insert, NextResponse.json, 422 for validation errors |
| `src/validations/CounterValidation.ts` | Reference Zod validation: simple `z.object()` with field constraints |
| `src/components/CounterForm.tsx` | Reference client form: `'use client'`, react-hook-form, zodResolver, fetch to API, router.refresh() |
| `src/components/CurrentCount.tsx` | Reference server component: async, `db.query.counterSchema.findFirst()`, `getTranslations` |
| `src/locales/en.json` | i18n namespace-based structure; needs new namespace for favorites feature |
| `AGENTS.md` | Coding standards: named exports, @/ imports, Tailwind v4, conventional commits, JSDoc |
| `package.json` (via scout) | Quality gates: lint, check:types, check:deps, check:i18n, test, db:generate, db:migrate |

## Success Criteria

1. A new `favorite_restaurant` database table exists in `src/models/Schema.ts` with user-scoping via Clerk user ID.
2. A generated Drizzle migration creates the table.
3. API routes support adding, listing, and removing favorite restaurants for the authenticated user.
4. Zod validation schema validates restaurant input data.
5. A new authenticated page at `(auth)/dashboard/favorite-restaurants/` displays the user's favorite restaurants list with add and remove functionality.
6. The dashboard navigation includes a link to the favorites page.
7. i18n strings are present in both `en.json` and `fr.json` for all user-visible strings.
8. All quality gates pass: lint, type-check, dependency check, i18n check.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Understand the feature request | Simple request for a changeable list of favorite restaurants; no detailed field specifications |
| `scout/reference-map.json` | Understand codebase state, patterns, and gaps | No restaurant/favorite concept exists; counter feature provides complete vertical-slice reference |
| `scout/scout-summary.md` | Cross-reference scout analysis and key unknowns | Confirmed stack (Next.js 16, Drizzle 0.45.1, Clerk 7.0.6, next-intl, Tailwind v4) and key boundaries |
| `src/models/Schema.ts` | Verify existing data model and table pattern | Only counter table; pgTable with serial PK and timestamps; new table follows same pattern |
| `src/utils/DBConnection.ts` | Verify schema auto-discovery mechanism | Wildcard import ensures new schema exports are automatically available |
| `src/app/[locale]/api/counter/route.ts` | Map API route implementation pattern | Zod safeParse → Drizzle operation → NextResponse.json; 422 for validation errors |
| `src/validations/CounterValidation.ts` | Map Zod validation pattern | Simple z.object() with field constraints, named export |
| `src/components/CounterForm.tsx` | Map client form component pattern | react-hook-form + zodResolver + fetch + router.refresh() |
| `src/components/CurrentCount.tsx` | Map server component data-reading pattern | db.query with Drizzle + getTranslations for i18n |
| `src/components/Hello.tsx` | Verify user identity access pattern | currentUser() from @clerk/nextjs/server provides authenticated user |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Verify navigation structure | BaseTemplate leftNav with Link components; add new nav entry |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Verify dashboard page pattern | DashboardPageProps, generateMetadata, setRequestLocale |
| `src/locales/en.json` | Map i18n namespace structure | Namespace per component/page with context-specific keys |
| `AGENTS.md` | Verify mandatory coding standards | Named exports, Zod type-only imports, Tailwind v4, conventional commits |
| `repo-guidance.json` | Check existing repo intent from prior run | Already set to target for next-js-boilerplate (single repo) |
