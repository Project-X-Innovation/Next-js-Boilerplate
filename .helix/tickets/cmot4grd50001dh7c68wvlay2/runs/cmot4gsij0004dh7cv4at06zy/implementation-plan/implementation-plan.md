# Implementation Plan: Fix TypeScript Type Error in User Service

## Overview

Create `src/services/user-service.ts` and `src/controllers/user-controller.ts` with proper null-safety handling. This is an `[Eval]` ticket — neither file exists, and a `User` type and Drizzle schema must also be created. The deliverable is a type-safe user lookup pattern where `getUserById` returns `Promise<User | null>`, the controller null-checks the result, and returns a 404 response when the user is not found.

## Implementation Principles

- **Minimal footprint**: Only create/modify the files the ticket requires.
- **Follow existing patterns**: Match the Drizzle schema definitions in `src/models/Schema.ts` (lines 16-35), the query API in `src/app/[locale]/api/favorite-restaurants/route.ts` (lines 23-26), and the response patterns therein.
- **AGENTS.md compliance**: Named exports only, `@/` absolute imports, JSDoc, no default exports, narrowing over casting.
- **Type safety**: Respect `strictNullChecks: true` and `noUncheckedIndexedAccess: true` — use `users[0] ?? null` and `if (!user)` guard rather than type assertions.

## Implementation Steps Summary

| Step | Goal | Deliverable |
|------|------|-------------|
| 1 | Add User schema to Drizzle definitions | Modified `src/models/Schema.ts` with `userSchema` and exported `User` type |
| 2 | Generate Drizzle migration | New migration file in `./migrations/` |
| 3 | Create user service | New `src/services/user-service.ts` with `getUserById` |
| 4 | Create user controller | New `src/controllers/user-controller.ts` with null check and 404 |
| 5 | Run quality gates | Passing `check:types` and `lint` |

## Detailed Implementation Steps

### Step 1: Add userSchema to src/models/Schema.ts

**Goal**: Define the `users` database table and export an inferred `User` type.

**What to Build**:
- Add a `userSchema` pgTable definition to `src/models/Schema.ts` after the existing `favoriteRestaurantSchema` (after line 35).
- Columns follow the existing pattern observed in `counterSchema` (lines 16-24) and `favoriteRestaurantSchema` (lines 26-35):
  - `id`: `serial('id').primaryKey()`
  - `email`: `text('email').notNull()`
  - `name`: `text('name').notNull()`
  - `updatedAt`: `timestamp('updated_at', { mode: 'date' }).defaultNow().$onUpdate(() => new Date()).notNull()`
  - `createdAt`: `timestamp('created_at', { mode: 'date' }).defaultNow().notNull()`
- Export the inferred select type: `export type User = typeof userSchema.$inferSelect`

**Verification (AI Agent Runs)**:
- `bun run check:types` passes after edit.

**Success Criteria**:
- `userSchema` is a named export from `src/models/Schema.ts`.
- `User` type is exported and represents the row shape of the `users` table.
- Follows the exact column/timestamp patterns of existing schemas.

### Step 2: Generate Drizzle Migration

**Goal**: Create the migration file so the `users` table is created during build/deploy.

**What to Build**:
- Run `bun run db:generate` (which runs `drizzle-kit generate`).
- This reads the updated `src/models/Schema.ts` and outputs a new SQL migration file to `./migrations/`.
- The migration should contain a `CREATE TABLE "users"` statement.

**Verification (AI Agent Runs)**:
- Confirm a new `.sql` file exists in `./migrations/` (file name will be `0002_*.sql`).
- Read the generated file and verify it contains `CREATE TABLE "users"` with the expected columns.

**Success Criteria**:
- A new migration file exists in `./migrations/` with a sequence number after `0001_motionless_puma.sql`.
- The SQL creates the `users` table with `id`, `email`, `name`, `updated_at`, `created_at` columns.

### Step 3: Create src/services/user-service.ts

**Goal**: Implement the `getUserById` function with a `Promise<User | null>` return type.

