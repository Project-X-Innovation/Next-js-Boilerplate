# Implementation Actual: Changeable List of Favorite Restaurants

## Summary of Changes

Implemented a full vertical-slice feature for a user-scoped favorite restaurants list, following the existing counter feature pattern. The feature includes: a Drizzle ORM schema with migration, Zod validation schemas, an authenticated API route (GET/POST/DELETE), three UI components (form, server list, remove button), a new dashboard page, a navigation link, and i18n strings in both English and French locales.

## Files Changed

| File | Why Changed | Shared-Code/Review Hotspot |
|------|-------------|---------------------------|
| `src/models/Schema.ts` | Added `favoriteRestaurantSchema` table definition with 5 columns (id, userId, name, updatedAt, createdAt) | **Shared schema file** — auto-imported by `src/utils/DBConnection.ts` via wildcard import; affects all DB consumers |
| `migrations/0001_motionless_puma.sql` | Generated Drizzle migration for the new `favorite_restaurant` table | Database DDL — affects production DB state |
| `migrations/meta/0001_snapshot.json` | Auto-generated Drizzle migration metadata snapshot | |
| `migrations/meta/_journal.json` | Auto-updated Drizzle migration journal | |
| `src/validations/FavoriteRestaurantValidation.ts` | New file: Zod schemas for add (name: string min 1 max 255) and remove (id: positive int) validation | |
| `src/locales/en.json` | Added i18n strings: `DashboardLayout.favorite_restaurants_link` + 4 new namespaces (FavoriteRestaurantsPage, FavoriteRestaurantForm, FavoriteRestaurantList, RemoveFavoriteButton) | **Shared i18n file** — affects all localized UI |
| `src/locales/fr.json` | Added corresponding French translations for all new keys | **Shared i18n file** — affects all localized UI |
| `src/app/[locale]/api/favorite-restaurants/route.ts` | New file: API route with GET, POST, DELETE handlers. Auth via `auth()`, Zod validation, Drizzle queries. DELETE uses compound WHERE (id + userId) for cross-user safety. | **Public API surface** — security-critical auth check |
| `src/components/RemoveFavoriteButton.tsx` | New file: Client component for per-item delete button. Calls DELETE API then router.refresh(). | |
| `src/components/FavoriteRestaurantForm.tsx` | New file: Client component with react-hook-form + zodResolver for adding restaurants. Calls POST API then resets form and router.refresh(). | |
| `src/components/FavoriteRestaurantList.tsx` | New file: Async server component that reads user's favorites via Drizzle and renders list with RemoveFavoriteButton per item. Shows empty state when no favorites. | |
| `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx` | New file: Dashboard sub-page composing FavoriteRestaurantForm and FavoriteRestaurantList. Has generateMetadata. | |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Added third nav link ("Favorite restaurants") to dashboard leftNav | **Shared layout** — affects all dashboard pages' navigation |

## Steps Executed

| Plan Step | Goal | Status | Notes |
|-----------|------|--------|-------|
| 1 | Define database schema | Done | Added `favoriteRestaurantSchema` to Schema.ts with text import |
| 2 | Generate database migration | Done | `npm run db:generate` produced `0001_motionless_puma.sql` |
| 3 | Create Zod validation schemas | Done | `FavoriteRestaurantValidation.ts` with two named exports |
| 4 | Add i18n strings | Done | Both en.json and fr.json updated with 5 new keys/namespaces |
| 5 | Create API route | Done | GET/POST/DELETE with auth, validation, Drizzle operations |
| 6 | Create RemoveFavoriteButton | Done | Client component with DELETE fetch + router.refresh() |
| 7 | Create FavoriteRestaurantForm | Done | Client component with react-hook-form + zodResolver |
| 8 | Create FavoriteRestaurantList | Done | Async server component with DB query + empty state |
| 9 | Create favorites page | Done | Dashboard sub-page with generateMetadata |
| 10 | Add dashboard navigation link | Done | Third link in leftNav section |

## Verification Commands Run + Outcomes

| Command | Exit Code | Outcome |
|---------|-----------|---------|
| `npm run db:generate` | 0 | Migration `0001_motionless_puma.sql` generated with correct DDL |
| `npm run check:i18n` | 0 | "No missing keys found! No unused keys found!" |
| `npm run lint` (ultracite check) | 1 | 0 errors in new files. 13 pre-existing TS2307 image import errors in Sponsors.tsx and marketing pages (not touched by this PR) |
| `npm run check:types` | 2 | Same 13 pre-existing image import TS2307 errors. No errors in new files. |
| `npm run check:deps` | 0 | Clean — no unused or missing dependencies |
| `npm run test` | 1 | 2/2 unit tests passed. Unhandled error from missing Playwright browser binary — pre-existing env issue |
| `npm run build-local` | 0 | Build successful. New routes visible: `/[locale]/api/favorite-restaurants` and `/[locale]/dashboard/favorite-restaurants` |

## Test/Build Results

- **Unit tests**: 2/2 passed (src/utils/Helpers.test.ts). No tests broken.
- **Build**: Production build completed successfully in ~9.4s compile + ~4.2s TypeScript + ~441ms static pages. Both new routes appear in build output.
- **Migration**: DDL verified — `CREATE TABLE "favorite_restaurant"` with all 5 columns and correct types/constraints.

