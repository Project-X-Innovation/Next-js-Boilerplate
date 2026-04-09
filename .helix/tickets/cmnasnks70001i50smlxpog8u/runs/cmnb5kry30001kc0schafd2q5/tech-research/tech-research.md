# Tech Research: Changeable List of Favorite Restaurants

## Technology Foundation

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Framework | Next.js (App Router) | 16.2.1 | Routing, API routes, server/client components |
| Runtime | React | 19.2.4 | UI rendering, React Compiler in production |
| ORM | Drizzle ORM | 0.45.1 | Schema definition, type-safe queries, migrations |
| Database | PostgreSQL (PGlite dev) | — | Data persistence |
| Auth | Clerk | 7.0.6 | User identity, session management |
| Validation | Zod | 4.3.6 | Request/form validation |
| Forms | react-hook-form | 7.71.2 | Client-side form state + @hookform/resolvers 5.2.2 |
| i18n | next-intl | 4.8.3 | Internationalization (en, fr) |
| Styling | Tailwind CSS | 4.2.2 | Utility-class styling |

No new dependencies are required. The existing stack fully supports the feature.

## Architecture Decision

### Options Considered

**Option A: API Routes + Client Fetch + Server Component Display (chosen)**
- Client component uses `fetch()` to API routes for mutations (POST, DELETE).
- Server component reads data directly via `db.query` for list display.
- `router.refresh()` after mutations triggers server component re-render.
- Pros: Matches the existing counter pattern exactly; no new paradigm; clear server/client separation; API routes are independently testable.
- Cons: Slightly more boilerplate than server actions.

**Option B: Server Actions for mutations**
- Use `'use server'` functions for add/delete mutations.
- Pros: Less boilerplate; built-in form integration; progressive enhancement.
- Cons: Introduces a new pattern not used anywhere in the codebase; no existing test patterns for server actions; inconsistent with the counter feature approach; AGENTS.md does not reference server actions.

**Option C: Full Client-Side with SWR/React Query**
- Manage all data fetching and mutations from client components.
- Pros: Rich caching and optimistic updates.
- Cons: Adds a new dependency; over-engineered for a simple list; loses server component data-fetching benefits; inconsistent with codebase patterns.

### Chosen: Option A — API Routes + Client Fetch

**Rationale**: The codebase has exactly one data-backed feature (counter) and it uses this pattern consistently across schema → validation → API route → client form → server display → i18n. Introducing server actions or a client-side data library would create pattern fragmentation for no clear benefit. Following the established vertical-slice pattern reduces implementation risk and keeps the codebase consistent.

## Core API/Methods

### Database Schema

New export `favoriteRestaurantSchema` in `src/models/Schema.ts`:

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | `serial` | Primary key | Row identifier |
| `userId` | `text` | Not null | Clerk user ID for per-user scoping |
| `name` | `text` | Not null | Restaurant name (free-form entry) |
| `updatedAt` | `timestamp` | Not null, defaultNow, $onUpdate | Track last modification |
| `createdAt` | `timestamp` | Not null, defaultNow | Track creation time |

