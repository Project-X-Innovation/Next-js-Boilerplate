# Tech Research: Fix TypeScript Type Error in User Service

## Technology Foundation

- **Framework**: Next.js 16 with App Router, TypeScript 5.9 with `strict: true` and `strictNullChecks: true`
- **ORM**: Drizzle ORM ^0.45.1 with PostgreSQL via `pg` Pool
- **Type Checking**: `tsc --noEmit --pretty` (via `bun run check:types`)
- **Linting**: `ultracite check --type-aware --type-check` (via `bun run lint`)
- **Conventions**: Named exports only, `@/` absolute imports, JSDoc, no default exports (AGENTS.md)

The TypeScript configuration is maximally strict: `strictNullChecks`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`. This means every nullable path must be explicitly narrowed.

## Architecture Decision

### Problem

Both `src/services/user-service.ts` and `src/controllers/user-controller.ts` must be created from scratch. No `User` type or database schema exists. The ticket requires a `getUserById` function returning `Promise<User | null>` and a controller that null-checks the result, returning a 404 when the user is not found.

### Options Considered

| # | Option | Description | Pros | Cons |
|---|--------|-------------|------|------|
| A | **Drizzle schema + inferred type** | Add `userSchema` to `src/models/Schema.ts`, infer `User` type via `$inferSelect`, service queries DB | Follows existing codebase pattern exactly; single source of truth for type; realistic query code | Requires migration generation; adds a real DB table |
| B | Standalone interface + stub data | Define `User` interface in a separate file, service returns hardcoded/in-memory data | No migration needed; simpler | Diverges from existing patterns; stub data is not production-realistic |
| C | Standalone interface + Drizzle query | Define interface separately, write Drizzle queries against a hypothetical table | Some pattern consistency | Type and schema diverge; maintenance burden; not DRY |

### Chosen: Option A - Drizzle schema + inferred type

**Rationale**: The codebase exclusively uses Drizzle ORM with pgTable definitions in `src/models/Schema.ts` for data types and queries (observed in `counterSchema` lines 16-24 and `favoriteRestaurantSchema` lines 26-35 of Schema.ts). Deriving the `User` type from the schema via `$inferSelect` is the Drizzle-idiomatic approach (confirmed via Drizzle ORM docs). This keeps the User type as the single source of truth and makes the service code consistent with the existing favorite-restaurants route pattern (observed at `src/app/[locale]/api/favorite-restaurants/route.ts` lines 23-26).

The migration generation is a mechanical consequence of the schema change (`bun run db:generate`) and is low-cost. The build script already runs `db:migrate` before `next build` (package.json line 8: `"build": "run-s db:migrate build:next"`), so the pattern is already established.

## Core API/Methods

### User Schema (in `src/models/Schema.ts`)

Add `userSchema` as a Drizzle `pgTable` definition following the existing pattern:
- `id`: `serial('id').primaryKey()` (matches counterSchema, favoriteRestaurantSchema)
- `email`: `text('email').notNull()`
- `name`: `text('name').notNull()`
- `updatedAt`: timestamp with `$onUpdate(() => new Date())` (matches existing pattern on Schema.ts lines 19-21)
- `createdAt`: timestamp with `defaultNow()` (matches existing pattern on Schema.ts line 23)

Export the inferred type: `type User = typeof userSchema.$inferSelect`

This follows the Drizzle ORM documented approach for type inference (confirmed via Context7: `$inferSelect` is the current recommended API as of drizzle-orm 0.28.3+).

### getUserById (in `src/services/user-service.ts`)

- **Signature**: `getUserById(id: number): Promise<User | null>`
- **Query pattern**: `db.select().from(userSchema).where(eq(userSchema.id, id))` - returns an array
- **Null handling**: `return users[0] ?? null`
  - With `noUncheckedIndexedAccess: true` in tsconfig.json (line 25), `users[0]` is typed as `User | undefined`
  - The `?? null` coerces to `User | null`, matching the declared return type

This uses the SQL-like query API (not the relational `findFirst()` API) for consistency with existing query patterns in the codebase (e.g., favorite-restaurants route.ts lines 23-26).

### User Controller (in `src/controllers/user-controller.ts`)

- **Signature**: Named export function accepting a `Request` and returning `Promise<NextResponse>`
- **Null narrowing**: `if (!user)` guard before proceeding (narrowing over casting, per AGENTS.md)
- **404 response**: `NextResponse.json({ error: 'User not found' }, { status: 404 })` (follows existing error response pattern, e.g., 401 at favorite-restaurants route.ts line 20)
- **200 response**: `NextResponse.json({ user })` when found

## Technical Decisions

### 1. User Type Derivation

**Decision**: Use `typeof userSchema.$inferSelect` exported from Schema.ts.

**Rejected alternative**: Standalone `interface User` in a separate types file. Rejected because it would diverge from the codebase's pattern of deriving types from Drizzle schemas, creating a maintenance burden if the schema ever changes.

### 2. Query API Choice

**Decision**: Use `db.select().from(userSchema).where(...)` (SQL-like API).

**Rejected alternative**: `db.query.userSchema.findFirst({ where: ... })` (relational API). While `findFirst()` is semantically cleaner for single-record lookups, the existing codebase exclusively uses the SQL-like API. Consistency takes priority.

### 3. Controller as Standalone Function (not API Route Handler)

**Decision**: The controller is a standalone named export function, not wired to a Next.js API route.

**Rationale**: The ticket specifies only `src/controllers/user-controller.ts`, not an API route. Product spec explicitly excludes route wiring. The controller demonstrates the null-check pattern independent of routing.

### 4. Migration Generation

**Decision**: Generate a Drizzle migration via `bun run db:generate` after adding `userSchema`.

**Rationale**: This is the standard workflow for any Schema.ts change (documented in Schema.ts comments lines 5-8). Without the migration, the build's `db:migrate` step would not create the table, and any runtime call to `getUserById` would fail. The migration is a mechanical, zero-risk step.

### 5. Parameter Extraction in Controller

**Decision**: The controller function accepts a `Request` parameter and extracts the user ID from the URL.

**Rationale**: This follows the pattern of existing route handlers (e.g., counter route.ts line 10: `async (request: Request)`). The ID should be parsed from the URL path or search parameters, with appropriate validation.

## Cross-Platform Considerations

Not applicable. This is a server-side TypeScript change with no client/browser impact.

## Performance Expectations

- **Query**: Single-row SELECT with primary key lookup (`WHERE id = ?`) - O(1) with index.
- **No bundle impact**: Service and controller files are server-side only; they do not affect client bundle size.
- **No behavioral change to existing functionality**: New files only; no existing code is modified (except the additive change to Schema.ts).

## Dependencies

| Dependency | Version | Purpose | Already in Project |
|---|---|---|---|
| drizzle-orm | ^0.45.1 | ORM for DB queries and type inference (`$inferSelect`, `eq`) | Yes (package.json line 39) |
| drizzle-orm/pg-core | (part of drizzle-orm) | `pgTable`, `serial`, `text`, `timestamp` for schema definition | Yes (Schema.ts line 1) |
| next/server | (part of next) | `NextResponse` for controller responses | Yes (favorite-restaurants/route.ts line 3) |
| drizzle-kit | ^0.31.10 | Migration generation (`db:generate`) | Yes (package.json devDependencies) |

**No new dependencies required.** All imports are from packages already in the project.

## Deferred to Round 2

| Item | Reason |
|---|---|
| API route wiring (`src/app/[locale]/api/users/[id]/route.ts`) | Explicitly out of scope per product spec; ticket only specifies service + controller |
| Authentication on user endpoint | Ticket does not mention auth requirements for this flow |
| CRUD operations beyond read-by-ID | Ticket only references `getUserById` |
| Unit tests for service and controller | Not required by ticket; quality gates focus on type-checking and lint |
| Refactoring existing routes to service/controller pattern | Scoped to two files only; no existing code restructuring |

## Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|-----------|
| 1 | `knip` (check:deps) flags unused exports if controller is not imported anywhere | Medium | Low | The controller is a standalone demonstration file; if `knip` flags it, the controller's export can be consumed by a test or route in a future ticket |
| 2 | Migration not generated during implementation | Low | Medium | Implementation must run `bun run db:generate` after Schema.ts change; verify migration file appears in `./migrations/` |
| 3 | Lint rules reject some pattern in new files | Low | Low | Follow existing patterns exactly; run `bun run lint` during implementation |
| 4 | New directories (`src/services/`, `src/controllers/`) create precedent for architectural drift | Low | Low | Scoped to this ticket; does not require existing code to adopt the pattern |

## Summary Table

| Aspect | Decision |
|---|---|
| User type source | `typeof userSchema.$inferSelect` from Schema.ts |
| Schema location | `src/models/Schema.ts` (add `userSchema` pgTable) |
| Service location | `src/services/user-service.ts` |
| Controller location | `src/controllers/user-controller.ts` |
| Query API | SQL-like: `db.select().from().where()` |
| Null handling | `users[0] ?? null` in service; `if (!user)` guard in controller |
| 404 response | `NextResponse.json({ error: 'User not found' }, { status: 404 })` |
| Migration | Generate via `bun run db:generate` |
| New dependencies | None |
| Files created | 2 new files (`user-service.ts`, `user-controller.ts`) |
| Files modified | 1 existing file (`src/models/Schema.ts`) |
| API route | Not created (out of scope) |
| Tests | Not created (not required by ticket) |

## APL Statement Reference

See `tech-research/apl.json` for the complete investigation loop. Key findings carried forward from diagnosis:
- Both target files do not exist and must be created (diagnosis/apl.json answer 1)
- No User type exists; must be derived from a new Drizzle schema (diagnosis/apl.json answer 2)
- `strictNullChecks: true` confirms the described type error pattern (diagnosis/apl.json answer 3)
- Existing patterns use inline Drizzle queries with NextResponse (diagnosis/apl.json answer 4)

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Primary requirements | Create service + controller; null-check getUserById; return 404 |
| scout/reference-map.json | File existence and codebase structure | Neither target file exists; no User type; Drizzle ORM patterns documented |
| scout/scout-summary.md | Consolidated analysis | Confirmed architecture, quality gates, conventions |
| diagnosis/apl.json | Investigation findings to carry forward | Root cause is file absence; strictNullChecks enforces the pattern; existing data access is inline |
| diagnosis/diagnosis-statement.md | Root cause and success criteria | Eval ticket; files must be created; type-check and lint must pass |
| product/product.md | Scope boundaries and features | MVP: User type + service + controller + 404; no migration, route, or tests required |
| repo-guidance.json | Repo intent | Single target repo: next-js-boilerplate |
| src/models/Schema.ts | Existing Drizzle schema pattern | pgTable with serial id, text fields, timestamp pattern to follow |
| src/app/[locale]/api/favorite-restaurants/route.ts | Existing query and response patterns | db.select().from().where(), NextResponse.json with status codes |
| src/libs/DB.ts | Database access pattern | Singleton `db` instance via `import { db } from '@/libs/DB'` |
| src/utils/DBConnection.ts | Drizzle connection setup | Uses `schema` import, enabling both SQL-like and relational query APIs |
| tsconfig.json | TypeScript strictness | strictNullChecks, noUncheckedIndexedAccess — both affect the null-handling pattern |
| package.json | Dependencies and scripts | drizzle-orm ^0.45.1; build runs db:migrate; no new deps needed |
| AGENTS.md | Coding conventions | Named exports, @/ imports, JSDoc, narrowing over casting |
| Drizzle ORM docs (Context7) | Type inference API verification | `$inferSelect` is current recommended API; confirmed pgTable type inference pattern |