**What to Build**:
- Create directory `src/services/` if it doesn't exist.
- Create `src/services/user-service.ts` with:
  - Imports: `eq` from `drizzle-orm`, `db` from `@/libs/DB`, `userSchema` from `@/models/Schema`, and the `User` type.
  - Named export function `getUserById` with signature `(id: number): Promise<User | null>`.
  - Query: `db.select().from(userSchema).where(eq(userSchema.id, id))` — returns an array.
  - Return: `users[0] ?? null` — under `noUncheckedIndexedAccess: true`, `users[0]` is `User | undefined`, and `?? null` coerces to `User | null`.
  - JSDoc: present-tense description, `@param`, `@returns` per AGENTS.md.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.

**Success Criteria**:
- `getUserById` is a named export returning `Promise<User | null>`.
- Uses the SQL-like Drizzle query API consistent with existing routes.
- No type assertions or casts.
- JSDoc follows AGENTS.md conventions.

### Step 4: Create src/controllers/user-controller.ts

**Goal**: Implement the controller that calls `getUserById`, null-checks the result, and returns a 404 when the user is not found.

**What to Build**:
- Create directory `src/controllers/` if it doesn't exist.
- Create `src/controllers/user-controller.ts` with:
  - Imports: `NextResponse` from `next/server`, `getUserById` from `@/services/user-service`.
  - Named export function (e.g., `handleGetUser`) accepting a `Request` parameter and returning `Promise<NextResponse>`.
  - Extract user ID from the request URL (parse from search params or path, convert to number).
  - Call `getUserById(id)` and await the result.
  - Null check: `if (!user)` → return `NextResponse.json({ error: 'User not found' }, { status: 404 })`.
  - Success path: return `NextResponse.json({ user })`.
  - JSDoc: present-tense description, `@param`, `@returns` per AGENTS.md.

**Verification (AI Agent Runs)**:
- `bun run check:types` passes.
- `bun run lint` passes.

**Success Criteria**:
- Controller null-checks the `getUserById` result using `if (!user)` narrowing.
- Returns 404 `NextResponse.json` with error message when user is null.
- Returns 200 `NextResponse.json` with user data when user is found.
- No type assertions or casts.
- All conventions from AGENTS.md followed.

### Step 5: Run Quality Gates

**Goal**: Verify all code passes TypeScript type checking and linting.

**What to Build**:
- No code changes — this is a verification-only step.
- Run `bun run check:types` and `bun run lint`.
- Fix any errors found by these gates before finalizing.

**Verification (AI Agent Runs)**:
- `bun run check:types` exits with code 0.
- `bun run lint` exits with code 0.

**Success Criteria**:
- Zero TypeScript compilation errors.
- Zero lint violations.

## Verification Plan

### Pre-conditions

| Dependency | Status | Source/Evidence | Affects checks |
|------------|--------|-----------------|----------------|
| `bun` runtime available | available | Required by all `bun run` scripts in package.json | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05 |
| `node_modules` installed | unknown | `bun install` must have been run; not verified | CHK-01, CHK-02, CHK-03, CHK-04, CHK-05 |
| `drizzle-kit` installed | unknown | Listed in devDependencies (package.json line 77); available after `bun install` | CHK-03 |
| Database connection for migration generation | unknown | `drizzle-kit generate` reads schema only (no DB needed); `drizzle-kit migrate` needs DB | CHK-03 |

### Required Checks

**[CHK-01] TypeScript compilation passes with no errors**

- Action: Run `bun run check:types` from the repository root.
- Expected Outcome: The command exits with code 0 and produces no type errors. Specifically, no errors related to `User | null` being used as `User` in the controller.
- Required Evidence: Full command output showing successful completion with exit code 0.

**[CHK-02] Lint passes with no violations**

- Action: Run `bun run lint` from the repository root.
- Expected Outcome: The command exits with code 0 with no lint errors or warnings in the new files (`src/services/user-service.ts`, `src/controllers/user-controller.ts`) or the modified file (`src/models/Schema.ts`).
- Required Evidence: Full command output showing successful completion with exit code 0.

**[CHK-03] Drizzle migration file generated for users table**