## Deviations from Plan

1. **JSDoc expanded**: The plan specified "Add JSDoc" but the linter requires `@param` and `@returns` tags. Added these to all new functions to satisfy the lint rules.
2. **Non-null assertion replaced**: Plan suggested `userId!` in FavoriteRestaurantList. Changed to `userId ?? ''` to satisfy the `no-non-null-assertion` lint rule. This is safe because the component runs inside the `(auth)` route group where `userId` is always present.
3. **Formatting auto-fixed**: The ultracite formatter adjusted import ordering and trailing comma formatting in 3 files. No semantic changes.

## Known Limitations / Follow-ups

- **Browser verification blocked**: No dev setup config with Clerk credentials was provided, so runtime API testing and browser interaction testing (CHK-06, CHK-07) could not be performed.
- **Pre-existing lint errors**: 13 TS2307 image import errors exist in files not touched by this PR (Sponsors.tsx, about/page.tsx, counter/page.tsx, portfolio pages). These are outside scope.
- **Pre-existing test infra issue**: Playwright browser binary not installed, causing an unhandled error in vitest. This is a pre-existing environment gap.

## Verification Plan Results

| Required Check ID | Outcome | Evidence / Notes |
|-------------------|---------|------------------|
| CHK-01 | Partial pass | `check:i18n` passes (exit 0). `check:deps` passes (exit 0). `lint` and `check:types` show 0 errors in new files but 13 pre-existing TS2307 image import errors in untouched files (Sponsors.tsx, marketing pages). New code is clean. |
| CHK-02 | Pass | `migrations/0001_motionless_puma.sql` contains `CREATE TABLE "favorite_restaurant"` with columns: id (serial PK NOT NULL), user_id (text NOT NULL), name (text NOT NULL), updated_at (timestamp DEFAULT now() NOT NULL), created_at (timestamp DEFAULT now() NOT NULL). |
| CHK-03 | Pass | `src/models/Schema.ts` exports `favoriteRestaurantSchema` via `pgTable('favorite_restaurant', {...})` with 5 columns matching the counterSchema timestamp pattern exactly. |
| CHK-04 | Partial pass | 2/2 unit tests pass. Vitest exit code 1 due to pre-existing Playwright browser binary missing — unrelated to changes. |
| CHK-05 | Pass | `npm run build-local` completes with exit 0. Build output lists both `ƒ /[locale]/api/favorite-restaurants` and `ƒ /[locale]/dashboard/favorite-restaurants`. |
| CHK-06 | Blocked | Dev server requires Clerk environment variables (CLERK_SECRET_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) not present in dev setup config. Cannot send authenticated HTTP requests to test API endpoints at runtime. |
| CHK-07 | Blocked | Browser verification requires Clerk credentials to sign in and test the favorites page UI workflow. No dev setup config provides login credentials. |

Self-verification is **partially complete**: CHK-02, CHK-03, CHK-05 pass. CHK-01 and CHK-04 pass for new code (pre-existing errors in untouched files). CHK-06 and CHK-07 are blocked by missing Clerk environment configuration.

## APL Statement Reference

Implementation of the changeable favorite restaurants list feature is complete. All 10 plan steps executed. Quality gates pass for new code. Production build succeeds. Browser/API runtime verification is blocked by missing Clerk environment variables.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Defined feature scope | "Have a changeable list of my favorite restaurants" — add/view/remove |
| `implementation-plan/implementation-plan.md` | Step-by-step implementation guide | 10 steps: schema, migration, validation, i18n, API route, 3 components, page, nav link |
| `diagnosis/diagnosis-statement.md` | Root-cause and design decisions | Greenfield feature; favoriteRestaurantSchema with userId text; 3 API methods |
| `product/product.md` | Product requirements and scope | MVP: add/view/remove; duplicates allowed; no edit, no rich data |
| `repo-guidance.json` | Repo intent classification | Single target repo: next-js-boilerplate |
| `src/models/Schema.ts` | Reference for schema column pattern | counterSchema: serial PK, timestamps with mode:'date', $onUpdate, defaultNow, notNull |
| `src/app/[locale]/api/counter/route.ts` | Reference for API route pattern | Zod safeParse, z.treeifyError for 422, Drizzle insert with returning |
| `src/validations/CounterValidation.ts` | Reference for validation pattern | `import * as z from 'zod'`; z.object() named export |
| `src/components/CounterForm.tsx` | Reference for client form pattern | 'use client', zodResolver, useForm, fetch to API, router.refresh() |
| `src/components/CurrentCount.tsx` | Reference for server component pattern | Async, db.query, getTranslations, eq from drizzle-orm |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Navigation structure reference | BaseTemplate leftNav with Link items; added third link |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Page pattern reference | DashboardPageProps type, generateMetadata, setRequestLocale |
| `src/locales/en.json` | i18n namespace structure reference | Namespace-based keys per component/page |
| `src/locales/fr.json` | French translation structure reference | Mirror structure with French translations |
| `AGENTS.md` | Mandatory coding standards | Named exports, @/ imports, Tailwind v4, sentence case i18n, JSDoc |
| `package.json` | Scripts and dependency verification | Quality gate commands, confirmed all needed deps present |
| `drizzle.config.ts` | Migration config | Schema at ./src/models/Schema.ts, output at ./migrations |
