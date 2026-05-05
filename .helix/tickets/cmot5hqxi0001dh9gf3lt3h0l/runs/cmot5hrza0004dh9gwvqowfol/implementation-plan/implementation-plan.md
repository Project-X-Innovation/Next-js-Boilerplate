# Implementation Plan: Fix TypeScript type error in user service

## Overview

Create three artifacts to implement a type-safe user lookup with proper null-handling:

1. Add a `userSchema` to the existing `src/models/Schema.ts` and export a `User` type via `$inferSelect`.
2. Create `src/services/user-service.ts` with a `getUserById` function returning `Promise<User | null>`.
3. Create `src/controllers/user-controller.ts` with a `getUserByIdController` function that null-checks the service result and returns `NextResponse` with 200 or 404.
4. Generate a Drizzle migration for the new `user` table.

No new dependencies are required. No UI or route-handler wiring is in scope.

## Implementation Principles

- **Follow ticket intent:** Create the exact files the ticket specifies (`src/services/user-service.ts`, `src/controllers/user-controller.ts`), even though the repo's existing convention is direct route handlers.
- **Match existing patterns:** Use the same Drizzle ORM patterns, imports, and code style as `counterSchema`, `favoriteRestaurantSchema`, and existing route handlers.
- **Repo conventions:** Named exports only, `@/` absolute imports, no `any`, TypeScript everywhere (per AGENTS.md).
- **Minimal footprint:** Only create the files, schema, and logic the ticket specifies. No route wiring, no CRUD beyond read-by-ID.
- **Type safety:** The `User | null` return type must be explicit; `strictNullChecks: true` enforces null-checking at compile time.

## Implementation Steps Summary

| Step | Goal | Deliverable |
|------|------|-------------|
| 1 | Add User schema and type | Modified `src/models/Schema.ts` with `userSchema` and exported `User` type |
| 2 | Create user service | New `src/services/user-service.ts` with `getUserById` returning `Promise<User \| null>` |
| 3 | Create user controller | New `src/controllers/user-controller.ts` with `getUserByIdController` returning `NextResponse` (200 or 404) |
| 4 | Generate Drizzle migration | New migration SQL file in `./migrations/` for the `user` table |
| 5 | Run quality gates | Verify `check:types`, `lint`, and `test` pass |

## Detailed Implementation Steps

### Step 1: Add User schema and type to `src/models/Schema.ts`

**Goal:** Define a `user` table schema and export a `User` type for compile-time type safety.

**What to Build:**

Append to `src/models/Schema.ts` (after the existing `favoriteRestaurantSchema`):

- `userSchema` using `pgTable('user', ...)` with columns:
  - `id`: `serial('id').primaryKey()`
  - `email`: `text('email').notNull()`
  - `name`: `text('name').notNull()`
  - `updatedAt`: `timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()).notNull()`
  - `createdAt`: `timestamp('created_at', { mode: 'date' }).defaultNow().notNull()`
- Export `type User = typeof userSchema.$inferSelect` as a named type export.

Pattern reference: Follow the exact column/timestamp patterns from `counterSchema` (lines 16-24) and `favoriteRestaurantSchema` (lines 26-35).

**Verification (AI Agent Runs):**

```bash
bun run check:types
```

**Success Criteria:**

- `userSchema` is exported from `src/models/Schema.ts`.
- `User` type is exported as a named type.
- `bun run check:types` passes with no errors.

---

### Step 2: Create `src/services/user-service.ts`

**Goal:** Implement a `getUserById` function that queries the user table and returns `Promise<User | null>`.

**What to Build:**

Create `src/services/user-service.ts` with:

- Import `db` from `@/libs/DB`.
- Import `userSchema` from `@/models/Schema`.
- Import `eq` from `drizzle-orm`.
- Named export: `getUserById(id: number): Promise<User | null>`
  - Query: `db.select().from(userSchema).where(eq(userSchema.id, id))` — matches the `select().from().where()` pattern used in `favorite-restaurants/route.ts` (lines 23-26).
  - Return: `result[0] ?? null` — converts `undefined` to explicit `null` for the `Promise<User | null>` contract.
- Import `type User` from `@/models/Schema` (type-only import for the return type annotation if needed for clarity, or let the compiler infer it).

**Verification (AI Agent Runs):**

```bash
bun run check:types
```