- Action: After adding `userSchema` to `src/models/Schema.ts`, run `bun run db:generate` and list files in `./migrations/`.
- Expected Outcome: A new SQL migration file exists in `./migrations/` with a sequence number after `0001_motionless_puma.sql`. The file contains a `CREATE TABLE "users"` statement with columns `id`, `email`, `name`, `updated_at`, `created_at`.
- Required Evidence: File listing of `./migrations/` directory showing the new migration file, plus the content of the new migration SQL file.

**[CHK-04] getUserById returns Promise<User | null> and service file follows conventions**

- Action: Read `src/services/user-service.ts` and verify: (1) `getUserById` is a named export, (2) the return type is `Promise<User | null>`, (3) the query uses `db.select().from(userSchema).where(eq(userSchema.id, id))`, (4) null handling uses `?? null` pattern, (5) imports use `@/` absolute paths, (6) JSDoc is present with `@param` and `@returns`.
- Expected Outcome: All six criteria are satisfied in the source file.
- Required Evidence: File content of `src/services/user-service.ts` showing the function signature, query, null handling, imports, and JSDoc.

**[CHK-05] Controller null-checks result and returns 404 response**

- Action: Read `src/controllers/user-controller.ts` and verify: (1) the controller is a named export function, (2) it calls `getUserById`, (3) it null-checks with `if (!user)` narrowing (not a type assertion), (4) it returns `NextResponse.json({ error: 'User not found' }, { status: 404 })` for null, (5) it returns `NextResponse.json` with user data for found users, (6) imports use `@/` absolute paths, (7) JSDoc is present.
- Expected Outcome: All seven criteria are satisfied in the source file.
- Required Evidence: File content of `src/controllers/user-controller.ts` showing the function, null check, 404 response, success response, imports, and JSDoc.

## Success Metrics

1. `src/services/user-service.ts` exists with a named export `getUserById` returning `Promise<User | null>`.
2. `src/controllers/user-controller.ts` exists, calls `getUserById`, null-checks the result with `if (!user)`, and returns a 404 `NextResponse.json` response when the user is not found.
3. `src/models/Schema.ts` contains `userSchema` and exports a `User` type via `$inferSelect`.
4. A Drizzle migration file for the `users` table exists in `./migrations/`.
5. `bun run check:types` passes with exit code 0.
6. `bun run lint` passes with exit code 0.
7. All new code follows AGENTS.md conventions: named exports, `@/` imports, JSDoc, no default exports, narrowing over casting.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Primary problem statement | Create service + controller; null-check getUserById; return 404; [Eval] ticket |
| scout/scout-summary.md | Codebase architecture and file existence | Neither file exists; strictNullChecks enabled; quality gates documented |
| scout/reference-map.json | Detailed file inventory and ORM strategy | File-based Drizzle migrations; schema at src/models/Schema.ts; no User type exists |
| diagnosis/diagnosis-statement.md | Root cause analysis | Confirmed eval ticket; files must be created from scratch |
| diagnosis/apl.json | Investigation findings | No User schema; strictNullChecks; existing inline data access patterns |
| product/product.md | Scope boundaries | MVP: User type + service + controller + 404; no route wiring or tests required |
| tech-research/tech-research.md | Architecture decisions | Option A chosen: Drizzle schema + $inferSelect; SQL-like query API; migration required |
| tech-research/apl.json | Technical findings | $inferSelect confirmed; noUncheckedIndexedAccess affects null pattern; migration is standard workflow |
| repo-guidance.json | Repo intent | Single target repo: next-js-boilerplate |
| src/models/Schema.ts | Existing schema pattern | pgTable with serial id, text fields, timestamp pattern (lines 16-35) |
| src/app/[locale]/api/favorite-restaurants/route.ts | Existing query and response patterns | db.select().from().where(), NextResponse.json with status codes |
| src/libs/DB.ts | Database access pattern | Singleton `db` instance via `import { db } from '@/libs/DB'` |
| tsconfig.json | TypeScript strictness | strictNullChecks (line 18), noUncheckedIndexedAccess (line 25) |
| drizzle.config.ts | Migration config | Migrations output to ./migrations/, schema at ./src/models/Schema.ts |
| package.json | Scripts and dependencies | db:generate runs drizzle-kit generate; build runs db:migrate then next build |
| AGENTS.md | Coding conventions | Named exports, @/ imports, JSDoc, narrowing over casting |
