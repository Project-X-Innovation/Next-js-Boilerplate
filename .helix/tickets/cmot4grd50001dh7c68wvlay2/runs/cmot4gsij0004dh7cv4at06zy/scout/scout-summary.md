# Scout Summary

## Problem

The ticket requests fixing a TypeScript type error where `getUserById` in `src/services/user-service.ts` returns `Promise<User | null>` but calling code in `src/controllers/user-controller.ts` treats it as `Promise<User>` without null-checking. A null check and 404 response should be added.

**Critical finding**: Neither file exists. The directories `src/services/` and `src/controllers/` do not exist in the repository. No `User` type or schema is defined anywhere in the codebase. These files must be created.

## Analysis Summary

### Repository Architecture (ticket-relevant)

- **Framework**: Next.js 16 with App Router, TypeScript strict mode (`strictNullChecks: true`)
- **ORM**: Drizzle ORM with PostgreSQL. File-based migrations in `./migrations/`. Schema at `src/models/Schema.ts` (defines `counterSchema`, `favoriteRestaurantSchema` only).
- **Auth**: Clerk (`@clerk/nextjs`); `auth()` provides `userId`
- **Existing data access pattern**: Inline in API route handlers (`src/app/[locale]/api/*/route.ts`). No service or controller layer exists.
- **Validation**: Zod schemas in `src/validations/`
- **Response pattern**: `NextResponse.json()` with status codes (401 unauthorized, 422 validation error)

### What Exists vs. What's Needed

| Aspect | Current State | Ticket Expectation |
|---|---|---|
| `src/services/user-service.ts` | Does not exist | File with `getUserById` returning `Promise<User \| null>` |
| `src/controllers/user-controller.ts` | Does not exist | File calling `getUserById` without null check (the bug) |
| `src/services/` directory | Does not exist | New directory needed |
| `src/controllers/` directory | Does not exist | New directory needed |
| User type/model | Does not exist | Needed by `getUserById` return type |

### Quality Gates

| Gate | Command | Notes |
|---|---|---|
| Type check | `bun run check:types` / `tsc --noEmit --pretty` | Would catch the described `User \| null` vs `User` error |
| Lint | `bun run lint` / `ultracite check --type-aware --type-check` | Type-aware lint; would also surface type errors |
| Test | `bun run test` / `vitest run` | Unit tests with vitest |
| Build | `bun run build` / `run-s db:migrate build:next` | Runs migrations then builds |

### Key Conventions (from AGENTS.md)

- Named exports only (no default exports except Next.js pages)
- Absolute imports via `@/`
- TypeScript everywhere; no `any`
- JSDoc: present-tense description, `@param`, `@returns`, `@throws`
- No unnecessary try/catch; prefer narrowing over casting

## Relevant Files

| File | Role | Status |
|---|---|---|
| `src/services/user-service.ts` | Service with `getUserById` | **Does not exist** |
| `src/controllers/user-controller.ts` | Controller consuming service | **Does not exist** |
| `src/models/Schema.ts` | Drizzle schema definitions | Exists; no User schema |
| `src/libs/DB.ts` | Database singleton | Exists |
| `src/utils/DBConnection.ts` | Drizzle connection factory | Exists |
| `src/app/[locale]/api/favorite-restaurants/route.ts` | Closest existing pattern (auth + db + response) | Exists |
| `src/app/[locale]/api/counter/route.ts` | Existing API route pattern | Exists |
| `src/validations/FavoriteRestaurantValidation.ts` | Zod validation pattern | Exists |
| `tsconfig.json` | Strict TS config with strictNullChecks | Exists |
| `drizzle.config.ts` | ORM config (migrations, schema path) | Exists |
| `package.json` | Scripts, dependencies, quality gates | Exists |
| `AGENTS.md` | Coding conventions | Exists |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|---|---|---|
| ticket.md | Primary problem statement | Files at stated paths don't exist; need creation with correct null handling |
| package.json | Dependency and script inventory | Drizzle ORM, Clerk auth, quality gates (check:types, lint, test, build) |
| tsconfig.json | TypeScript strictness settings | strict: true, strictNullChecks: true — confirms described type error pattern is real |
| AGENTS.md | Coding conventions | Named exports, @/ imports, JSDoc, no default exports, test conventions |
| src/models/Schema.ts | Existing DB schema | Only counter + favoriteRestaurant; no User schema |
| src/app/[locale]/api/favorite-restaurants/route.ts | Existing API route pattern | Auth, Drizzle queries, error responses — closest architectural reference |
| src/app/[locale]/api/counter/route.ts | Existing API route pattern | Inline data access, validation, NextResponse |
| drizzle.config.ts | Migration configuration | File-based migrations, output to ./migrations/ |
| src/libs/DB.ts | Database access pattern | Singleton Drizzle instance, used via `import { db } from '@/libs/DB'` |
| src/libs/Env.ts | Environment variable access | All env vars through validated Env object |
