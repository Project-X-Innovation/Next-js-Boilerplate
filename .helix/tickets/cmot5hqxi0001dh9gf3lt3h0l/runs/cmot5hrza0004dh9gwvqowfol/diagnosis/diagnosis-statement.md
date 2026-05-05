# Diagnosis Statement

## Problem Summary

The ticket requests fixing a TypeScript type error where `getUserById` in `src/services/user-service.ts` returns `Promise<User | null>` but the calling code in `src/controllers/user-controller.ts` treats the result as `Promise<User>` without null-checking. The fix should add a null check and return a 404 response when the user is not found.

**Critical finding:** Neither file exists. The `src/services/` and `src/controllers/` directories are absent, and no User schema or model is defined anywhere in the codebase. This is a greenfield creation task, not a fix to existing code.

## Root Cause Analysis

The root cause is **missing implementation**: the files, directories, and data model referenced in the ticket do not exist. The repository uses Next.js App Router route handlers directly (no service/controller layer) with only `counterSchema` and `favoriteRestaurantSchema` in the Drizzle ORM schema.

The specific TypeScript concern — treating `User | null` as `User` — is a real pattern issue that `strictNullChecks: true` (tsconfig.json line 18) would catch at compile time. The implementation must:

1. **Create a `userSchema`** in `src/models/Schema.ts` defining a `user` table (requires a Drizzle migration).
2. **Create `src/services/user-service.ts`** with a `getUserById` function that queries the user table and returns `Promise<User | null>` — returning `null` when no row is found.
3. **Create `src/controllers/user-controller.ts`** that calls `getUserById`, null-checks the result, and returns a 404 `NextResponse` when the user is not found.

The service/controller pattern departs from the repo's existing convention (direct route handlers), but the ticket explicitly specifies these file paths.

## Evidence Summary

| Evidence | Finding |
|----------|---------|
| Glob `src/services/**/*` | No files found — directory does not exist |
| Glob `src/controllers/**/*` | No files found — directory does not exist |
| `src/models/Schema.ts` | Only `counterSchema` and `favoriteRestaurantSchema` — no User model |
| Grep `User` in `src/` | Only Clerk auth references (`currentUser`, `UserProfile`) and i18n strings — no local User type |
| `tsconfig.json` lines 16-18 | `strict: true`, `strictNullChecks: true` — null-handling errors are compile-time failures |
| `src/app/[locale]/api/favorite-restaurants/route.ts` | Existing pattern: Clerk `auth()`, Drizzle queries, `NextResponse.json` with status codes, Zod validation |
| `src/app/[locale]/api/counter/route.ts` | Existing pattern: direct route handler, no service abstraction |
| `AGENTS.md` | Named exports only, `@/` absolute imports, TypeScript everywhere, Conventional Commits |

## Success Criteria

1. `src/services/user-service.ts` exists with a `getUserById` function returning `Promise<User | null>`.
2. `src/controllers/user-controller.ts` exists, calls `getUserById`, includes a null check, and returns a 404 response when the user is not found.
3. A `userSchema` is defined in `src/models/Schema.ts` with a corresponding Drizzle migration.
4. `bun run check:types` passes with no type errors (strictNullChecks satisfied).
5. The code follows existing repo conventions: named exports, `@/` imports, NextResponse patterns, Drizzle ORM usage.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Primary problem statement | References non-existent files; specifies null-check fix and 404 response |
| scout/reference-map.json | File existence verification and architecture mapping | Confirmed files/directories/User model don't exist; documented existing API patterns |
| scout/scout-summary.md | Consolidated scout findings | Confirmed repo architecture (App Router, Drizzle, Clerk) and key discrepancies with ticket |
| tsconfig.json | TypeScript config verification | strictNullChecks: true makes described type error a compile-time concern |
| src/models/Schema.ts | Schema inventory | Only counter and favoriteRestaurant schemas exist; User must be created |
| src/app/[locale]/api/favorite-restaurants/route.ts | Existing API pattern reference | Clerk auth, Drizzle queries, NextResponse, Zod validation — pattern to follow |
| src/app/[locale]/api/counter/route.ts | Existing API pattern reference | Direct route handler with DB operations — confirms no service/controller abstraction |
| AGENTS.md | Coding conventions | Named exports, @/ imports, test conventions, quality gate commands |
| /tmp/helix-inspect/manifest.json | Runtime inspection availability | DATABASE and LOGS types available but not needed for this static analysis |
