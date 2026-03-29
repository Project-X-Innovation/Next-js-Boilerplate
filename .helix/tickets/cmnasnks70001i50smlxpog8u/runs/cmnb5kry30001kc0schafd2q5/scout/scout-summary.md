# Scout Summary

## Problem

The ticket requests a "changeable list of my favorite restaurants." The current codebase has no concept of restaurants, favorites, or user-scoped lists. The only existing data feature is a simple counter with a single DB table. A new data model, API layer, validation, UI components, i18n strings, and migration are needed.

## Analysis Summary

### Current State
- **Stack**: Next.js 16.2.1, React 19.2.4, Drizzle ORM 0.45.1 (PostgreSQL), Clerk auth 7.0.6, next-intl i18n, react-hook-form + Zod validation, Tailwind CSS v4.
- **Existing CRUD pattern**: The counter feature provides a complete vertical slice to follow: schema (`src/models/Schema.ts`), API route (`src/app/[locale]/api/counter/route.ts`), Zod validation (`src/validations/CounterValidation.ts`), client form component (`src/components/CounterForm.tsx`), server display component (`src/components/CurrentCount.tsx`), i18n strings in both locales, and integration tests (`tests/integration/Counter.spec.ts`).
- **Auth boundary**: The `(auth)` route group wraps pages in `ClerkProvider`. User identity is available server-side via `currentUser()` from `@clerk/nextjs/server`. The dashboard page (`src/app/[locale]/(auth)/dashboard/page.tsx`) is the natural home for user-scoped features.
- **Database**: Single schema file (`src/models/Schema.ts`) with one table (`counter`). Migrations generated via `drizzle-kit generate`, applied via `drizzle-kit migrate`. The DB connection in `src/utils/DBConnection.ts` uses a wildcard schema import, so new table exports are auto-available.
- **No middleware.ts** exists; auth protection depends on the route group structure and ClerkProvider.

### Key Boundaries
1. **Data layer**: New Drizzle table(s) in `src/models/Schema.ts` + generated migration. Need user-scoping (Clerk user ID as foreign key or column).
2. **API layer**: New API route(s) under `src/app/[locale]/api/` for CRUD operations on favorite restaurants.
3. **Validation layer**: New Zod schema in `src/validations/` for restaurant data validation.
4. **UI layer**: New page in `(auth)` route group + client components for list management (add, edit, remove).
5. **Navigation**: Dashboard layout (`src/app/[locale]/(auth)/dashboard/layout.tsx`) nav links need a new entry.
6. **i18n**: New namespace and keys in both `src/locales/en.json` and `src/locales/fr.json`.
7. **Tests**: Integration tests (Playwright `.spec.ts`) and potentially unit tests for validation logic.

### Quality Gates
- `bun run lint` - ultracite with type-aware checking
- `bun run check:types` - strict TypeScript (`noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`)
- `bun run check:deps` - knip unused dependency detection
- `bun run check:i18n` - i18n key completeness check across locales
- `bun run test` - Vitest unit tests
- `bun run test:e2e` - Playwright e2e tests
- Pre-commit hooks: commitlint, ultracite fix, knip

### Key Unknowns
- Whether "changeable" implies full CRUD or simpler add/remove.
- What data fields a restaurant entry should have (name only vs. structured data).
- Whether restaurants are free-form user entries or selections from a catalog.
- Whether list ordering/reordering is in scope.
- How to scope data to a user (no existing user-scoped data pattern in the codebase).

## Relevant Files

| File | Relevance |
|------|-----------|
| `src/models/Schema.ts` | Drizzle schema where new table must be added |
| `drizzle.config.ts` | Migration generation config |
| `migrations/` | Migration output directory |
| `src/utils/DBConnection.ts` | DB connection with wildcard schema import |
| `src/libs/DB.ts` | Singleton DB instance for data access |
| `src/app/[locale]/api/counter/route.ts` | Reference API route pattern |
| `src/validations/CounterValidation.ts` | Reference Zod validation pattern |
| `src/components/CounterForm.tsx` | Reference client form pattern |
| `src/components/CurrentCount.tsx` | Reference server component with DB read |
| `src/components/Hello.tsx` | Shows `currentUser()` usage for user identity |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Dashboard page (likely host for feature) |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Dashboard navigation (needs new link) |
| `src/app/[locale]/(auth)/layout.tsx` | Auth layout with ClerkProvider |
| `src/locales/en.json` | English i18n strings (needs new keys) |
| `src/locales/fr.json` | French i18n strings (needs new keys) |
| `src/libs/Env.ts` | Env validation (no new vars expected) |
| `src/templates/BaseTemplate.tsx` | Shared layout template with nav slots |
| `tests/integration/Counter.spec.ts` | Reference integration test pattern |
| `package.json` | Scripts and quality gate commands |
| `AGENTS.md` | Coding standards and conventions |
| `lefthook.yml` | Pre-commit hook configuration |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| Ticket (title + description) | Define the feature requirement | Need a changeable list of favorite restaurants; no further specification provided |
| `src/models/Schema.ts` | Understand existing data model | Only a counter table exists; no user-scoping or list pattern |
| `src/app/[locale]/api/counter/route.ts` | Map existing API pattern | PUT route with Zod validation, Drizzle upsert, NextResponse JSON |
| `src/components/CounterForm.tsx` | Map client component pattern | react-hook-form + zodResolver + fetch to API + router.refresh() |
| `src/components/CurrentCount.tsx` | Map server component pattern | Direct db.query read + getTranslations |
| `src/components/Hello.tsx` | Understand user identity access | `currentUser()` from @clerk/nextjs/server provides authenticated user |
| `src/app/[locale]/(auth)/layout.tsx` | Map auth boundary | ClerkProvider wraps all (auth) routes |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Map dashboard navigation | Navigation links rendered via BaseTemplate leftNav slot |
| `src/locales/en.json` + `src/locales/fr.json` | Map i18n structure | Namespace-based keys, must add to both locales |
| `drizzle.config.ts` | Understand migration setup | Schema at `./src/models/Schema.ts`, output at `./migrations` |
| `package.json` | Map scripts and quality gates | lint, check:types, check:deps, check:i18n, test, db:generate, db:migrate |
| `AGENTS.md` | Understand coding standards | Named exports, @/ imports, Tailwind v4, conventional commits, test naming |
| `lefthook.yml` | Map pre-commit requirements | commitlint + ultracite fix + knip |
| `tests/integration/Counter.spec.ts` | Map test patterns | Playwright API tests with status and JSON assertions |