**Success Criteria:**

- `getUserById` is a named export from `src/services/user-service.ts`.
- Function signature is `(id: number) => Promise<User | null>`.
- Uses `db.select().from().where()` pattern consistent with existing code.
- Returns `null` (not `undefined`) when no user is found.
- `bun run check:types` passes.

---

### Step 3: Create `src/controllers/user-controller.ts`

**Goal:** Implement a controller function that calls `getUserById`, null-checks the result, and returns a 404 `NextResponse` when the user is not found.

**What to Build:**

Create `src/controllers/user-controller.ts` with:

- Import `getUserById` from `@/services/user-service`.
- Import `NextResponse` from `next/server`.
- Named export: `getUserByIdController(id: number): Promise<NextResponse>`
  - Call `getUserById(id)`.
  - If result is `null`, return `NextResponse.json({ error: 'User not found' }, { status: 404 })`.
  - If result is a `User`, return `NextResponse.json({ user }, { status: 200 })`.

The controller is a plain async function (not a route handler) per ticket intent and product scope.

**Verification (AI Agent Runs):**

```bash
bun run check:types
```

**Success Criteria:**

- `getUserByIdController` is a named export from `src/controllers/user-controller.ts`.
- The function performs an explicit null check on the `getUserById` result.
- Returns `NextResponse` with status 404 and error message when user is `null`.
- Returns `NextResponse` with status 200 and user data when user exists.
- `bun run check:types` passes — this confirms `strictNullChecks` is satisfied (the compiler would reject using `User | null` without narrowing).

---

### Step 4: Generate Drizzle migration

**Goal:** Generate a migration file for the new `user` table so the schema change can be applied to the database.

**What to Build:**

Run the Drizzle migration generation command:

```bash
bun run db:generate
```

This compares the current schema in `src/models/Schema.ts` against the latest snapshot in `migrations/meta/` and generates a new migration SQL file in `./migrations/` (e.g., `0002_*.sql`).

Note: `drizzle-kit generate` reads the schema file and migration snapshots only — it does not require a database connection.

**Verification (AI Agent Runs):**

```bash
ls ./migrations/0002_*.sql
```

**Success Criteria:**

- A new migration file (numbered `0002_*`) exists in `./migrations/`.
- The migration SQL contains a `CREATE TABLE "user"` statement with the expected columns.
- A corresponding snapshot file exists in `./migrations/meta/`.

---

### Step 5: Run quality gates

**Goal:** Verify all quality gates pass with the new code.

**What to Build:**

No code changes — run verification commands.

**Verification (AI Agent Runs):**

```bash
bun run check:types
bun run lint
bun run test
```

**Success Criteria:**

- `bun run check:types` exits 0 (no TypeScript errors).
- `bun run lint` exits 0 (no lint violations).
- `bun run test` exits 0 (no test failures).

---

## Verification Plan

### Pre-conditions

| Dependency | Status | Source/Evidence | Affects checks |
|------------|--------|-----------------|----------------|
| Bun runtime available | available | Package scripts use `bun run`; bun is the configured script runner | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05 |
| Node.js >= 20 | available | `package.json` engines field | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05 |
| `node_modules` installed | unknown | Must run `bun install` or equivalent before quality gates | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05 |
| `drizzle-kit` available (dev dependency) | available | `package.json` devDependencies: `drizzle-kit ^0.31.10` | CHK-04 |
| Database connection (DATABASE_URL) | unknown | Not required for `drizzle-kit generate` (schema-only comparison), but required for `drizzle-kit migrate` | CHK-04 |

### Required Checks

**[CHK-01] TypeScript type check passes**

- Action: Run `bun run check:types` (which executes `tsc --noEmit --pretty`) in the repository root.
- Expected Outcome: Command exits with code 0 and produces no type errors. This confirms that `strictNullChecks: true` is satisfied — specifically that the controller properly narrows `User | null` before using the user value.
- Required Evidence: Full command output showing successful completion with exit code 0.

**[CHK-02] Lint passes**

- Action: Run `bun run lint` (which executes `ultracite check --type-aware --type-check`) in the repository root.
- Expected Outcome: Command exits with code 0 with no lint violations in the new or modified files.
- Required Evidence: Full command output showing successful completion with exit code 0.

**[CHK-03] Tests pass**

