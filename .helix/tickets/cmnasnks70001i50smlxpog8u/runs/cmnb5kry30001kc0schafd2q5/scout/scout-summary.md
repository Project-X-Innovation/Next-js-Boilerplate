# Scout Summary

## Problem

The ticket requests a "changeable list of my favorite restaurants." No restaurant, favorite, or list-management concept exists in the codebase. The application is a Next.js 16 boilerplate with a single demo feature (counter) that demonstrates the full-stack pattern: Drizzle ORM schema, Zod validation, API route, client form component, and server data-fetching component. The favorites feature requires building a new domain feature following these established patterns.

## Analysis Summary

### Current State

- **Stack**: Next.js 16.2.1, React 19.2.4, Drizzle ORM 0.45.1 (PostgreSQL), Clerk auth 7.0.6, next-intl i18n (en/fr), react-hook-form + Zod 4.3.6 validation, Tailwind CSS v4.2.2 (no component library).
- **Existing CRUD pattern**: The counter feature provides a complete vertical slice to follow: schema (`src/models/Schema.ts`), API route (`src/app/[locale]/api/counter/route.ts`), Zod validation (`src/validations/CounterValidation.ts`), client form component (`src/components/CounterForm.tsx`), server display component (`src/components/CurrentCount.tsx`), and i18n strings in both locales.
- **Auth boundary**: The `(auth)` route group wraps pages in `ClerkProvider`. User identity is available server-side via `currentUser()` from `@clerk/nextjs/server` (demonstrated in `src/components/Hello.tsx`). The dashboard area is the natural home for user-scoped features.
- **Database**: Single schema file (`src/models/Schema.ts`) with one table (`counter`). Migrations generated via `npm run db:generate`, applied via `npm run db:migrate`. The DB connection in `src/utils/DBConnection.ts` uses a wildcard schema import (`import * as schema`), so new table exports are auto-available.
- **No user-scoped data exists**: The counter table is global. No existing pattern shows how to associate data with a Clerk user ID.

### Key Boundaries

1. **Data layer**: New Drizzle table(s) in `src/models/Schema.ts` + generated migration. Needs user-scoping column (Clerk user ID).
2. **API layer**: New API route(s) under `src/app/[locale]/api/` for CRUD operations on favorite restaurants.
3. **Validation layer**: New Zod schema in `src/validations/` for restaurant data validation.
4. **UI layer**: New page in `(auth)` route group + client components for list management (add, edit, remove) + server component for data display.
5. **Navigation**: Dashboard layout (`src/app/[locale]/(auth)/dashboard/layout.tsx`) nav links need a new entry.
6. **i18n**: New namespace and keys in both `src/locales/en.json` and `src/locales/fr.json`. The `check:i18n` script validates key completeness.
7. **Quality gates**: All code must pass lint (ultracite), check:types (strict TS), check:deps (knip), check:i18n, and tests.

### Quality Gates

- `bun run lint` — ultracite with type-aware checking
- `bun run check:types` — strict TypeScript (`noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`)
- `bun run check:deps` — knip unused dependency detection
- `bun run check:i18n` — i18n key completeness check across locales
- `bun run test` — Vitest unit tests
- `bun run test:e2e` — Playwright E2E tests
- Pre-commit hooks: commitlint (conventional commits), ultracite fix, knip

### Key Unknowns

- Whether "changeable" implies full CRUD or simpler add/remove.
- What data fields a restaurant entry should have (name only vs. structured data).
- Whether restaurants are free-form user entries or selections from a catalog.
- Whether list ordering/reordering is in scope.
- How to scope data to a Clerk user (no existing user-scoped data pattern in the DB).

## Relevant Files

