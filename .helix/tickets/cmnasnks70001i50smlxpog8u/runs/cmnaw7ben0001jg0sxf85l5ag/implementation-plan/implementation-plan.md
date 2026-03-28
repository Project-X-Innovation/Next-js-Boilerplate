# Implementation Plan: Changeable List of Favorite Restaurants

## Overview

Add a user-scoped "favorite restaurants" feature to the authenticated dashboard area. The implementation follows the existing counter feature vertical-slice pattern: Drizzle schema, migration, API route, Zod validation, server component (list display), client component (form + delete), i18n strings, navigation link, and integration tests. No new dependencies are needed.

## Implementation Principles

- **Follow existing patterns**: Mirror the counter feature (schema, API route, validation, form, server component, i18n, tests) exactly.
- **Minimal data model**: One table, one text field (name) + user scoping via Clerk userId.
- **User-scoped by default**: Every DB query is filtered to the authenticated user's Clerk ID.
- **Named exports only**: Per AGENTS.md, except for the Next.js page component.
- **No new dependencies**: The existing stack covers all needs.

## Implementation Steps Summary

| Step | Goal | Deliverable |
|------|------|-------------|
| 1 | Define database schema | `src/models/Schema.ts` updated with `favoriteRestaurantsSchema` |
| 2 | Generate database migration | New migration file in `migrations/` |
| 3 | Create Zod validation schemas | `src/validations/FavoriteRestaurantValidation.ts` |
| 4 | Create API route (GET/POST/DELETE) | `src/app/[locale]/api/favorite-restaurants/route.ts` |
| 5 | Create server component for list display | `src/components/FavoriteRestaurantList.tsx` |
| 6 | Create client component for add form + delete | `src/components/FavoriteRestaurantForm.tsx` |
| 7 | Create favorites page | `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx` |
| 8 | Add navigation link in dashboard layout | `src/app/[locale]/(auth)/dashboard/layout.tsx` updated |
| 9 | Add i18n strings (en + fr) | `src/locales/en.json` and `src/locales/fr.json` updated |
| 10 | Create integration tests | `tests/integration/FavoriteRestaurant.spec.ts` |
| 11 | Run quality gates and fix issues | All gates pass: lint, type-check, dep-check, i18n-check, build |

## Detailed Implementation Steps

### Step 1: Define Database Schema

**Goal**: Add a `favoriteRestaurantsSchema` table to the Drizzle schema file.

**What to Build**:
- Edit `src/models/Schema.ts` to add a new `pgTable` export named `favoriteRestaurantsSchema`.
- Add import of `text` from `drizzle-orm/pg-core` (alongside existing `integer`, `pgTable`, `serial`, `timestamp`).
- Table name: `favorite_restaurants`.
- Columns:
  - `id`: `serial('id').primaryKey()` — row identifier
  - `userId`: `text('user_id').notNull()` — Clerk user ID string for scoping
  - `name`: `text('name').notNull()` — restaurant name (free-form)
  - `updatedAt`: `timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()).notNull()` — follows counterSchema pattern exactly
  - `createdAt`: `timestamp('created_at', { mode: 'date' }).defaultNow().notNull()` — follows counterSchema pattern exactly
- No unique constraint on `(userId, name)` — duplicates are allowed per product spec.
- No foreign key — Clerk manages users externally.

**Verification (AI Agent Runs)**:
- `bun run check:types` — confirms the new schema export type-checks.
- Visually confirm the new export follows the `counterSchema` pattern in the same file.

**Success Criteria**:
- `favoriteRestaurantsSchema` is exported from `src/models/Schema.ts` with all 5 columns.
- TypeScript compilation succeeds.
- The wildcard `import * as schema` in `src/utils/DBConnection.ts` will automatically pick up the new export (no changes needed there).

---

### Step 2: Generate Database Migration

**Goal**: Produce a Drizzle migration SQL file for the new table.

