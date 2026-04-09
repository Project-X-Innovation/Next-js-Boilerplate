# Implementation Plan: Changeable List of Favorite Restaurants

## Overview

Build a user-scoped favorite restaurants list feature as a new dashboard sub-page. The implementation follows the existing counter vertical-slice pattern: Drizzle schema, migration, Zod validation, API route (GET/POST/DELETE), server component for display, client components for add form and per-item delete, dashboard navigation link, and i18n strings in both locales. No new dependencies are needed.

## Implementation Principles

- Follow the counter feature vertical-slice pattern exactly (schema, validation, API route, client form, server display, i18n).
- Use `auth()` from `@clerk/nextjs/server` (not `currentUser()`) for lightweight user identity.
- Named exports only (except the Next.js page default export).
- Absolute imports via `@/`.
- Tailwind v4 utility classes for styling, matching existing design language.
- All user-visible strings via next-intl (en + fr), sentence case.
- No new dependencies.

## Implementation Steps Summary

| Step | Goal | Deliverable |
|------|------|-------------|
| 1 | Define database schema | `src/models/Schema.ts` updated with `favoriteRestaurantSchema` |
| 2 | Generate database migration | New migration file in `migrations/` |
| 3 | Create Zod validation schemas | `src/validations/FavoriteRestaurantValidation.ts` |
| 4 | Add i18n strings | `src/locales/en.json` and `src/locales/fr.json` updated |
| 5 | Create API route (GET/POST/DELETE) | `src/app/[locale]/api/favorite-restaurants/route.ts` |
| 6 | Create RemoveFavoriteButton client component | `src/components/RemoveFavoriteButton.tsx` |
| 7 | Create FavoriteRestaurantForm client component | `src/components/FavoriteRestaurantForm.tsx` |
| 8 | Create FavoriteRestaurantList server component | `src/components/FavoriteRestaurantList.tsx` |
| 9 | Create favorites page | `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx` |
| 10 | Add dashboard navigation link | `src/app/[locale]/(auth)/dashboard/layout.tsx` updated |

## Detailed Implementation Steps

### Step 1: Define Database Schema

**Goal**: Add the `favoriteRestaurantSchema` table to the Drizzle ORM schema.

**What to Build**:
- Edit `src/models/Schema.ts`:
  - Add `text` to the existing import from `drizzle-orm/pg-core` (current imports: `integer, pgTable, serial, timestamp`).
  - Add a new named export `favoriteRestaurantSchema` using `pgTable('favorite_restaurant', { ... })`.
  - Columns:
    - `id`: `serial('id').primaryKey()`
    - `userId`: `text('user_id').notNull()`
    - `name`: `text('name').notNull()`
    - `updatedAt`: `timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()).notNull()`
    - `createdAt`: `timestamp('created_at', { mode: 'date' }).defaultNow().notNull()`
  - Follow the exact `counterSchema` timestamp pattern (lines 19-23 of current file).
  - No unique constraint on `(userId, name)` — duplicates allowed per product spec.
  - No foreign key to a users table — Clerk manages users externally.
- Note: `src/utils/DBConnection.ts` uses `import * as schema from '@/models/Schema'`, so the new export is auto-discovered without changes there.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.

**Success Criteria**:
- `favoriteRestaurantSchema` is exported from `src/models/Schema.ts` with all 5 columns.
- TypeScript compilation succeeds.

---

### Step 2: Generate Database Migration

**Goal**: Produce a Drizzle migration SQL file for the new table.

**What to Build**:
- Run `npm run db:generate` (drizzle-kit generate).
- This reads `src/models/Schema.ts` via `drizzle.config.ts` and produces a new `.sql` migration file in `migrations/`.
- The migration will contain `CREATE TABLE "favorite_restaurant"`.

**Verification (AI Agent Runs)**:
- A new migration SQL file exists in `migrations/` (alongside existing `0000_init-db.sql`).
- The migration file contains `CREATE TABLE "favorite_restaurant"` with columns `id`, `user_id`, `name`, `updated_at`, `created_at`.

**Success Criteria**:
- New migration file generated with correct DDL.

---

