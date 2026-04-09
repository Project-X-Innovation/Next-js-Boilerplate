# Tech Research: Changeable List of Favorite Restaurants

## Technology Foundation

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Framework | Next.js (App Router) | 16.2.1 | Pages, API routes, server/client components |
| UI Library | React | 19.2.4 | Component rendering (with React Compiler in prod) |
| Database ORM | Drizzle ORM | 0.45.1 | Schema definition, migrations, type-safe queries |
| Database | PostgreSQL (PGlite dev) | - | Data persistence |
| Auth | Clerk | 7.0.6 | User identity, route protection |
| i18n | next-intl | 4.8.3 | Translations, locale-aware routing |
| Validation | Zod | 4.3.6 | Request/form validation schemas |
| Forms | react-hook-form | 7.71.2 | Client-side form state + @hookform/resolvers |
| Styling | Tailwind CSS | 4.2.2 | Utility-first CSS classes |
| Testing | Playwright / Vitest | 1.58.2 / 4.1.0 | Integration + unit tests |

No new dependencies are required. The existing stack fully supports the feature.

## Architecture Decision

### Options Considered

#### Option A: API Routes + Client Fetch (Chosen)
- Client component uses `fetch()` to API routes for mutations (POST, DELETE)
- Server component reads data directly via `db.query` for display
- `router.refresh()` after mutations to re-render server component
- **Pros**: Matches the existing counter pattern exactly; no new paradigm; clear separation of concerns; API routes are testable via Playwright
- **Cons**: Slightly more boilerplate than server actions

#### Option B: Server Actions
- Use `'use server'` functions for add/delete mutations
- Call from client component via form action or direct invocation
- **Pros**: Less boilerplate; built-in form integration; progressive enhancement
- **Cons**: Introduces a new pattern not used anywhere in the codebase; no existing test pattern for server actions; inconsistent with counter feature approach

#### Option C: Full Client-Side with SWR/React Query
- Manage all data fetching and mutations from client components
- **Pros**: Rich client-side caching and optimistic updates
- **Cons**: Adds new dependency; over-engineered for a simple list; loses server component benefits; inconsistent with codebase patterns

### Chosen: Option A — API Routes + Client Fetch

**Rationale**: The codebase has exactly one data-backed feature (counter) and it uses this pattern consistently across schema, API route, validation, client form, and server display. Introducing server actions or a client-side data library would create pattern fragmentation for no clear benefit. Following the established pattern reduces implementation risk and keeps the codebase consistent.

## Core API/Methods

### Database Schema

New table `favorite_restaurants` in `src/models/Schema.ts`:

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | `serial` | Primary key | Row identifier |
| `userId` | `text` | Not null | Clerk user ID for scoping |
| `name` | `text` | Not null | Restaurant name (free-form) |
| `updatedAt` | `timestamp` | Not null, defaultNow, $onUpdate | Audit trail |
| `createdAt` | `timestamp` | Not null, defaultNow | Audit trail |