- Action: Run `bun run test` (which executes `vitest run`) in the repository root.
- Expected Outcome: Command exits with code 0. No existing tests are broken by the new schema or files.
- Required Evidence: Full command output showing test results and exit code 0.

**[CHK-04] Drizzle migration file generated for user table**

- Action: List the `./migrations/` directory and read the newest migration SQL file (expected to be numbered `0002_*`).
- Expected Outcome: A new SQL migration file exists containing a `CREATE TABLE "user"` statement with columns `id` (serial primary key), `email` (text not null), `name` (text not null), `updated_at` (timestamp), and `created_at` (timestamp). A corresponding snapshot JSON file exists in `./migrations/meta/`.
- Required Evidence: File listing of `./migrations/` showing the new file, and the SQL content of the new migration file.

**[CHK-05] Service and controller file structure correct**

- Action: Read the contents of `src/services/user-service.ts` and `src/controllers/user-controller.ts`.
- Expected Outcome:
  - `src/services/user-service.ts` exports a named `getUserById` function with return type `Promise<User | null>` that uses `db.select().from(userSchema).where(eq(userSchema.id, id))` and returns `result[0] ?? null`.
  - `src/controllers/user-controller.ts` exports a named `getUserByIdController` function that calls `getUserById`, performs an explicit null check (`if (!user)` or equivalent), returns `NextResponse.json` with status 404 when user is null, and returns `NextResponse.json` with status 200 when user exists.
  - Both files use `@/` absolute imports and named exports only.
- Required Evidence: Full file contents of both files showing the function signatures, null-check logic, imports, and export style.

## Success Metrics

1. `src/services/user-service.ts` exists with a named-exported `getUserById` function returning `Promise<User | null>`.
2. `src/controllers/user-controller.ts` exists with a named-exported `getUserByIdController` function that null-checks and returns 404 when user is `null`.
3. `userSchema` and `User` type are exported from `src/models/Schema.ts`.
4. A Drizzle migration file is generated in `./migrations/`.
5. `bun run check:types` passes (exit code 0).
6. `bun run lint` passes (exit code 0).
7. `bun run test` passes (exit code 0).
8. All code follows repo conventions: named exports, `@/` imports, no `any`, Drizzle ORM patterns.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Primary problem statement | Specifies null-check fix on `getUserById` with 404 response; names exact file paths |
| scout/scout-summary.md | Repository architecture analysis | Confirmed neither file exists; repo uses App Router, Drizzle ORM, Clerk auth; identified service/controller pattern discrepancy |
| scout/reference-map.json | File existence and codebase facts | No User model, no services/ or controllers/ directories; file-based migration strategy with 2 existing migrations |
| diagnosis/diagnosis-statement.md | Root cause analysis | Confirmed greenfield creation task; defined success criteria including check:types and lint passing |
| diagnosis/apl.json | Diagnosis evidence | Verified file absence, strictNullChecks enabled, existing query patterns |
| product/product.md | Product scope and constraints | Route handler wiring is out of scope; minimal schema fields; eval context |
| tech-research/tech-research.md | Technology decisions | Chose `select().from().where()` pattern, `$inferSelect` for type, plain function controller; no new deps |
| tech-research/apl.json | Research conclusions | Confirmed query API choice, type inference approach, controller pattern |
| repo-guidance.json | Repo intent classification | next-js-boilerplate is the sole target repo |
| src/models/Schema.ts | Existing schema patterns | `counterSchema` and `favoriteRestaurantSchema` define the pgTable/column/timestamp patterns to follow |
| src/app/[locale]/api/favorite-restaurants/route.ts | Existing API pattern | `db.select().from().where(eq())` pattern, `NextResponse.json` with status codes |
| src/libs/DB.ts | Database connection singleton | `db` export via `@/libs/DB` — the import path for all DB access |
| src/utils/DBConnection.ts | Schema registration | Imports `* as schema from '@/models/Schema'` — all schemas must be in Schema.ts |
| tsconfig.json | TypeScript strictness config | `strict: true`, `strictNullChecks: true`, `noUnusedLocals`, `noUnusedParameters` |
| drizzle.config.ts | Migration configuration | Schema source at `./src/models/Schema.ts`, migrations output to `./migrations/` |
| package.json | Dependencies and scripts | drizzle-orm, drizzle-kit already installed; quality gate scripts confirmed |