### Step 3: Create Zod Validation Schemas

**Goal**: Define validation schemas for add and delete API operations.

**What to Build**:
- Create `src/validations/FavoriteRestaurantValidation.ts`:
  - `import * as z from 'zod';` (follows `CounterValidation.ts` import pattern).
  - Export `AddFavoriteRestaurantValidation`: `z.object({ name: z.string().min(1).max(255) })`.
  - Export `RemoveFavoriteRestaurantValidation`: `z.object({ id: z.number().int().positive() })`.
  - Named exports only.
  - Add JSDoc for each export.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.

**Success Criteria**:
- Two named validation exports with correct constraints.
- File follows `CounterValidation.ts` pattern.

---

### Step 4: Add i18n Strings

**Goal**: Add all user-visible strings for the feature to both locale files.

**What to Build**:
- Edit `src/locales/en.json` — add these entries:
  - In existing `"DashboardLayout"` object: add `"favorite_restaurants_link": "Favorite restaurants"`.
  - New `"FavoriteRestaurantsPage"` namespace: `{ "meta_title": "Favorite restaurants" }`.
  - New `"FavoriteRestaurantForm"` namespace: `{ "presentation": "Add a restaurant to your favorites list.", "label_name": "Restaurant name", "button_add": "Add", "error_name_required": "Name is required" }`.
  - New `"FavoriteRestaurantList"` namespace: `{ "title": "My favorite restaurants", "empty_state": "No favorite restaurants yet" }`.
  - New `"RemoveFavoriteButton"` namespace: `{ "button_remove": "Remove" }`.
- Edit `src/locales/fr.json` — add corresponding French translations:
  - In existing `"DashboardLayout"` object: add `"favorite_restaurants_link": "Restaurants favoris"`.
  - New `"FavoriteRestaurantsPage"` namespace: `{ "meta_title": "Restaurants favoris" }`.
  - New `"FavoriteRestaurantForm"` namespace: `{ "presentation": "Ajoutez un restaurant a votre liste de favoris.", "label_name": "Nom du restaurant", "button_add": "Ajouter", "error_name_required": "Le nom est requis" }`.
  - New `"FavoriteRestaurantList"` namespace: `{ "title": "Mes restaurants favoris", "empty_state": "Aucun restaurant favori" }`.
  - New `"RemoveFavoriteButton"` namespace: `{ "button_remove": "Supprimer" }`.

**Verification (AI Agent Runs)**:
- `bun run check:i18n` passes (all keys present in both locales with no unused keys).

**Success Criteria**:
- Both locale files have matching key structures for all new namespaces.
- Sentence case used for all values per AGENTS.md.

---

### Step 5: Create API Route (GET/POST/DELETE)

**Goal**: Implement authenticated CRUD endpoints for favorite restaurants.