Design notes:
- `userId` is `text` because Clerk IDs are variable-length strings (e.g., `user_2abc...`). In PostgreSQL, `text` and `varchar` have identical performance characteristics, so `text` avoids an arbitrary length constraint.
- No composite unique constraint on `(userId, name)` — product spec explicitly allows duplicate names for MVP simplicity (product.md Open Questions #4).
- Timestamp columns follow the exact `counterSchema` pattern: `timestamp('column', { mode: 'date' }).defaultNow().notNull()` and `$onUpdate(() => new Date())` on `updatedAt`.
- No foreign key to a users table — Clerk manages users externally; the userId column is a filter key.
- The `DBConnection.ts` wildcard import (`import * as schema from '@/models/Schema'`) means the new export is auto-discovered — no changes needed in DB connection code.

After schema changes, `npm run db:generate` produces a new migration file in `migrations/`.

### API Route Design

Single route file: `src/app/[locale]/api/favorite-restaurants/route.ts`

| Method | Purpose | Auth | Input | Success Response | Error Response |
|--------|---------|------|-------|-----------------|----------------|
| `GET` | List user's favorites | Required | None (userId from auth) | 200: `{ favorites: [...] }` | 401: Unauthorized |
| `POST` | Add a favorite | Required | `{ name: string }` | 200: `{ favorite: {...} }` | 401 / 422 validation |
| `DELETE` | Remove a favorite | Required | `{ id: number }` | 200: `{ favorite: {...} }` | 401 / 422 validation |

Authentication pattern (verified via Clerk docs on Context7):
- Use `auth()` from `@clerk/nextjs/server`, not `currentUser()`.
- `auth()` returns `{ isAuthenticated, userId }` from the session without a Backend API call.
- `currentUser()` fetches the full Backend User object and counts toward Clerk rate limits — unnecessary when only userId is needed.
- Each handler: check `isAuthenticated`, return 401 if false, then scope all DB operations to `userId`.
- DELETE must use compound WHERE: `and(eq(schema.id, id), eq(schema.userId, userId))` to prevent cross-user deletion.

### Validation Schemas

File: `src/validations/FavoriteRestaurantValidation.ts`

- `AddFavoriteRestaurantValidation`: `z.object({ name: z.string().min(1).max(255) })` — non-empty name with reasonable length limit.
- `RemoveFavoriteRestaurantValidation`: `z.object({ id: z.number().int().positive() })` — validates positive integer ID.

Follows CounterValidation.ts pattern: named exports, `import * as z from 'zod'`, `z.object()` with field constraints. Validation errors return 422 with `z.treeifyError(parse.error)`.

### UI Component Architecture

| Component | Type | File | Responsibility |
|-----------|------|------|----------------|
| `FavoriteRestaurantList` | Server | `src/components/FavoriteRestaurantList.tsx` | Reads DB via `db.query`, renders list items with delete buttons, handles empty state |
| `FavoriteRestaurantForm` | Client | `src/components/FavoriteRestaurantForm.tsx` | Add form with react-hook-form + zodResolver, fetch POST to API, router.refresh() |
| `RemoveFavoriteButton` | Client | `src/components/RemoveFavoriteButton.tsx` | Per-item delete button, fetch DELETE to API, router.refresh() |
| Favorites Page | Page | `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx` | Composes list + form, handles locale/metadata |

**Server component pattern** (follows `CurrentCount.tsx`):
- `FavoriteRestaurantList` is an async server component.
- Uses `auth()` to get userId, then `db.query.favoriteRestaurantSchema.findMany({ where: eq(schema.userId, userId) })`.
- Uses `getTranslations('FavoriteRestaurantList')` for i18n strings.
- Renders empty state when no favorites exist.
- Embeds `<RemoveFavoriteButton id={item.id} />` per list item — passes only the id to minimize RSC boundary serialization.

**Client component pattern** (follows `CounterForm.tsx`):
- `FavoriteRestaurantForm` uses `'use client'`, `useTranslations`, `useForm` with `zodResolver`, fetch to API, `router.refresh()`.
- `RemoveFavoriteButton` uses `'use client'`, calls `fetch('/api/favorite-restaurants', { method: 'DELETE', body: JSON.stringify({ id }) })`, then `router.refresh()`.

### Page Structure

`src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx`:
- Default export: `FavoriteRestaurantsPage` (AGENTS.md: page export names end with `Page`).
- Props type: `{ params: Promise<{ locale: string }> }` → `await props.params` → `setRequestLocale(locale)`.
- `generateMetadata` with `FavoriteRestaurantsPage` i18n namespace.
- Composes `<FavoriteRestaurantForm />` and `<FavoriteRestaurantList />`.
- Located in `(auth)` route group — Clerk authentication is enforced by the auth layout.

### Navigation

Add a nav link in `src/app/[locale]/(auth)/dashboard/layout.tsx`:
- New `<li>` in `leftNav` (after the existing "Dashboard" and "Manage your account" links).
- Uses `<Link href="/dashboard/favorite-restaurants/">` with i18n key `DashboardLayout.favorite_restaurants_link`.

### i18n Keys

New namespaces and keys needed in both `src/locales/en.json` and `src/locales/fr.json`:

| Namespace | Key | Purpose |
|-----------|-----|---------|
| `DashboardLayout` | `favorite_restaurants_link` | Navigation link text |
| `FavoriteRestaurantsPage` | `meta_title` | Page title for metadata |
| `FavoriteRestaurantForm` | `label_name` | Form input label |
| `FavoriteRestaurantForm` | `button_add` | Submit button text |
| `FavoriteRestaurantForm` | `error_name_required` | Validation error |
| `FavoriteRestaurantForm` | `presentation` | Form description text |
| `FavoriteRestaurantList` | `title` | List heading |
| `FavoriteRestaurantList` | `empty_state` | Message when no favorites |
| `RemoveFavoriteButton` | `button_remove` | Delete button text |

The `check:i18n` script will verify completeness across locales.

## Technical Decisions

### 1. User scoping via userId text column (not foreign key)

**Chosen**: Store Clerk `userId` as a plain `text` column with no FK constraint.
**Rejected**: Creating a local users table with FK relationship.
**Rationale**: Clerk manages users externally. There is no local users table in the codebase, and creating one solely for a FK constraint adds unnecessary complexity. The userId column is a filter/partition key. This is the standard pattern for external auth providers with Drizzle.

### 2. Single route file for all HTTP methods

**Chosen**: One `route.ts` exporting `GET`, `POST`, `DELETE`.
**Rejected**: Separate directories (e.g., `/api/favorite-restaurants/[id]/route.ts` for DELETE).
**Rationale**: The counter uses one file with one method. Three methods in one file is manageable (~60-80 lines total). Keeping a flat route structure matches the existing pattern.

### 3. DELETE by id in request body (not URL param)

**Chosen**: `DELETE` with `{ id: number }` in JSON body.
**Rejected**: Dynamic route segment `[id]` for DELETE.
**Rationale**: Keeps the route structure flat (single `route.ts` file). The existing counter pattern passes data via request body. Zod validates the id. While REST convention favors URL params for DELETE, the body approach is simpler here and avoids an additional route file.

### 4. No pagination for MVP

**Chosen**: Return all favorites for the user in a single query.
**Rejected**: Cursor-based or offset pagination.
**Rationale**: Product spec explicitly defers pagination. A typical user's list is unlikely to exceed a few dozen items. The `createdAt` column supports cursor-based pagination if needed later — no schema changes required.

### 5. auth() over currentUser()

**Chosen**: `auth()` from `@clerk/nextjs/server`.
**Rejected**: `currentUser()` from `@clerk/nextjs/server`.
**Rationale**: `auth()` reads session data locally without a Backend API call. `currentUser()` fetches the full Backend User object and counts toward Clerk rate limits (per Clerk docs, verified via Context7). Since we only need userId for DB scoping, `auth()` is the correct lightweight choice.

### 6. router.refresh() for list updates (not revalidation tags)

**Chosen**: Client calls `router.refresh()` after mutation.
**Rejected**: `revalidateTag()` / `revalidatePath()` via server actions.
**Rationale**: The existing counter pattern uses `router.refresh()` in `CounterForm.tsx` (line 29). This triggers a full server-side re-render of the current page, re-executing the server component's DB query. Simple, proven, and consistent.

### 7. Three components (list + form + delete button) vs. fewer

**Chosen**: Three focused components with clear server/client boundaries.
**Rejected**: Single client component that manages everything; or two components with delete logic inlined in the server component.
**Rationale**: Server components cannot handle user events (delete clicks). A separate `RemoveFavoriteButton` client component is the minimal way to add interactivity per list item. `FavoriteRestaurantForm` and `FavoriteRestaurantList` mirror the existing `CounterForm` / `CurrentCount` split.

## Cross-Platform Considerations

Not applicable. This is a server-rendered web application with no native/mobile targets. The only cross-platform concern is i18n (English + French), handled by the existing next-intl infrastructure.

## Performance Expectations

| Aspect | Expectation | Basis |
|--------|-------------|-------|
| List query | <50ms | Simple SELECT with userId equality filter on small table |
| Add mutation | <50ms | Single-row INSERT with RETURNING |
| Delete mutation | <50ms | Single-row DELETE with compound WHERE (id + userId) |
| Page load | No regression | Server component fetches data during SSR; no client fetch waterfall |
| Bundle impact | Minimal (~1-2KB) | Two small client components; no new dependencies |
| Auth overhead | Minimal | `auth()` reads session locally; no external API call |

No index on userId is strictly needed for MVP. If the table grows significantly (>10K rows across all users), adding an index would improve query performance. This is a future optimization that requires no schema changes.

## Dependencies

### Existing (no additions needed)

| Package | Usage in Feature |
|---------|-----------------|
| `drizzle-orm` | Schema definition (`pgTable`), query builder (`db.query`, `db.insert`, `db.delete`), operators (`eq`, `and`) |
| `drizzle-kit` | Migration generation (`npm run db:generate`) |
| `@clerk/nextjs` | `auth()` for user identity in API routes and server components |
| `zod` | Request validation schemas (add + delete) |
| `react-hook-form` + `@hookform/resolvers` | Client form state management with Zod integration |
| `next-intl` | `getTranslations` (server), `useTranslations` (client) |
| `next` | App Router, API routes, server/client components |

### New Dependencies

None required.

### Migration

After adding the schema, `npm run db:generate` produces a new migration file in `migrations/`. The migration is applied automatically in development via the `db-server:file` script, or manually via `npm run db:migrate`.

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | Auth check omission allows cross-user data access | Low | High | Every handler starts with `auth()` check + userId scoping; DELETE uses compound WHERE (id + userId) |
| 2 | Missing i18n keys cause `check:i18n` failure | Medium | Low | Add all keys to both `en.json` and `fr.json` simultaneously; run `bun run check:i18n` |
| 3 | French translations may be inaccurate | Medium | Low | Provide reasonable translations; can be refined by native speakers |
| 4 | knip flags unused exports from validation file | Low | Low | Ensure schemas are imported in API route; run `bun run check:deps` |
| 5 | `z.treeifyError()` is Zod v4-specific | Low | Medium | Project uses Zod 4.3.6; already used in counter route (line 15 of counter/route.ts) |
| 6 | Unbounded list growth for power users | Low | Low | No pagination in MVP; `createdAt` column supports cursor pagination as future addition |

## Deferred to Round 2

- **Edit/rename restaurant entries**: Product explicitly deferred (product.md "Features Explicitly Out of Scope").
- **Rich restaurant data fields**: Address, cuisine, rating, notes — not implied by ticket.
- **List reordering / sorting**: Not implied by "changeable list."
- **Pagination / virtual scrolling**: Deferred until list size is a concern.
- **Database index on userId**: Add when table grows; not needed for MVP query patterns.
- **Optimistic UI updates**: `router.refresh()` provides adequate UX for MVP.
- **E2E page tests**: Integration tests for API routes are higher priority; full Playwright page tests can follow.

## Summary Table

| Decision | Choice | Key Rationale |
|----------|--------|---------------|
| Architecture | API routes + client fetch + server display | Matches existing counter vertical-slice pattern |
| Auth method | `auth()` from Clerk | Lightweight; only need userId; no rate limit hit |
| User ID storage | `text` column, no FK | Clerk manages users externally; standard pattern |
| API structure | Single route.ts with GET/POST/DELETE | Flat, cohesive, follows counter pattern |
| DELETE approach | Request body `{ id }` | Keeps route flat; Zod validates |
| UI components | Server list + client form + client delete button | Server reads DB; clients handle interactions |
| Duplicates | Allowed (no unique constraint) | Product spec: duplicates OK for MVP |
| Page location | `(auth)/dashboard/favorite-restaurants/` | Behind auth; natural dashboard sibling |
| Validation | Zod schemas for add + delete | Matches CounterValidation pattern |
| Refresh strategy | `router.refresh()` after mutations | Matches CounterForm pattern |
| i18n | 4 namespaces + 1 extended | One per component/page per convention |
| New dependencies | None | Existing stack covers all needs |

## APL Statement Reference

> The favorite restaurants feature requires a new Drizzle pgTable (`favoriteRestaurantSchema`) with text `userId` column and `name` field, a single API route file handling GET/POST/DELETE with `auth()` verification, Zod validation schemas for add and delete operations, a server component for list display with direct DB reads, client components for form submission and per-item delete using fetch + `router.refresh()`, i18n keys in both locales, and a new dashboard sub-page with navigation link. All patterns follow the established counter feature vertical slice. No new dependencies are needed.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Define scope of feature request | Simple request: "changeable list of my favorite restaurants"; no elaboration |
| `scout/reference-map.json` | Map codebase structure, files, and patterns | Counter feature provides complete vertical-slice reference; no restaurant concept exists; 23 files cataloged |
| `scout/scout-summary.md` | Cross-reference analysis and quality gates | Stack confirmed; quality gates: lint, check:types, check:deps, check:i18n, test |
| `diagnosis/apl.json` | Carry forward investigation findings | Confirmed greenfield; minimal CRUD scope; user-scoping via Clerk; dashboard placement; followups=[] |
| `diagnosis/diagnosis-statement.md` | Root-cause analysis and success criteria | Not a defect; full vertical slice needed; 8 success criteria; disconfirmed alternatives |
| `product/product.md` | Product requirements and scope boundaries | MVP: add/view/remove only; duplicates allowed; no edit, no rich data, no pagination |
| `repo-guidance.json` | Repo intent classification | Single repo (next-js-boilerplate) is the target for all changes |
| `src/models/Schema.ts` | Verify schema pattern | counterSchema: serial PK, integer, timestamps with mode:'date', $onUpdate, defaultNow |
| `src/app/[locale]/api/counter/route.ts` | Verify API route pattern | PUT with Zod safeParse, Drizzle insert/upsert, NextResponse.json, 422 for validation errors |
| `src/validations/CounterValidation.ts` | Verify validation pattern | z.object() with field constraints; named export |
| `src/components/CounterForm.tsx` | Verify client form pattern | 'use client', zodResolver, useForm, fetch to API, router.refresh() |
| `src/components/CurrentCount.tsx` | Verify server component read pattern | Async server component, db.query.counterSchema.findFirst(), getTranslations |
| `src/components/Hello.tsx` | Verify user identity access | currentUser() from @clerk/nextjs/server; shows user.id is string |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Verify navigation structure | BaseTemplate leftNav with Link components; 2 existing links; need new entry |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Verify page pattern | DashboardPageProps, generateMetadata with namespace, setRequestLocale |
| `src/locales/en.json` + `src/locales/fr.json` | Verify i18n namespace structure | Namespace-based keys per component/page; DashboardLayout has nav link keys |
| `src/utils/DBConnection.ts` | Verify schema auto-discovery | Wildcard `import * as schema` means new Schema.ts exports are auto-available |
| `package.json` | Verify dependencies and scripts | All needed libs present; db:generate, db:migrate scripts available |
| `AGENTS.md` | Verify coding standards | Named exports, @/ imports, Tailwind v4, no useMemo/useCallback, Zod type-only imports, conventional commits |
| Drizzle ORM docs (Context7) | Verify pgTable text column, serial, timestamp syntax | Confirmed text().notNull(), serial().primaryKey(), pgTable third-param for constraints |
| Clerk docs (Context7) | Verify auth() vs currentUser() for route handlers | auth() returns { isAuthenticated, userId } without Backend API call; lighter than currentUser() |
