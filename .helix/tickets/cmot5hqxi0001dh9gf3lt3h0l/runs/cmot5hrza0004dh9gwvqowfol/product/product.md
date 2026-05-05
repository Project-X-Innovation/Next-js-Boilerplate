# Product: Fix TypeScript type error in user service

## Problem Statement

The ticket requires a `getUserById` function in `src/services/user-service.ts` that returns `Promise<User | null>`, with calling code in `src/controllers/user-controller.ts` that properly null-checks the result and returns a 404 when the user is not found.

**Key context:** Neither file, directory, nor a User data model currently exists in the repository. The codebase uses Next.js App Router route handlers directly without a service/controller abstraction layer, and only defines `counterSchema` and `favoriteRestaurantSchema` in its Drizzle ORM schema. This is a greenfield creation task, not a fix to existing code. The ticket explicitly specifies the file paths and pattern to follow.

## Product Vision

Introduce a type-safe user lookup capability with proper null-handling so that requests for non-existent users receive a clear 404 response instead of a runtime error or misleading result.

## Users

- **API consumers** calling the user-by-ID endpoint who need predictable responses (user data or 404).
- **Developers** working in the codebase who need a type-safe `getUserById` contract that enforces null-checking at compile time.

## Use Cases

1. **User found:** Consumer requests a user by ID; the service finds the user in the database and the controller returns the user data with a 200 response.
2. **User not found:** Consumer requests a user by a non-existent ID; the service returns `null`, the controller detects `null`, and returns a 404 response.
3. **Type safety at build time:** A developer who forgets to null-check `getUserById`'s return value gets a compile-time error from `strictNullChecks: true`.

## Core Workflow

1. Request arrives at the controller with a user ID.
2. Controller calls `getUserById(id)` in the service layer.
3. Service queries the database and returns the `User` record or `null`.
4. Controller checks the result:
   - If `User` exists, return 200 with user data.
   - If `null`, return 404 with an appropriate message.

## Essential Features (MVP)

- **User schema** defined in `src/models/Schema.ts` with a corresponding Drizzle migration.
- **`getUserById` service function** in `src/services/user-service.ts` returning `Promise<User | null>`.
- **Controller** in `src/controllers/user-controller.ts` that calls the service, null-checks the result, and returns 404 when the user is not found.
- **Type correctness:** `bun run check:types` passes with no errors under `strictNullChecks: true`.
- **Code conventions:** Named exports, `@/` absolute imports, NextResponse patterns, and Drizzle ORM usage matching existing repo standards.

## Features Explicitly Out of Scope (MVP)

- CRUD operations beyond read-by-ID (create, update, delete users).
- User authentication or authorization logic (Clerk already handles auth).
- API route handler wiring in `src/app/[locale]/api/` (ticket only specifies service and controller files).
- UI or frontend changes.
- User profile, settings, or preferences features.
- Migration of existing route handlers to the service/controller pattern.

## Success Criteria

1. `src/services/user-service.ts` exists with a named-exported `getUserById` function returning `Promise<User | null>`.
2. `src/controllers/user-controller.ts` exists, calls `getUserById`, performs a null check, and returns a 404 `NextResponse` when the user is `null`.
3. A `userSchema` is defined in `src/models/Schema.ts` with a Drizzle migration generated.
4. `bun run check:types` passes (no TypeScript errors).
5. `bun run lint` passes.
6. Code follows repo conventions per AGENTS.md (named exports, `@/` imports, no `any`).

## Key Design Principles

- **Type safety over convenience:** The `User | null` return type must be explicit; callers must handle `null` before using the value.
- **Minimal footprint:** Only create the files, schema, and logic the ticket specifies.
- **Follow ticket intent:** Use the service/controller pattern as the ticket specifies, even though the repo's existing convention is direct route handlers.
- **Match existing quality standards:** Same Drizzle ORM patterns, NextResponse usage, and code style as existing API routes.

## Scope & Constraints

- **Single repo:** All changes are within `next-js-boilerplate`.
- **TypeScript strict mode:** `strictNullChecks: true` is enforced; the implementation must satisfy it.
- **Drizzle ORM:** The User schema must use Drizzle and a migration must be generated.
- **No runtime data:** There is no existing user data; the schema and service are new.
- **Eval context:** This is an eval ticket; the primary goal is demonstrating correct null-handling and type safety.

## Future Considerations

- Whether to adopt the service/controller pattern repo-wide or keep it isolated to user-related code.
- Additional user CRUD operations if user management expands beyond lookup.
- Integration testing for the user endpoint once wired to an API route.

## Open Questions / Risks

| # | Question / Risk | Impact |
|---|-----------------|--------|
| 1 | The service/controller pattern is new to this repo. Should it be adopted more broadly, or is this an isolated addition? | Low for this ticket; architectural decision for future work. |
| 2 | What fields should the User schema include? The ticket does not specify columns beyond needing an ID for lookup. | Implementation must define a minimal but reasonable schema. |
| 3 | Whether an API route handler in `src/app/[locale]/api/` should wire up the controller, or the ticket only requires the service and controller files. | Ticket only mentions two files; route wiring may be out of scope. |
| 4 | Whether a Drizzle migration is required. The ticket focuses on the type error pattern, not database setup. | Migration is needed if a real `userSchema` is defined in Schema.ts. |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Primary problem statement and requirements | Specifies null-check fix on `getUserById` with 404 response; names exact file paths |
| scout/scout-summary.md | Repository architecture and file existence analysis | Confirmed neither file exists; repo uses direct route handlers, not service/controller pattern |
| scout/reference-map.json | Detailed file inventory and architectural facts | No User model, no services/ or controllers/ directories; documented existing API patterns |
| diagnosis/diagnosis-statement.md | Root cause analysis and success criteria | Confirmed greenfield creation; defined implementation requirements and quality gates |
| diagnosis/apl.json | Diagnosis questions and evidence-backed answers | Verified file absence, schema state, TypeScript strictness, and existing patterns |
| repo-guidance.json | Repo intent classification | Confirmed next-js-boilerplate is the sole target repo |