**What to Build**:
- Run `bun run db:generate` to generate a new migration in `migrations/`.
- This produces a new `.sql` file (e.g., `0001_*.sql`) with `CREATE TABLE favorite_restaurants`.
- The migration journal (`migrations/meta/_journal.json`) will get a new entry at index 1.

**Verification (AI Agent Runs)**:
- Confirm a new migration SQL file exists in `migrations/` containing `CREATE TABLE "favorite_restaurants"`.
- Confirm the migration journal has a new entry.

**Success Criteria**:
- A migration file exists that creates the `favorite_restaurants` table with columns `id`, `user_id`, `name`, `updated_at`, `created_at`.
- Migration journal updated.

---

### Step 3: Create Zod Validation Schemas

**Goal**: Define validation schemas for the add and delete API operations.

**What to Build**:
- Create `src/validations/FavoriteRestaurantValidation.ts`.
- Follow the `CounterValidation.ts` pattern: `import * as z from 'zod'`, named exports.
- Export `AddFavoriteRestaurantValidation`: `z.object({ name: z.string().min(1).max(255) })` — non-empty name with max length.
- Export `DeleteFavoriteRestaurantValidation`: `z.object({ id: z.number().int().positive() })` — positive integer ID.

**Verification (AI Agent Runs)**:
- `bun run check:types` — confirms types are valid.
- `bun run check:deps` — confirms exports are not flagged as unused (they will be imported in step 4).

**Success Criteria**:
- Two named validation exports in `src/validations/FavoriteRestaurantValidation.ts`.
- Both use `z.object()` with appropriate constraints.

---

### Step 4: Create API Route (GET/POST/DELETE)

**Goal**: Implement CRUD API endpoints for favorite restaurants behind Clerk auth.

**What to Build**:
- Create `src/app/[locale]/api/favorite-restaurants/route.ts`.
- Import `auth` from `@clerk/nextjs/server`, `db` from `@/libs/DB`, `favoriteRestaurantsSchema` from `@/models/Schema`, validation schemas, `eq`, `and` from `drizzle-orm`, `NextResponse` from `next/server`, `z` from `zod`.
- **GET handler**:
  - Call `const { userId } = await auth()`.
  - If no userId, return 401.
  - Query `db.select().from(favoriteRestaurantsSchema).where(eq(favoriteRestaurantsSchema.userId, userId))`.
  - Return `NextResponse.json({ favorites: [...] })`.
- **POST handler**:
  - Call `const { userId } = await auth()`.
  - If no userId, return 401.
  - Parse body with `AddFavoriteRestaurantValidation.safeParse(json)`.
  - On validation failure, return `NextResponse.json(z.treeifyError(parse.error), { status: 422 })` (follows counter pattern).
  - Insert: `db.insert(favoriteRestaurantsSchema).values({ userId, name: parse.data.name }).returning()`.
  - Return `NextResponse.json({ favorite: result[0] })`.
- **DELETE handler**:
  - Call `const { userId } = await auth()`.
  - If no userId, return 401.
  - Parse body with `DeleteFavoriteRestaurantValidation.safeParse(json)`.
  - On validation failure, return 422.
  - Delete: `db.delete(favoriteRestaurantsSchema).where(and(eq(favoriteRestaurantsSchema.id, parse.data.id), eq(favoriteRestaurantsSchema.userId, userId))).returning()`.
  - Return `NextResponse.json({ favorite: result[0] })`.
- **Critical**: DELETE must always scope by BOTH `id` AND `userId` to prevent cross-user deletion.

**Verification (AI Agent Runs)**:
- `bun run check:types` — type-checks the new route.
- `bun run lint` — passes lint.

**Success Criteria**:
- Three exported handlers (GET, POST, DELETE) with auth checks and userId scoping.
- Validation errors return 422 with treeified Zod errors.
- Unauthenticated requests return 401.

---

### Step 5: Create Server Component for List Display

**Goal**: Display the user's favorite restaurants list with delete functionality.

