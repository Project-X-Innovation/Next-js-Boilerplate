# Tech Research: Fix TypeScript type error in user service

## Technology Foundation

- **Framework:** Next.js 16 with App Router (existing)
- **ORM:** Drizzle ORM v0.45.1 with PostgreSQL dialect (existing)
- **TypeScript:** v5.9.3, strict mode with `strictNullChecks: true` (existing)
- **Auth:** Clerk (`@clerk/nextjs` v7) — not directly used by this ticket's service/controller
- **Runtime:** Bun (script runner), Node.js >= 20
- **No new dependencies required** — all needed APIs are available from drizzle-orm and next/server

## Architecture Decision

### Options Considered

#### Option A: Follow existing route handler pattern (direct queries in route.ts)
- Place the getUserById query and null-check directly in a new `src/app/[locale]/api/users/[id]/route.ts` route handler.
- **Pro:** Matches the repo's established convention (counter, favorite-restaurants).
- **Con:** Directly contradicts the ticket, which explicitly specifies `src/services/user-service.ts` and `src/controllers/user-controller.ts`.

#### Option B: Create service/controller files as the ticket specifies (Chosen)
- Create `src/services/user-service.ts` with `getUserById` and `src/controllers/user-controller.ts` with a controller function that null-checks and returns NextResponse.
- **Pro:** Follows the ticket's explicit file paths and intent. Demonstrates the type-safety pattern (User | null narrowing) clearly.
- **Con:** Introduces a service/controller pattern that doesn't exist elsewhere in the repo.

#### Option C: Create service layer only, skip controller
- Only create the service with `getUserById` returning `Promise<User | null>`.
- **Con:** Ticket explicitly requires both files, with the null-check happening in the controller.

### Chosen Option: B

**Rationale:** The ticket explicitly names both file paths and describes the interaction between them (service returns `User | null`, controller null-checks). This is an eval ticket where demonstrating the correct null-handling pattern is the primary goal. The architectural departure from the existing route handler pattern is acceptable because: (1) the ticket is explicit about the file locations, (2) the scope is isolated and doesn't require migrating existing code, and (3) the product spec marks route handler wiring as out of scope.

## Core API/Methods

### 1. User Schema (`src/models/Schema.ts`)

Add `userSchema` to the existing schema file using the same `pgTable` pattern as `counterSchema` and `favoriteRestaurantSchema`.

- **Columns:** `id` (serial, PK), `email` (text, not null), `name` (text, not null), `updatedAt` (timestamp with `$onUpdate`), `createdAt` (timestamp with `defaultNow`)
- **Type export:** `type User = typeof userSchema.$inferSelect` — derives the select type from the schema for compile-time safety

**Why these columns:** The ticket requires an ID for lookup. Email and name are the minimal meaningful fields for a User record. Timestamps follow the established pattern used by all other schemas.

### 2. Service Function (`src/services/user-service.ts`)

- **Function:** `getUserById(id: number): Promise<User | null>`
- **Query pattern:** `db.select().from(userSchema).where(eq(userSchema.id, id))` — returns `User[]`
- **Null handling:** Return `result[0] ?? null` — converts `undefined` (no matching row) to an explicit `null`
- **Imports:** `db` from `@/libs/DB`, `userSchema` from `@/models/Schema`, `eq` from `drizzle-orm`

### 3. Controller Function (`src/controllers/user-controller.ts`)

- **Function:** `getUserByIdController(id: number): Promise<NextResponse>`
- **Logic:** Call `getUserById(id)`, null-check the result, return `NextResponse.json({ user }, { status: 200 })` or `NextResponse.json({ error: 'User not found' }, { status: 404 })`
- **Imports:** `getUserById` from `@/services/user-service`, `NextResponse` from `next/server`

### 4. Drizzle Migration

- Run `bun run db:generate` after adding `userSchema` to generate a migration file in `./migrations/`
- The migration creates the `user` table in PostgreSQL

## Technical Decisions

### Query API: `db.select().from().where()` vs `db.query.findFirst()`

| Aspect | `select().from().where()` | `db.query.findFirst()` |
|--------|---------------------------|------------------------|
| Return type | `User[]` (array) | `User \| undefined` |
| Repo precedent | Used by both existing route handlers | Not used anywhere |
| Null conversion | Needs `result[0] ?? null` | Needs `result ?? null` |
| **Decision** | **Chosen** — matches repo convention | Rejected |

**Rationale:** Both approaches work. The `select().from().where()` pattern is used consistently across `counter/route.ts` and `favorite-restaurants/route.ts`. Following the established convention reduces cognitive overhead.

### Type Inference: `$inferSelect` vs `InferSelectModel<>`

Both are equivalent per Drizzle docs. Using `typeof userSchema.$inferSelect` because it's the most concise form and doesn't require an additional import from `drizzle-orm`.

### Controller as Function vs Request Handler

The controller is a plain async function taking `id: number`, not a Next.js route handler taking `Request`. Reasons:
1. The ticket specifies `src/controllers/`, not `src/app/[locale]/api/` — it's not a route handler.
2. Product spec marks route handler wiring as explicitly out of scope.
3. A plain function is more testable and demonstrates the null-check pattern more clearly.

### Schema Location: Existing file vs New file

Adding `userSchema` to the existing `src/models/Schema.ts` rather than creating a new file because:
- `drizzle.config.ts` points `schema` to `./src/models/Schema.ts` — a single schema file.
- `src/utils/DBConnection.ts` imports `* as schema from '@/models/Schema'` — all schemas must be in this file for the db connection to register them.
- Both existing schemas are in this same file.

## Cross-Platform Considerations

Not applicable — this is a server-side TypeScript implementation with no platform-specific concerns.

## Performance Expectations