| File | Relevance |
|------|-----------|
| `src/models/Schema.ts` | Drizzle schema — new table(s) must be added here |
| `drizzle.config.ts` | Migration generation config |
| `migrations/0000_init-db.sql` | Existing migration (counter table) |
| `src/utils/DBConnection.ts` | DB connection with wildcard schema import |
| `src/libs/DB.ts` | Singleton DB instance for data access |
| `src/app/[locale]/api/counter/route.ts` | Reference API route pattern (Zod + Drizzle + NextResponse) |
| `src/validations/CounterValidation.ts` | Reference Zod validation pattern |
| `src/components/CounterForm.tsx` | Reference client form (react-hook-form + fetch + refresh) |
| `src/components/CurrentCount.tsx` | Reference server component with DB read |
| `src/components/Hello.tsx` | Shows `currentUser()` usage for user identity |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Dashboard page pattern (likely host area) |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Dashboard navigation (needs new link) |
| `src/app/[locale]/(auth)/layout.tsx` | Auth layout with ClerkProvider |
| `src/app/[locale]/(marketing)/counter/page.tsx` | Reference page composition pattern |
| `src/locales/en.json` | English i18n strings (needs new keys) |
| `src/locales/fr.json` | French i18n strings (needs new keys) |
| `src/libs/Env.ts` | Env validation (no new vars expected) |
| `src/templates/BaseTemplate.tsx` | Shared layout template with nav slots |
| `src/libs/I18nNavigation.ts` | Locale-aware Link and router |
| `package.json` | Scripts and quality gate commands |
| `lefthook.yml` | Pre-commit hook configuration |
| `AGENTS.md` | Coding standards and conventions |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| Ticket (title + description) | Define the feature requirement | Need a changeable list of favorite restaurants; no further specification provided |
| `src/models/Schema.ts` | Understand existing data model and Drizzle pattern | Only a counter table exists; pgTable with serial PK and timestamps is the pattern |
| `src/app/[locale]/api/counter/route.ts` | Map existing API route pattern | PUT route with Zod safeParse, Drizzle upsert, NextResponse.json, status 422 for validation errors |
| `src/validations/CounterValidation.ts` | Map validation pattern | Zod z.object with field constraints, exported as named const |
| `src/components/CounterForm.tsx` | Map client component pattern | react-hook-form + zodResolver + fetch to API + router.refresh() for revalidation |
| `src/components/CurrentCount.tsx` | Map server component pattern | Async server component, db.query.counterSchema.findFirst(), getTranslations |
| `src/components/Hello.tsx` | Understand user identity access | `currentUser()` from @clerk/nextjs/server provides authenticated user |
| `src/app/[locale]/(auth)/layout.tsx` | Map auth boundary | ClerkProvider wraps all (auth) routes |
| `src/app/[locale]/(auth)/dashboard/layout.tsx` | Map dashboard navigation | Navigation links rendered via BaseTemplate leftNav/rightNav slots |
| `src/app/[locale]/(auth)/dashboard/page.tsx` | Map page props and metadata pattern | DashboardPageProps type, generateMetadata, setRequestLocale, default export |
| `src/app/[locale]/(marketing)/counter/page.tsx` | Map page composition | Imports server + client components, generateMetadata with locale namespace |
| `src/utils/DBConnection.ts` | Verify schema import mechanism | Wildcard `import * as schema` means new Schema.ts exports are auto-available |
| `drizzle.config.ts` | Understand migration setup | Schema at ./src/models/Schema.ts, output at ./migrations, PostgreSQL dialect |
| `src/locales/en.json` + `src/locales/fr.json` | Map i18n structure and naming conventions | Namespace per component/page, sentence case, context-specific keys |
| `src/libs/Env.ts` | Check environment requirements | DATABASE_URL and CLERK_SECRET_KEY required; no new env vars needed |
| `package.json` | Map scripts and quality gates | lint, check:types, check:deps, check:i18n, test, db:generate, db:migrate |
| `AGENTS.md` | Understand mandatory coding standards | Named exports, @/ imports, Tailwind v4, conventional commits, test naming, JSDoc |
| `lefthook.yml` | Map pre-commit requirements | commitlint + ultracite fix + knip |