**What to Build**:
- Create `src/app/[locale]/api/favorite-restaurants/route.ts`:
  - Import `auth` from `@clerk/nextjs/server`.
  - Import `eq, and` from `drizzle-orm`.
  - Import `NextResponse` from `next/server`.
  - Import `* as z` from `zod`.
  - Import `db` from `@/libs/DB`.
  - Import `favoriteRestaurantSchema` from `@/models/Schema`.
  - Import both validation schemas from `@/validations/FavoriteRestaurantValidation`.
  - **GET handler** (named export `GET`):
    - `const { userId } = await auth()`. If no userId, return `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.
    - Query: `db.select().from(favoriteRestaurantSchema).where(eq(favoriteRestaurantSchema.userId, userId))`.
    - Return `NextResponse.json({ favorites })`.
  - **POST handler** (named export `POST`):
    - Auth check (same pattern).
    - `const json = await request.json()`.
    - `const parse = AddFavoriteRestaurantValidation.safeParse(json)`.
    - If `!parse.success`, return `NextResponse.json(z.treeifyError(parse.error), { status: 422 })`.
    - Insert: `db.insert(favoriteRestaurantSchema).values({ userId, name: parse.data.name }).returning()`.
    - Return `NextResponse.json({ favorite: result[0] })`.
  - **DELETE handler** (named export `DELETE`):
    - Auth check (same pattern).
    - Parse body with `RemoveFavoriteRestaurantValidation`.
    - If validation fails, return 422.
    - Delete: `db.delete(favoriteRestaurantSchema).where(and(eq(favoriteRestaurantSchema.id, parse.data.id), eq(favoriteRestaurantSchema.userId, userId))).returning()`.
    - Return `NextResponse.json({ favorite: result[0] })`.
  - Add JSDoc for each handler.
  - **Critical safety invariant**: DELETE WHERE must always include both `id` AND `userId` to prevent cross-user deletion.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.
- `bun run lint` passes.

**Success Criteria**:
- Three named HTTP method exports (GET, POST, DELETE).
- Auth enforced on every handler via `auth()`.
- Validation errors return 422 with `z.treeifyError()`.
- Unauthenticated requests return 401.
- DELETE uses compound WHERE with both id and userId.

---

### Step 6: Create RemoveFavoriteButton Client Component

**Goal**: Create a per-item delete button client component.

**What to Build**:
- Create `src/components/RemoveFavoriteButton.tsx`:
  - `'use client';` directive at top.
  - Import `useTranslations` from `next-intl`.
  - Import `useRouter` from `@/libs/I18nNavigation`.
  - Named export `RemoveFavoriteButton` with inline props type `{ id: number }`.
  - On click handler: call `fetch('/api/favorite-restaurants', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: props.id }) })`, then `router.refresh()`.
  - Render a `<button>` with Tailwind styling and i18n text `t('button_remove')` from `RemoveFavoriteButton` namespace.
  - Style the button with red/danger styling (e.g., `text-red-500 hover:text-red-700` or similar).
  - Add JSDoc.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.
- `bun run lint` passes.

**Success Criteria**:
- Named export, `'use client'` directive.
- Calls DELETE API with item id and refreshes page after.
- Uses i18n for button text.

---

### Step 7: Create FavoriteRestaurantForm Client Component

**Goal**: Create the add-restaurant form client component.

**What to Build**:
- Create `src/components/FavoriteRestaurantForm.tsx`:
  - `'use client';` directive.
  - Import `zodResolver` from `@hookform/resolvers/zod`.
  - Import `useTranslations` from `next-intl`.
  - Import `useForm` from `react-hook-form`.
  - Import `useRouter` from `@/libs/I18nNavigation`.
  - Import `AddFavoriteRestaurantValidation` from `@/validations/FavoriteRestaurantValidation`.
  - Named export `FavoriteRestaurantForm`.
  - `useTranslations('FavoriteRestaurantForm')` for i18n.
  - `useForm({ resolver: zodResolver(AddFavoriteRestaurantValidation), defaultValues: { name: '' } })`.
  - `handleSubmit` via `form.handleSubmit(async (formData) => { ... })`:
    - `fetch('/api/favorite-restaurants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })`.
    - `await response.json()`.
    - `form.reset()`.
    - `router.refresh()`.
  - Render `<form onSubmit={handleAdd}>`:
    - `<p>{t('presentation')}</p>` — description text.
    - `<label>` with `t('label_name')` and text `<input>` registered as `'name'`.
    - Validation error display: if `form.formState.errors.name`, show `t('error_name_required')`.
    - Submit `<button>` with `t('button_add')`, disabled during `form.formState.isSubmitting`.
  - Tailwind styling following `CounterForm.tsx` patterns (same input, button, label, error classes).
  - Add JSDoc.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.
- `bun run lint` passes.

**Success Criteria**:
- Follows `CounterForm.tsx` pattern (react-hook-form + zodResolver + fetch + router.refresh).
- Named export, `'use client'`, all text from i18n.
- Form resets after successful submission.

---

### Step 8: Create FavoriteRestaurantList Server Component

**Goal**: Create a server component that reads and displays the user's favorites.

**What to Build**:
- Create `src/components/FavoriteRestaurantList.tsx`:
  - Async server component (no `'use client'` directive).
  - Import `auth` from `@clerk/nextjs/server`.
  - Import `eq` from `drizzle-orm`.
  - Import `getTranslations` from `next-intl/server`.
  - Import `db` from `@/libs/DB`.
  - Import `favoriteRestaurantSchema` from `@/models/Schema`.
  - Import `RemoveFavoriteButton` from `@/components/RemoveFavoriteButton`.
  - Named export `FavoriteRestaurantList` as async function.
  - `const t = await getTranslations('FavoriteRestaurantList')`.
  - `const { userId } = await auth()`.
  - Query: `db.select().from(favoriteRestaurantSchema).where(eq(favoriteRestaurantSchema.userId, userId!))`.
  - Render:
    - A heading with `t('title')`.
    - If no favorites, render empty state `<p>{t('empty_state')}</p>`.
    - If favorites exist, render a `<ul>` with each item as `<li>` showing `item.name` and `<RemoveFavoriteButton id={item.id} />`.
  - Tailwind styling for the list.
  - Add JSDoc.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.
- `bun run lint` passes.

**Success Criteria**:
- Named export, async server component.
- Reads from DB scoped to authenticated user via `auth()`.
- Renders list items with `RemoveFavoriteButton` per item.
- Shows empty state when no favorites exist.
- Follows `CurrentCount.tsx` pattern.

---

### Step 9: Create Favorites Page

**Goal**: Create the dashboard sub-page that composes the form and list components.

**What to Build**:
- Create `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx`:
  - Import `Metadata` type from `next`.
  - Import `getTranslations, setRequestLocale` from `next-intl/server`.
  - Import `FavoriteRestaurantForm` from `@/components/FavoriteRestaurantForm`.
  - Import `FavoriteRestaurantList` from `@/components/FavoriteRestaurantList`.
  - Define `FavoriteRestaurantsPageProps` type: `{ params: Promise<{ locale: string }> }`.
  - Export `generateMetadata` function:
    - `const { locale } = await props.params`.
    - `const t = await getTranslations({ locale, namespace: 'FavoriteRestaurantsPage' })`.
    - Return `{ title: t('meta_title') }`.
  - Default export `FavoriteRestaurantsPage`:
    - `const { locale } = await props.params`.
    - `setRequestLocale(locale)`.
    - Render a container `<div className="py-5 [&_p]:my-6">` (matches dashboard page pattern) with `<FavoriteRestaurantForm />` and `<FavoriteRestaurantList />`.
  - Follow the existing `src/app/[locale]/(auth)/dashboard/page.tsx` pattern.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.
- `bun run lint` passes.

**Success Criteria**:
- Default export ending with `Page` (per AGENTS.md).
- `generateMetadata` with `FavoriteRestaurantsPage` namespace.
- Composes both form and list components.
- Located in `(auth)/dashboard/` route group for Clerk authentication.

---

### Step 10: Add Dashboard Navigation Link

**Goal**: Add a nav link to the favorites page in the dashboard layout.

**What to Build**:
- Edit `src/app/[locale]/(auth)/dashboard/layout.tsx`:
  - Add a new `<li>` in the `leftNav` section of `<BaseTemplate>`, after the existing "Manage your account" link (after line 37).
  - Content: `<Link href="/dashboard/favorite-restaurants/" className="border-none text-gray-700 hover:text-gray-900">{t('favorite_restaurants_link')}</Link>`.
  - Uses the `favorite_restaurants_link` key from the `DashboardLayout` i18n namespace (added in Step 4).
  - No other changes to the layout file.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.
- `bun run lint` passes.
- `bun run check:i18n` passes.

**Success Criteria**:
- Dashboard nav now has three links in leftNav: Dashboard, Manage your account, Favorite restaurants.
- Link uses i18n text and matches existing nav link styling.

---

## Verification Plan

### Pre-conditions

| Dependency | Status | Source/Evidence | Affects checks |
|------------|--------|----------------|----------------|
| Node.js >= 20 | available | `package.json` engines field | CHK-01 through CHK-07 |
| `bun` runtime | available | Scripts reference `bun run` | CHK-01 through CHK-07 |
| npm dependencies installed (`bun install`) | available | Run before any checks | CHK-01 through CHK-07 |
| Migration generated (Step 2) | available | `npm run db:generate` during implementation | CHK-02, CHK-06, CHK-07 |
| PGlite dev database | available | `db-server:memory` script auto-creates in-memory PGlite for `build-local` and `test:e2e`; `db-server:file` for `dev` | CHK-05, CHK-06, CHK-07 |
| Clerk environment variables (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) | unknown | Required for auth; validated in `src/libs/Env.ts`; no dev setup config provided | CHK-06, CHK-07 |
| Clerk test user credentials | unknown | No dev setup config provides login credentials; needed to authenticate in browser | CHK-07 |

### Required Checks

[CHK-01] Quality gates pass: lint, TypeScript, dependency check, i18n check.
- Action: Run `bun run lint && bun run check:types && bun run check:deps && bun run check:i18n` from the repository root.
- Expected Outcome: All four commands exit with code 0 and report no errors.
- Required Evidence: Terminal output from each command showing successful completion with zero errors.

[CHK-02] Migration file contains correct DDL for favorite_restaurant table.
- Action: List files in `migrations/` directory and read the newest migration file (not `0000_init-db.sql`).
- Expected Outcome: The migration SQL contains `CREATE TABLE "favorite_restaurant"` with columns `id` (serial primary key), `user_id` (text not null), `name` (text not null), `updated_at` (timestamp default now not null), `created_at` (timestamp default now not null).
- Required Evidence: Full contents of the new migration SQL file showing the CREATE TABLE statement with all columns and constraints.

[CHK-03] Schema file exports favoriteRestaurantSchema with correct columns.
- Action: Read `src/models/Schema.ts` and verify the new `favoriteRestaurantSchema` export.
- Expected Outcome: The file exports `favoriteRestaurantSchema` via `pgTable('favorite_restaurant', ...)` with five columns: `id` (serial PK), `userId` (text not null), `name` (text not null), `updatedAt` (timestamp with $onUpdate and defaultNow), `createdAt` (timestamp with defaultNow). The timestamp pattern matches the existing `counterSchema` exactly.
- Required Evidence: File contents of `src/models/Schema.ts` showing both the existing counterSchema and the new favoriteRestaurantSchema.

[CHK-04] Existing tests pass.
- Action: Run `bun run test` from the repository root.
- Expected Outcome: All existing Vitest unit tests pass with exit code 0.
- Required Evidence: Terminal output showing test results with all tests passing and exit code 0.

[CHK-05] Production build succeeds.
- Action: Run `bun run build-local` from the repository root.
- Expected Outcome: The Next.js build completes with exit code 0. The build output includes the new route `/(auth)/dashboard/favorite-restaurants` and the new API route `/api/favorite-restaurants`.
- Required Evidence: Terminal output showing successful build completion and the new routes listed in the build output.

[CHK-06] API routes respond correctly for authenticated and unauthenticated requests.
- Action: Start the dev server with `bun run dev`. Send HTTP requests to the `/api/favorite-restaurants` endpoint: (1) GET without auth headers, (2) POST with `{ "name": "" }` (empty name) without auth, (3) POST with valid body `{ "name": "Test Restaurant" }` with a valid Clerk session. After adding, (4) GET with the same session to list favorites, (5) DELETE with valid session using the returned id.
- Expected Outcome: Unauthenticated GET returns 401. Unauthenticated POST returns 401. Authenticated POST with valid body returns 200 with the created favorite. Authenticated GET returns 200 with the favorites array including the added restaurant. Authenticated DELETE returns 200 with the deleted favorite.
- Required Evidence: HTTP status codes and response JSON payloads for each request.

[CHK-07] Favorites page renders in browser with full add and remove workflow.
- Action: Start the dev server with `bun run dev`. Open a browser and navigate to the dashboard. Sign in with Clerk. Click the "Favorite restaurants" navigation link. On the favorites page, observe the empty state. Enter a restaurant name in the form and submit. Verify the restaurant appears in the list. Click the remove button on the added restaurant. Verify the list returns to empty state.
- Expected Outcome: The dashboard navigation displays a "Favorite restaurants" link. Clicking it loads the favorites page with an empty state message. After submitting the form with a restaurant name, the restaurant appears in a list. After clicking the remove button, the restaurant is removed and the empty state message reappears.
- Required Evidence: Browser screenshots showing: (1) the dashboard navigation with the "Favorite restaurants" link, (2) the empty state on initial page load, (3) the list after adding a restaurant with the restaurant name visible, (4) the empty state after removing the restaurant. Console/network panel evidence confirming no JavaScript errors during the add and remove operations.

## Success Metrics

1. All quality gates pass (lint, type-check, dep-check, i18n-check).
2. Production build completes successfully.
3. A new `favorite_restaurant` database table is defined with user-scoping via Clerk user ID.
4. A migration file is generated with correct DDL.
5. API routes enforce authentication and support GET, POST, DELETE.
6. The favorites page is accessible from a dashboard navigation link.
7. Add and remove operations work through the browser UI.
8. i18n strings are complete in both en and fr locales.
9. No existing tests are broken.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Define feature scope | "Have a changeable list of my favorite restaurants" — add/view/remove |
| `scout/reference-map.json` | Map codebase files, patterns, and gaps | Counter feature is the reference vertical slice; no restaurant concept exists; 23 files identified |
| `scout/scout-summary.md` | Cross-reference analysis and quality gates | Stack confirmed: Next.js 16, Drizzle 0.45.1, Clerk 7.0.6, next-intl, Tailwind v4 |
| `diagnosis/diagnosis-statement.md` | Root-cause analysis and design decisions | Greenfield feature; favoriteRestaurantSchema with userId text column; 3 API methods; 8 success criteria |
| `diagnosis/apl.json` | Structured diagnosis findings | Confirmed greenfield; minimal CRUD scope (add/view/remove); user-scoping via Clerk |
| `product/product.md` | Product requirements and scope boundaries | MVP: add/view/remove; duplicates allowed; no edit, no rich data, no pagination, no reordering |
| `tech-research/tech-research.md` | Architecture decisions and API design | Option A (API routes + client fetch) chosen; auth() over currentUser(); 3 components; single route file; no new deps |
| `tech-research/apl.json` | Validated technical questions | Drizzle text column for userId; Zod patterns; router.refresh() for updates |
| `repo-guidance.json` | Repo intent classification | Single target repo: next-js-boilerplate |
| `src/models/Schema.ts` | Verify schema column pattern | counterSchema: serial PK, integer, timestamps with mode:'date', $onUpdate, defaultNow, notNull |
| `src/app/[locale]/api/counter/route.ts` | Verify API route pattern | Zod safeParse, z.treeifyError for 422, Drizzle insert with returning, NextResponse.json |
| `src/validations/CounterValidation.ts` | Verify validation pattern | `import * as z from 'zod'`; z.object() with field constraints; named export |
| `src/components/CounterForm.tsx` | Verify client form pattern | 'use client', zodResolver, useForm, fetch to API, router.refresh(), useTranslations |
| `src/components/CurrentCount.tsx` | Verify server component pattern | Async server component, db.query, getTranslations, eq from drizzle-orm |
| `src/components/Hello.tsx` | Verify user identity access | currentUser() from @clerk/nextjs/server for full user object |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Verify navigation structure | BaseTemplate leftNav with 2 Link items; add third link after user_profile_link |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Verify page pattern | DashboardPageProps type, generateMetadata with namespace, setRequestLocale, default export |
| `src/locales/en.json` | Verify i18n namespace structure | Namespace-based keys per component/page; DashboardLayout has dashboard_link, user_profile_link, sign_out |
| `src/locales/fr.json` | Verify French translation structure | Mirror structure of en.json with French translations |
| `AGENTS.md` | Mandatory coding standards | Named exports, @/ imports, Tailwind v4, no useMemo/useCallback, sentence case i18n, JSDoc, conventional commits |
| `package.json` | Scripts and dependencies | All needed libs present; quality gate commands: lint, check:types, check:deps, check:i18n, build-local, test |
| `drizzle.config.ts` | Migration config | Schema at ./src/models/Schema.ts, output at ./migrations, PostgreSQL dialect |
| `tests/integration/Counter.spec.ts` | Integration test pattern | Playwright page.request, status assertions, JSON assertions; counter tests are unauthenticated |
