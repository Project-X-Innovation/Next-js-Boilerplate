# Diagnosis Statement

## Problem Summary

The ticket requests a "changeable list of my favorite restaurants." No restaurant, favorite, or user-scoped list concept exists anywhere in the codebase. The only data-backed feature is a simple counter with a single DB table (`counter`) that has no user-scoping. This is a greenfield feature addition requiring a full vertical slice: database schema, migration, API routes, validation, UI components, i18n strings, and tests.

## Root Cause Analysis

This is not a defect — it is a missing feature. The codebase has never included any concept of restaurants, favorites, or user-scoped lists. The "root cause" of the gap is that the feature was never implemented.

**Key design decisions required:**

1. **Data model**: A new `favorite_restaurants` table in Drizzle ORM, scoped per user via a `userId` column storing the Clerk user ID string. Minimum columns: `id` (serial PK), `userId` (text, not null), `name` (text, not null), `updatedAt`, `createdAt`. No additional fields (address, cuisine, etc.) are implied by the ticket.

2. **API layer**: New API route(s) under `src/app/[locale]/api/favorite-restaurants/` supporting:
   - `GET` — list favorites for the authenticated user
   - `POST` — add a restaurant to favorites
   - `DELETE` — remove a restaurant from favorites

   These follow the existing counter API pattern (Zod validation, NextResponse.json, status 422 for validation errors).

3. **User scoping**: Server-side `currentUser()` from `@clerk/nextjs/server` provides the Clerk user ID. API routes must verify the user is authenticated and scope all queries to `userId`.

4. **UI**: A new page at `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx` with:
   - A server component to display the current list (following `CurrentCount.tsx` pattern)
   - A client component form to add a new restaurant (following `CounterForm.tsx` pattern)
   - Delete buttons/actions per list item

5. **Navigation**: Add a nav link in `src/app/[locale]/(auth)/dashboard/layout.tsx` pointing to the new page.

6. **i18n**: New namespace keys in both `src/locales/en.json` and `src/locales/fr.json` for the favorites feature.

7. **Migration**: Run `npm run db:generate` after schema changes to produce a new migration file.

**Disconfirming check**: Searched for any existing restaurant, favorite, or list concept — none found. The feature must be built from scratch.

## Evidence Summary

| Evidence | Finding |
|----------|---------|
| `src/models/Schema.ts` (lines 16-24) | Only `counterSchema` table exists; no user-scoping columns |
| `migrations/0000_init-db.sql` | Single `counter` table creation; no other tables |
| `migrations/meta/_journal.json` | One migration entry at index 0 |
| `src/utils/DBConnection.ts` (line 5) | Wildcard `import * as schema` — new schema exports auto-available |
| `src/components/Hello.tsx` (line 1, 7) | `currentUser()` from Clerk provides authenticated user identity |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` (lines 22-37) | Dashboard nav has `dashboard_link` and `user_profile_link`; new link needed |
| `src/app/[locale]/api/counter/route.ts` | Reference API pattern: Zod validation, Drizzle upsert, NextResponse.json |
| `src/validations/CounterValidation.ts` | Reference Zod validation: `z.object(...)` pattern |
| `src/components/CounterForm.tsx` | Reference client form: `'use client'`, react-hook-form, zodResolver, fetch, router.refresh() |
| `src/components/CurrentCount.tsx` | Reference server component: `db.query`, `getTranslations`, `headers` |
| `src/locales/en.json` | i18n namespace structure; needs new keys for favorites feature |
| `tests/integration/Counter.spec.ts` | Reference test pattern: Playwright API tests with status/JSON assertions |
| `AGENTS.md` | Coding standards: named exports, @/ imports, Tailwind v4, conventional commits |
| `package.json` | Quality gates: lint, check:types, check:deps, check:i18n, test |

## Success Criteria

1. A new `favorite_restaurants` database table exists with user-scoping via Clerk user ID.
2. A generated Drizzle migration creates the table.
3. API routes support adding, listing, and removing favorite restaurants for the authenticated user.
4. A new authenticated page displays the user's favorite restaurants list with add and remove functionality.
5. The dashboard navigation includes a link to the favorites page.
6. i18n strings are present in both `en.json` and `fr.json`.
7. All quality gates pass: lint, type-check, dependency check, i18n check.
8. Integration tests cover the API routes (valid add, valid remove, validation errors).

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Understand the feature request | Simple request for a changeable list of favorite restaurants; no detailed specifications |
| `scout/reference-map.json` | Understand current codebase state and patterns | No restaurant/favorite concept exists; counter feature provides complete reference pattern |
| `scout/scout-summary.md` | Cross-reference scout analysis | Confirmed stack (Next.js 16, Drizzle, Clerk, next-intl) and identified key boundaries |
| `src/models/Schema.ts` | Verify existing data model | Only counter table; no user-scoping; Drizzle pgTable pattern confirmed |
| `src/utils/DBConnection.ts` | Verify schema auto-discovery | Wildcard import ensures new schema exports are automatically available |
| `src/app/[locale]/api/counter/route.ts` | Map API route pattern | PUT with Zod safeParse, Drizzle insert, NextResponse.json — pattern to follow for CRUD |
| `src/validations/CounterValidation.ts` | Map validation pattern | Simple z.object() with field constraints |
| `src/components/CounterForm.tsx` | Map client form pattern | react-hook-form + zodResolver + fetch + router.refresh() |
| `src/components/CurrentCount.tsx` | Map server component read pattern | db.query + getTranslations for data display |
| `src/components/Hello.tsx` | Verify user identity access | currentUser() from Clerk provides authenticated user server-side |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Verify navigation structure | BaseTemplate leftNav with Link components; add new entry here |
| `src/locales/en.json` | Map i18n namespace structure | Namespace-based keys; need new FavoriteRestaurants namespace |
| `tests/integration/Counter.spec.ts` | Map integration test pattern | Playwright with page.request, status/JSON assertions |
| `AGENTS.md` | Verify coding standards | Named exports, Zod type-only imports, Tailwind v4, conventional commits |
| `package.json` | Verify dependencies and scripts | All required libs present; quality gate scripts confirmed |
| `drizzle.config.ts` | Verify migration config | Schema at ./src/models/Schema.ts, output at ./migrations |
| `migrations/meta/_journal.json` | Verify migration state | One existing migration; new one will be appended |