Design notes:
- `userId` is `text` because Clerk IDs are strings (`user_xxxx` format).
- No unique constraint on `(userId, name)` — product spec explicitly allows duplicate names for MVP simplicity (product.md Open Questions #4).
- Timestamp columns follow the exact `counterSchema` pattern (`mode: 'date'`, `$onUpdate(() => new Date())`).
- No foreign key to a users table — Clerk manages users externally; the userId column is just a filter key.

### API Route Design

Single route file: `src/app/[locale]/api/favorite-restaurants/route.ts`

| Method | Purpose | Auth | Input | Response |
|--------|---------|------|-------|----------|
| `GET` | List user's favorites | Required (401) | None (userId from auth) | `{ favorites: [...] }` (200) |
| `POST` | Add a favorite | Required (401) | `{ name: string }` (Zod validated) | `{ favorite: {...} }` (200) or validation error (422) |
| `DELETE` | Remove a favorite | Required (401) | `{ id: number }` (Zod validated) | `{ favorite: {...} }` (200) or validation error (422) |

Authentication pattern (from Clerk docs, verified via Context7):
```
const { isAuthenticated, userId } = await auth()
if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

This uses `auth()` rather than `currentUser()` because:
- `auth()` is lightweight — returns only the Auth object without fetching the full Backend User
- We only need `userId` for DB scoping, not email or profile data
- Aligns with Clerk's documented best practice for route handler protection

### Validation Schemas

File: `src/validations/FavoriteRestaurantValidation.ts`

Two Zod schemas:
- **Add**: `z.object({ name: z.string().min(1).max(255) })` — ensures non-empty name with reasonable length
- **Delete**: `z.object({ id: z.number().int().positive() })` — validates positive integer ID

Follows the existing `CounterValidation.ts` pattern: named export, `z.object()`, field constraints.

### UI Component Architecture

| Component | Type | File | Responsibility |
|-----------|------|------|----------------|
| `FavoriteRestaurantList` | Server | `src/components/FavoriteRestaurantList.tsx` | Reads DB via `db.query`, renders list with delete buttons, handles empty state |
| `FavoriteRestaurantForm` | Client | `src/components/FavoriteRestaurantForm.tsx` | `'use client'`, react-hook-form + zodResolver, fetch POST to API, router.refresh() |
| Favorites Page | Page | `src/app/[locale]/(auth)/dashboard/favorite-restaurants/page.tsx` | Composes FavoriteRestaurantList + FavoriteRestaurantForm, handles locale/metadata |

Server component pattern (follows `CurrentCount.tsx`):
- Uses `db.query.favoriteRestaurantsSchema.findMany({ where: eq(schema.userId, userId) })`
- Gets user via `auth()` for userId
- Uses `getTranslations` for i18n strings

Client component pattern (follows `CounterForm.tsx`):
- `'use client'` directive
- `useTranslations` for i18n
- `useForm` with `zodResolver`
- `fetch('/api/favorite-restaurants', { method: 'POST' })` then `router.refresh()`
- Delete action: `fetch('/api/favorite-restaurants', { method: 'DELETE' })` then `router.refresh()`

**Vercel best practice applied**: The server component passes only `id` and `name` to any client-side delete handler — minimizing serialization at the RSC boundary (`server-serialization` rule).

## Technical Decisions

### 1. User scoping via userId text column (not foreign key)

**Chosen**: Store Clerk `userId` as a plain `text` column with no FK constraint.
**Rejected**: Creating a local users table with FK relationship.
**Rationale**: Clerk manages users externally. There is no local users table in the codebase, and creating one just for a FK constraint adds unnecessary complexity. The userId column is simply a filter/partition key. This is the standard pattern for external auth providers with Drizzle.

### 2. Single route file for all HTTP methods

**Chosen**: One `route.ts` exporting `GET`, `POST`, `DELETE`.
**Rejected**: Separate directories (e.g., `/api/favorite-restaurants/[id]/route.ts` for DELETE).
**Rationale**: The feature is simple enough that a single file keeps it cohesive. The counter uses one file with one method. Three methods in one file is still manageable. If the feature grows, it can be split later.

### 3. DELETE by id in request body (not URL param)

**Chosen**: `DELETE` with `{ id: number }` in the JSON body.
**Rejected**: Dynamic route segment `[id]` for DELETE.
**Rationale**: Keeps the route structure flat (single `route.ts` file). The existing counter pattern uses request body for data. While REST purists prefer URL params for DELETE, the body approach is simpler here and avoids an additional route file. Zod validates the id.

### 4. No pagination for MVP

**Chosen**: Return all favorites for the user in a single query.
**Rejected**: Implementing cursor-based or offset pagination.
**Rationale**: Product spec explicitly defers pagination ("Defer until list size becomes a concern"). A typical user's favorite restaurant list is unlikely to exceed a few dozen items. If performance issues arise, pagination can be added without schema changes.

### 5. Auth check via auth() not currentUser()

**Chosen**: `auth()` from `@clerk/nextjs/server`.
**Rejected**: `currentUser()` from `@clerk/nextjs/server`.
**Rationale**: `auth()` returns only the lightweight Auth object with `userId` and `isAuthenticated`. `currentUser()` fetches the full Backend User object from Clerk's API, which is unnecessary when we only need the userId for DB scoping. Per Clerk docs, `auth()` is the recommended approach for route handlers.

### 6. router.refresh() for list updates (not revalidation tags)

**Chosen**: Client calls `router.refresh()` after mutation to re-fetch server component data.
**Rejected**: `revalidateTag()` / `revalidatePath()` via server actions.
**Rationale**: The existing counter pattern uses `router.refresh()` in `CounterForm.tsx` (line 29). This triggers a server-side re-render of the current page, which re-executes the server component's DB query. It's the simplest approach and matches the established pattern.

## Cross-Platform Considerations

Not applicable — this is a web-only Next.js application. The feature is entirely within the existing web stack.

## Performance Expectations

| Aspect | Expectation | Basis |
|--------|-------------|-------|
| DB query (list) | < 50ms | Simple SELECT with userId equality filter on small table |
| DB insert (add) | < 50ms | Single row INSERT with RETURNING |
| DB delete (remove) | < 50ms | Single row DELETE with compound WHERE (id + userId) |
| Page load | Negligible impact | Server component renders list during SSR; no client-side fetch waterfall |
| Bundle impact | Minimal | One new client component (~1KB); no new dependencies |

**Optimization notes**:
- The server component reads data directly from DB (no API round-trip for display) — avoids the client fetch waterfall pattern.
- `auth()` is faster than `currentUser()` since it doesn't fetch the full user object.
- No index is needed on `userId` for MVP. If the table grows significantly, adding an index on `userId` would improve query performance. This is a future optimization.

## Dependencies

### Existing (no additions needed)

| Package | Usage in Feature |
|---------|-----------------|
| `drizzle-orm` | Schema definition, query builder, migrations |
| `@clerk/nextjs` | `auth()` for user identity in API routes and server components |
| `zod` | Request validation schemas |
| `react-hook-form` + `@hookform/resolvers` | Client form state management |
| `next-intl` | `getTranslations` (server) / `useTranslations` (client) |
| `next` | API routes, App Router, server/client components |

### Migration dependency

After adding the schema, `npm run db:generate` must be run to produce a new migration in `migrations/`. The migration journal (`migrations/meta/_journal.json`) will get a new entry at index 1. The migration is applied automatically in development via `db-server:file` script or manually via `npm run db:migrate`.

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | Auth check omission in API route allows cross-user data access | Low (code review catches) | High (data leak) | Every handler must start with `auth()` check + userId scoping. Integration tests should verify 401 for unauthenticated requests. |
| 2 | Missing i18n keys cause check:i18n failure | Medium | Low (build gate) | Add all keys to both `en.json` and `fr.json` simultaneously. Run `bun run check:i18n` before finalizing. |
| 3 | knip flags unused exports from new validation file | Low | Low (build gate) | Ensure validation schemas are imported in the API route. Run `bun run check:deps` to verify. |
| 4 | Drizzle migration generation produces unexpected SQL | Low | Medium | Review generated migration SQL before applying. The schema is simple (one table, no relations). |
| 5 | Delete without userId scoping allows users to delete others' entries | Low (code review catches) | High (data integrity) | DELETE WHERE must always include both `id` AND `userId` conditions. Integration tests should cover this. |

## Deferred to Round 2

- **Edit/rename restaurant entries**: Product explicitly deferred update operations.
- **Rich restaurant data fields**: Address, cuisine, rating, notes — not implied by ticket.
- **Pagination / virtual scrolling**: Deferred until list size is a concern.
- **Database index on userId**: Add when table grows; not needed for MVP query patterns.
- **List reordering / sorting**: Not implied by "changeable list."
- **Optimistic UI updates**: `router.refresh()` provides good-enough UX for MVP.
- **E2E tests for UI**: Integration tests cover API routes; full E2E page tests are lower priority.

## Summary Table

| Decision | Choice | Key Rationale |
|----------|--------|---------------|
| Architecture | API routes + client fetch + server component display | Matches existing counter pattern |
| Auth in API | `auth()` from Clerk | Lightweight; only need userId |
| Schema | `favorite_restaurants` table with userId text column | Standard external auth pattern; no FK needed |
| Mutations | POST (add) / DELETE (remove) in single route.ts | Simple, cohesive, follows counter pattern |
| UI | Server component (list) + client component (form) | Server reads DB directly; client fetches API |
| Validation | Zod schemas for add + delete | Matches CounterValidation pattern |
| i18n | New keys in FavoriteRestaurants / FavoriteRestaurantForm namespaces | Follows namespace convention |
| Refresh | `router.refresh()` after mutations | Matches CounterForm pattern |
| Tests | Playwright integration tests for API routes | Matches Counter.spec.ts pattern |
| New dependencies | None | Existing stack covers all needs |

## APL Statement Reference

> The favorite restaurants feature requires a new Drizzle pgTable with user-scoping via Clerk userId (text column), a single API route file handling GET/POST/DELETE with auth() verification, Zod validation schemas, a server component for list display with direct DB reads, a client component form using fetch + router.refresh(), i18n keys in both locales, and a Playwright integration test suite. All patterns follow the established counter feature vertical slice. No new dependencies are needed.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `ticket.md` | Define scope of feature request | Simple request: "changeable list of my favorite restaurants"; no elaboration |
| `scout/reference-map.json` | Map codebase structure and existing patterns | Counter feature provides complete vertical-slice reference; no restaurant concept exists |
| `scout/scout-summary.md` | Cross-reference analysis and quality gates | Stack confirmed (Next.js 16, Drizzle 0.45, Clerk 7, next-intl, Zod); quality gates listed |
| `diagnosis/apl.json` | Carry forward investigation findings | Confirmed greenfield feature; minimal CRUD scope; user-scoping via Clerk; dashboard placement |
| `diagnosis/diagnosis-statement.md` | Root cause and success criteria | Not a defect; full vertical slice needed; 8 success criteria defined |
| `product/product.md` | Product scope, use cases, and exclusions | MVP: add/view/remove only; duplicates allowed; no edit, no rich data, no pagination |
| `repo-guidance.json` | Repo intent | Single repo (next-js-boilerplate) is the target for all changes |
| `src/models/Schema.ts` | Verify schema patterns | counterSchema: serial PK, timestamps with $onUpdate, defaultNow |
| `src/app/[locale]/api/counter/route.ts` | Verify API route pattern | PUT with Zod safeParse, Drizzle insert/upsert, NextResponse.json |
| `src/validations/CounterValidation.ts` | Verify validation pattern | z.object() with field constraints; named export |
| `src/components/CounterForm.tsx` | Verify client form pattern | 'use client', zodResolver, useForm, fetch to API, router.refresh() |
| `src/components/CurrentCount.tsx` | Verify server component read pattern | db.query with findFirst, getTranslations, headers |
| `src/components/Hello.tsx` | Verify user identity access | currentUser() from Clerk; shows user.id availability |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Verify navigation structure | BaseTemplate leftNav with Link; need new entry |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Verify page pattern | Locale params, setRequestLocale, generateMetadata |
| `src/locales/en.json` | Verify i18n namespace structure | Namespace-based keys; DashboardLayout has nav link keys |
| `src/utils/DBConnection.ts` | Verify schema auto-discovery | Wildcard `import * as schema` means new exports auto-available |
| `tests/integration/Counter.spec.ts` | Verify test pattern | Playwright page.request with status/JSON assertions |
| `package.json` | Verify dependencies and scripts | All needed libs present; db:generate for migrations |
| `AGENTS.md` | Verify coding standards | Named exports, @/ imports, Tailwind v4, no useMemo/useCallback, Zod type-only imports |
| Clerk docs (Context7) | Verify auth() API for route handlers | `auth()` returns { isAuthenticated, userId }; lighter than currentUser() |
| Drizzle ORM docs (Context7) | Verify delete with returning, pgTable text column | db.delete(table).where(eq(...)).returning() confirmed |
| Vercel React best practices | Verify React/Next.js patterns | async-parallel for concurrent fetches; server-auth-actions for auth; server-serialization for minimal props |