**What to Build**:
- Create `src/components/FavoriteRestaurantList.tsx`.
- Server component (no `'use client'` directive).
- Import `auth` from `@clerk/nextjs/server`, `db` from `@/libs/DB`, `eq` from `drizzle-orm`, `getTranslations` from `next-intl/server`, `favoriteRestaurantsSchema` from `@/models/Schema`.
- Get userId via `const { userId } = await auth()`.
- Query favorites: `db.select().from(favoriteRestaurantsSchema).where(eq(favoriteRestaurantsSchema.userId, userId!))`.
- Use `getTranslations('FavoriteRestaurantList')` for i18n.
- Render:
  - If no favorites, show an empty-state message using an i18n key.
  - If favorites exist, render a list (`<ul>`) with each item showing the restaurant name and a delete button.
  - The delete button needs client interactivity, so the list items with delete actions should delegate to a client component (the `FavoriteRestaurantForm` from Step 6 will handle both add and delete).
- **Alternative approach**: Pass the favorites data as props to the client component, which handles both add form and delete actions. This keeps the server component minimal (data fetching only) and the client component handles all interactivity. Only serialize `id` and `name` to the client (server-serialization best practice).

**Verification (AI Agent Runs)**:
- `bun run check:types` — type-checks.

**Success Criteria**:
- Named export `FavoriteRestaurantList` async server component.
- Reads favorites from DB scoped to authenticated user.
- Passes minimal data (id, name array) to client for rendering.

---

### Step 6: Create Client Component for Add Form + Delete Actions

**Goal**: Client component for adding restaurants and deleting from the list.

**What to Build**:
- Create `src/components/FavoriteRestaurantForm.tsx`.
- `'use client'` directive.
- Follow `CounterForm.tsx` pattern: `useForm` with `zodResolver`, `useTranslations`, `useRouter` from `@/libs/I18nNavigation`.
- **Props**: Accept `favorites` as `Array<{ id: number; name: string }>` for rendering the current list.
- **Add form**:
  - `useForm` with `zodResolver(AddFavoriteRestaurantValidation)`, default `{ name: '' }`.
  - On submit: `fetch('/api/favorite-restaurants', { method: 'POST', body: JSON.stringify(formData) })`.
  - On success: `form.reset()` then `router.refresh()`.
- **List rendering**:
  - Render each favorite as a list item with the restaurant name and a delete button.
  - Delete handler: `fetch('/api/favorite-restaurants', { method: 'DELETE', body: JSON.stringify({ id }) })` then `router.refresh()`.
- **Empty state**: If `favorites` is empty, show an i18n message.
- Use `useTranslations('FavoriteRestaurantForm')` for all user-visible strings.
- Styling: Tailwind v4 utility classes matching the existing design language (similar to CounterForm).

**Verification (AI Agent Runs)**:
- `bun run check:types` — type-checks.
- `bun run lint` — passes lint.

**Success Criteria**:
- Named export `FavoriteRestaurantForm` client component.
- Add form with validation, API fetch, reset, and refresh.
- Delete buttons per list item with API fetch and refresh.
- Empty state message.
- All strings from i18n, no hardcoded text.

---

### Step 7: Create Favorites Page

**Goal**: Create the page that composes the server and client components.

**What to Build**:
- Create `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx`.
- Follow `src/app/[locale]/(auth)/dashboard/page.tsx` pattern.
- Default export `FavoriteRestaurantsPage` (pages get default export per Next.js convention).
- Props: `{ params: Promise<{ locale: string }> }`.
- `await props.params` → `setRequestLocale(locale)`.
- Render `FavoriteRestaurantList` (server component that internally renders `FavoriteRestaurantForm`).
- **No `generateMetadata`** — per AGENTS.md, dashboard pages define meta once in layout, not in each page. The existing dashboard layout already handles this convention.

**Verification (AI Agent Runs)**:
- `bun run check:types` — type-checks.

**Success Criteria**:
- Page accessible at `/[locale]/dashboard/favorite-restaurants/`.
- Composes server component for data + client component for interactivity.
- Follows existing dashboard page pattern.

---

### Step 8: Add Navigation Link in Dashboard Layout