- **Query performance:** `SELECT * FROM user WHERE id = $1 LIMIT 1` — indexed primary key lookup, O(1) with the serial PK.
- **No caching needed:** Single record lookup by PK is fast enough without caching for this scope.
- **No N+1 risk:** Single query per request, no joins or relations.
- **Build impact:** Adding one schema and two new files has negligible impact on TypeScript compilation and Next.js build times.

## Dependencies

| Dependency | Version | Already Installed | Purpose |
|------------|---------|-------------------|---------|
| drizzle-orm | ^0.45.1 | Yes | Schema definition, query building, type inference |
| drizzle-orm/pg-core | (part of drizzle-orm) | Yes | pgTable, serial, text, timestamp column types |
| drizzle-kit | ^0.31.10 | Yes (dev) | Migration generation |
| next | ^16.2.1 | Yes | NextResponse for controller responses |

**No new dependencies required.**

## Risks

| # | Risk | Likelihood | Mitigation |
|---|------|------------|------------|
| 1 | Schema addition triggers migration that fails in CI without a database | Medium | Migration file is generated and committed; `db:migrate` runs at build time with existing DB infrastructure |
| 2 | `knip` (dep checker) flags unused exports if controller isn't wired to a route | Low | The controller is an exported function — knip may flag it as unused since no route imports it. If so, add a knip ignore comment or ensure tests import it |
| 3 | Service/controller pattern inconsistency with existing codebase | Low | Isolated to two new files; doesn't affect existing route handlers. Product spec explicitly defers broader adoption decision |

## Deferred to Round 2

- API route handler wiring (`src/app/[locale]/api/users/[id]/route.ts`) — explicitly out of scope per product spec.
- User CRUD operations beyond read-by-ID.
- Whether the service/controller pattern should be adopted repo-wide.
- Integration and e2e tests for the user endpoint (requires route wiring first).
- Clerk integration for user data (the ticket uses a local DB user, not Clerk user profile).

## Summary Table

| Decision | Choice | Rationale |
|----------|--------|-----------|
| File structure | Service + Controller per ticket | Ticket explicitly names both paths |
| Schema location | Add to existing `src/models/Schema.ts` | Drizzle config and DBConnection import require single schema file |
| Query pattern | `db.select().from().where()` | Matches both existing route handlers |
| Type inference | `typeof userSchema.$inferSelect` | Concise, no extra import needed |
| Null handling | `result[0] ?? null` in service | Explicit null (not undefined) for `Promise<User \| null>` contract |
| Controller pattern | Plain function, not route handler | Ticket scope; out-of-scope route wiring per product spec |
| New dependencies | None | All APIs available from existing packages |
| Migration | Required (`bun run db:generate`) | New table needs a migration file |

## APL Statement Reference

The implementation creates three artifacts: (1) a `userSchema` added to `src/models/Schema.ts` using the existing `pgTable` pattern with serial id, email, name, and timestamps, plus a `User` type via `$inferSelect`; (2) `src/services/user-service.ts` with a `getUserById` function using `db.select().from().where()` returning `Promise<User | null>`; (3) `src/controllers/user-controller.ts` with a `getUserByIdController` function that null-checks the service result and returns `NextResponse` with 200 or 404. A Drizzle migration must be generated. No new dependencies are required. All code follows repo conventions: named exports, `@/` imports, no `any`, Drizzle ORM patterns.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Primary problem statement | Specifies null-check fix on `getUserById` with 404 response; names exact file paths `src/services/user-service.ts` and `src/controllers/user-controller.ts` |
| scout/reference-map.json | File existence and architecture inventory | Confirmed neither file/directory exists; documented existing API patterns (direct route handlers) and schema state (no User model) |
| scout/scout-summary.md | Consolidated scout findings | Confirmed repo uses App Router, Drizzle ORM, Clerk auth; identified key discrepancies between ticket and repo state |
| diagnosis/apl.json | Diagnosis investigation context | Verified file absence, TypeScript strictNullChecks, existing patterns; concluded this is greenfield creation |
| diagnosis/diagnosis-statement.md | Root cause analysis | Confirmed missing implementation as root cause; defined success criteria including check:types passing |
| product/product.md | Product scope and constraints | Route handler wiring is out of scope; minimal schema fields acceptable; eval context confirmed |
| repo-guidance.json | Repo intent | next-js-boilerplate is the sole target repo |
| src/models/Schema.ts | Existing schema patterns | counterSchema and favoriteRestaurantSchema define the pgTable/column/timestamp patterns to follow |
| src/app/[locale]/api/favorite-restaurants/route.ts | Existing API pattern with auth | db.select().from().where(eq()) pattern, NextResponse.json with status codes, named exports |
| src/app/[locale]/api/counter/route.ts | Existing API pattern | db.insert().values().returning() with result[0]?.count access pattern |
| src/libs/DB.ts | Database connection | Singleton db export via @/libs/DB — the import path for all DB access |
| src/utils/DBConnection.ts | Schema registration | Imports `* as schema from '@/models/Schema'` — all schemas must be in Schema.ts |
| tsconfig.json | TypeScript strictness | strict: true, strictNullChecks: true — null-handling errors are compile-time failures |
| drizzle.config.ts | Migration config | Schema source at `./src/models/Schema.ts`, migrations output to `./migrations/` |
| package.json | Dependencies and scripts | drizzle-orm ^0.45.1, drizzle-kit ^0.31.10 already installed; db:generate for migrations |
| Context7 Drizzle ORM docs | Query API verification | Confirmed $inferSelect for type inference, select().from().where() returns array, findFirst returns T \| undefined |
| /tmp/helix-inspect/manifest.json | Runtime inspection availability | DATABASE and LOGS types available but not needed — no existing user data to inspect |