**Goal**: Add a "Favorite restaurants" link in the dashboard sidebar navigation.

**What to Build**:
- Edit `src/app/[locale]/(auth)/dashboard/layout.tsx`.
- Add a new `<li>` entry in the `leftNav` section, between the dashboard link and user profile link (or after the dashboard link).
- Use `<Link href="/dashboard/favorite-restaurants/">` with i18n key `{t('favorite_restaurants_link')}`.
- Styling: Same `className="border-none text-gray-700 hover:text-gray-900"` as existing links.

**Verification (AI Agent Runs)**:
- `bun run check:types` — type-checks.

**Success Criteria**:
- New nav link visible in dashboard sidebar.
- Links to `/dashboard/favorite-restaurants/`.
- Uses i18n key from `DashboardLayout` namespace.

---

### Step 9: Add i18n Strings (en + fr)

**Goal**: Add all feature-related i18n keys to both locale files.

**What to Build**:
- Edit `src/locales/en.json` — add keys:
  - `"DashboardLayout"` section: add `"favorite_restaurants_link": "Favorite restaurants"`
  - New `"FavoriteRestaurantList"` namespace: `{ "empty_state": "You have no favorite restaurants yet." }`
  - New `"FavoriteRestaurantForm"` namespace: `{ "label_name": "Restaurant name", "button_add": "Add", "button_delete": "Delete", "error_name_required": "Name is required" }`
- Edit `src/locales/fr.json` — add corresponding French translations:
  - `"DashboardLayout"` section: add `"favorite_restaurants_link": "Restaurants favoris"`
  - New `"FavoriteRestaurantList"` namespace: `{ "empty_state": "Vous n'avez pas encore de restaurants favoris." }`
  - New `"FavoriteRestaurantForm"` namespace: `{ "label_name": "Nom du restaurant", "button_add": "Ajouter", "button_delete": "Supprimer", "error_name_required": "Le nom est requis" }`

**Verification (AI Agent Runs)**:
- `bun run check:i18n` — confirms all keys are present in both locales and none are unused.

**Success Criteria**:
- All new i18n keys present in both `en.json` and `fr.json`.
- i18n completeness check passes.
- Keys follow sentence case convention per AGENTS.md.

---

### Step 10: Create Integration Tests

**Goal**: Test API routes via Playwright integration tests.

**What to Build**:
- Create `tests/integration/FavoriteRestaurant.spec.ts`.
- Follow `Counter.spec.ts` pattern: `test.describe` with `page.request` API calls.
- Test cases:
  1. **POST with invalid body returns 422**: POST with `{ name: '' }` (empty name) → expect status 422.
  2. **POST with missing name returns 422**: POST with `{}` → expect status 422.
  3. **DELETE with invalid id returns 422**: DELETE with `{ id: 'abc' }` → expect status 422.
  4. **DELETE with negative id returns 422**: DELETE with `{ id: -1 }` → expect status 422.
- **Note on auth-dependent tests**: The counter tests work without auth because the counter route is public. The favorite restaurants routes require Clerk auth (`auth()` check). Tests for authenticated CRUD operations (successful add, list, delete) would require Clerk test tokens or middleware bypass, which is outside the scope of this MVP. The validation error tests (422) may also return 401 if the auth check runs before validation. If so, these tests should assert 401 for unauthenticated requests, which still validates the auth boundary.
- Structure: top-level `describe('Favorite restaurants')` with nested `describe('Validation')` or `describe('Auth boundary')`.

**Verification (AI Agent Runs)**:
- `bun run test:e2e` — integration tests pass.

**Success Criteria**:
- Integration test file covers validation error cases and/or auth boundary.
- Tests follow the existing naming conventions from AGENTS.md.
- All tests pass when run with `bun run test:e2e`.

---

### Step 11: Run Quality Gates and Fix Issues

**Goal**: Ensure all quality gates pass with the complete implementation.

**What to Build**:
- No new code; fix any issues surfaced by quality gates.
- Run all gates in sequence and address failures:
  1. `bun run lint` — fix lint/format issues (ultracite).
  2. `bun run check:types` — fix TypeScript errors.
  3. `bun run check:deps` — fix unused dependency/export warnings (knip).
  4. `bun run check:i18n` — fix missing/unused i18n keys.
  5. `bun run build-local` — confirm production build succeeds.
  6. `bun run test` — confirm Vitest unit tests still pass.
  7. `bun run test:e2e` — confirm Playwright integration/e2e tests pass.

**Verification (AI Agent Runs)**:
- All commands above exit with code 0.

**Success Criteria**:
- Zero lint errors.
- Zero type errors.
- Zero unused dependency warnings related to new code.
- i18n completeness check passes.
- Build completes successfully.
- All existing and new tests pass.

---

## Verification Plan

### Pre-conditions

| Dependency | Status | Source/Evidence | Affects checks |
|------------|--------|-----------------|----------------|
| Node.js >= 20 | available | `package.json` engines field | CHK-01 through CHK-07 |
| `bun` runtime | available | Scripts reference `bun run` | CHK-01 through CHK-07 |
| Dependencies installed (`bun install`) | available | Must run before any command | CHK-01 through CHK-07 |
| PGlite (in-memory dev DB) | available | `db-server:memory` script uses `pglite-server`; no external DB needed | CHK-05, CHK-06, CHK-07 |
| Clerk environment variables (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) | unknown | Required for auth in dev server; `src/libs/Env.ts` validates them; no dev setup config provided | CHK-06, CHK-07 |
| Dev server running on port 3008 | available | `playwright.config.ts` starts server automatically via `webServer` config for `test:e2e`; for browser checks, start manually with `bun run dev` | CHK-06, CHK-07 |

### Required Checks

**[CHK-01] Lint passes with zero errors**
- Action: Run `bun run lint` from the repository root.
- Expected Outcome: Command exits with code 0 and no lint or type-aware errors.
- Required Evidence: Terminal output showing successful completion with exit code 0.

**[CHK-02] TypeScript type-check passes**
- Action: Run `bun run check:types` from the repository root.
- Expected Outcome: Command exits with code 0 with no type errors.
- Required Evidence: Terminal output showing successful completion with exit code 0.

**[CHK-03] Dependency check passes**
- Action: Run `bun run check:deps` from the repository root.
- Expected Outcome: Command exits with code 0 with no unused exports, dependencies, or files flagged for the new code.
- Required Evidence: Terminal output showing successful completion with exit code 0.

**[CHK-04] i18n completeness check passes**
- Action: Run `bun run check:i18n` from the repository root.
- Expected Outcome: Command exits with code 0 confirming all i18n keys in `en.json` have corresponding entries in `fr.json` and all used keys exist.
- Required Evidence: Terminal output showing successful completion with exit code 0.

**[CHK-05] Production build succeeds**
- Action: Run `bun run build-local` from the repository root.
- Expected Outcome: Next.js build completes successfully with exit code 0. The new page route `/[locale]/dashboard/favorite-restaurants` appears in the build output.
- Required Evidence: Terminal output showing build success and the favorite-restaurants route in the output routes list.

**[CHK-06] Integration tests pass**
- Action: Run `bun run test:e2e` from the repository root.
- Expected Outcome: All Playwright tests pass, including the new `FavoriteRestaurant.spec.ts` tests and all existing tests.
- Required Evidence: Terminal output showing all test suites passed with exit code 0, including the FavoriteRestaurant test file.

**[CHK-07] Browser verification of favorites page**
- Action: Start the dev server with `bun run dev`. Open a browser and navigate to `http://localhost:3000/dashboard/favorite-restaurants/`. If prompted, sign in with Clerk. On the favorites page, enter a restaurant name in the form and submit. Then click the delete button on the added item.
- Expected Outcome: The favorites page loads within the dashboard layout with the navigation link visible. The add form accepts a restaurant name and adds it to the displayed list. The delete button removes the item from the list. The empty state message displays when no items exist.
- Required Evidence: Browser screenshot showing (1) the favorites page with the navigation link highlighted, (2) a restaurant added to the list after form submission, and (3) the list after deletion. Console/network evidence confirming no errors during the add and delete operations.

**[CHK-08] Database schema and migration integrity**
- Action: Inspect `src/models/Schema.ts` for the `favoriteRestaurantsSchema` export. Inspect the `migrations/` directory for a new migration SQL file containing the `CREATE TABLE "favorite_restaurants"` statement with columns `id`, `user_id`, `name`, `updated_at`, `created_at`.
- Expected Outcome: The schema exports a `favoriteRestaurantsSchema` with all 5 columns. The migration SQL file correctly creates the table.
- Required Evidence: Contents of the schema export and the migration SQL file showing the correct CREATE TABLE statement.

## Success Metrics

1. All 8 required checks pass.
2. A new `favorite_restaurants` database table exists with user-scoping via Clerk user ID.
3. API routes support adding (POST), listing (GET), and removing (DELETE) favorite restaurants for the authenticated user.
4. A new authenticated page at `/dashboard/favorite-restaurants/` displays the user's favorites with add and remove functionality.
5. Dashboard navigation includes a link to the favorites page.
6. i18n strings are present in both `en.json` and `fr.json`.
7. Integration tests cover API validation and/or auth boundary.
8. All pre-existing tests and quality gates continue to pass.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Define scope | "Changeable list of my favorite restaurants" — add/view/remove |
| `scout/scout-summary.md` | Codebase analysis | No restaurant concept exists; counter is the reference pattern; stack confirmed |
| `scout/reference-map.json` | File mapping and patterns | 24 relevant files identified; wildcard schema import auto-discovers new exports |
| `diagnosis/diagnosis-statement.md` | Design decisions | Greenfield feature; favoriteRestaurantsSchema with userId text column; 3 API methods |
| `diagnosis/apl.json` | Structured findings | Minimal CRUD (add/view/remove); user-scoping via Clerk; dashboard placement |
| `product/product.md` | Product scope and constraints | MVP: add/view/remove only; duplicates allowed; no edit/rich data/pagination |
| `tech-research/tech-research.md` | Architecture and API design | Option A (API routes + client fetch) chosen; auth() over currentUser(); single route file; Zod validation patterns |
| `tech-research/apl.json` | Technical decisions | Confirmed all patterns; no new dependencies; router.refresh() for updates |
| `repo-guidance.json` | Repo intent | Single repo (next-js-boilerplate) is the target |
| `src/models/Schema.ts` | Schema pattern | counterSchema: serial PK, timestamps with $onUpdate, defaultNow |
| `src/app/[locale]/api/counter/route.ts` | API pattern | Zod safeParse, treeifyError for 422, Drizzle insert with returning |
| `src/validations/CounterValidation.ts` | Validation pattern | z.object() with named export |
| `src/components/CounterForm.tsx` | Client form pattern | 'use client', zodResolver, useForm, fetch to API, router.refresh() |
| `src/components/CurrentCount.tsx` | Server component pattern | db.query, getTranslations, headers |
| `src/components/Hello.tsx` | User identity pattern | currentUser() from Clerk; shows user.id access |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Navigation pattern | BaseTemplate leftNav with Link components; 3 existing links |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Page pattern | Locale params, setRequestLocale, generateMetadata |
| `src/locales/en.json` | i18n structure | Namespace-based keys; DashboardLayout, CounterForm, CurrentCount namespaces |
| `src/locales/fr.json` | French translations | Mirror structure of en.json |
| `tests/integration/Counter.spec.ts` | Test pattern | Playwright page.request, status assertions, JSON assertions |
| `playwright.config.ts` | Test infrastructure | Port 3008, webServer auto-start, PGlite in-memory |
| `package.json` | Scripts and deps | All needed libs present; quality gate commands confirmed |
| `AGENTS.md` | Coding standards | Named exports, @/ imports, Tailwind v4, no useMemo/useCallback, sentence case i18n |
