# Product: Fix TypeScript type error in user service

## Problem Statement

The application lacks a user service layer with proper null-safety handling. The ticket specifies two files — `src/services/user-service.ts` and `src/controllers/user-controller.ts` — where a `getUserById` function returns `Promise<User | null>` but the controller treats the result as `Promise<User>` without null-checking. This is a TypeScript type error under the project's `strictNullChecks: true` configuration.

**Critical context**: Neither file, their parent directories, nor a `User` type/schema exist in the repository. This is an `[Eval]` ticket requiring creation of both files with the correct null-handling pattern already applied, plus any prerequisite type infrastructure.

## Product Vision

Deliver a type-safe user lookup flow where a missing user is handled gracefully with a 404 response, rather than surfacing as a runtime error or TypeScript compilation failure.

## Users

- **Developers** consuming the user service in controllers or route handlers — they benefit from a clear `User | null` return type that forces explicit null handling.
- **API consumers** — they receive a structured 404 response when requesting a non-existent user, instead of an unhandled error or incorrect data.

## Use Cases

1. **User found**: A request includes a valid user ID; `getUserById` returns the `User` object; the controller returns the user data with a 200 response.
2. **User not found**: A request includes an ID with no matching user; `getUserById` returns `null`; the controller detects null and returns a 404 response.

## Core Workflow

1. Controller receives a request containing a user ID.
2. Controller calls `getUserById(id)` from the user service.
3. Service queries for the user and returns `User | null`.
4. Controller checks the result:
   - If `null` — returns a 404 JSON response.
   - If `User` — proceeds with the user data and returns a 200 JSON response.

## Essential Features (MVP)

| # | Feature | Rationale |
|---|---------|-----------|
| 1 | `User` type definition | Required by both service and controller; no User type exists today |
| 2 | `getUserById` function in `src/services/user-service.ts` returning `Promise<User \| null>` | Core service function described in the ticket |
| 3 | Controller in `src/controllers/user-controller.ts` that null-checks the service result | The specific fix: narrowing `User \| null` before use |
| 4 | 404 JSON response when user is `null` | Explicit ticket requirement for not-found handling |
| 5 | TypeScript compilation passes (`bun run check:types`) | Validates the type error is resolved |

## Features Explicitly Out of Scope (MVP)

| # | Feature | Why excluded |
|---|---------|--------------|
| 1 | Database migration for a users table | Ticket focuses on the type error pattern, not data layer setup; a minimal in-memory or stub approach suffices |
| 2 | Authentication/authorization on the user endpoint | Ticket does not mention auth requirements for this flow |
| 3 | CRUD operations beyond read-by-ID | Ticket only references `getUserById` |
| 4 | API route wiring (`src/app/[locale]/api/users/[id]/route.ts`) | Ticket specifies only the service and controller files; route wiring is not requested |
| 5 | Refactoring existing routes to use a service/controller pattern | Ticket scope is limited to the two named files |

## Success Criteria

1. `src/services/user-service.ts` exists with a named export `getUserById` that returns `Promise<User | null>`.
2. `src/controllers/user-controller.ts` exists, calls `getUserById`, null-checks the result, and returns a 404 `NextResponse.json` response when the user is not found.
3. `bun run check:types` passes — no TypeScript compilation errors.
4. `bun run lint` passes — code follows project conventions (named exports, `@/` imports, JSDoc).
5. All new code follows AGENTS.md conventions.

## Key Design Principles

- **Type safety first**: The `User | null` return type must be respected; no type assertions or casts to bypass the null check.
- **Minimal footprint**: Only create the files and types the ticket explicitly requires.
- **Follow existing patterns**: Use `NextResponse.json()` with status codes, `@/` absolute imports, named exports, and JSDoc per AGENTS.md.
- **Narrowing over casting**: Use a simple `if (!user)` guard to narrow the type, not a type assertion.

## Scope & Constraints

- **Single repository**: All changes are within `next-js-boilerplate`.
- **TypeScript strict mode**: `strictNullChecks: true` is enforced; the solution must satisfy the compiler without relaxing any settings.
- **No existing service/controller layer**: This introduces a new pattern. Keep it self-contained to the two specified files without restructuring existing code.
- **Eval ticket**: The `[Eval]` prefix indicates this is an evaluation task; files must be created from scratch with the fix already applied.

## Future Considerations

- A database-backed `users` table with Drizzle schema and migration could replace a stub implementation if user persistence becomes a real requirement.
- An API route (`src/app/[locale]/api/users/[id]/route.ts`) could wire the controller to the Next.js routing layer.
- The service/controller pattern could be adopted more broadly if the team decides to move away from inline route handler logic.

## Open Questions / Risks

| # | Question / Risk | Impact |
|---|----------------|--------|
| 1 | **User type shape is undefined** — no User model exists in the codebase. The minimum viable shape (id, email, name) must be decided during implementation. | Low — a simple interface suffices for the type error fix |
| 2 | **Data source for getUserById is unspecified** — should it query a database table, use Clerk's user API, or return stub data? | Medium — affects whether a Drizzle schema/migration is needed. Ticket focus is the type pattern, so a minimal approach is preferred. |
| 3 | **Controller invocation path is unclear** — the ticket does not specify how the controller is called (API route, middleware, etc.) | Low — the controller can be written as a standalone function; wiring is out of scope |
| 4 | **New architectural pattern** — introducing `src/services/` and `src/controllers/` directories is novel for this codebase (existing code uses inline route handlers) | Low — scoped to two files; does not force changes elsewhere |

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Primary problem statement and requirements | Files must be created; null check + 404 response required |
| scout/scout-summary.md | Codebase architecture and file existence analysis | Neither file exists; no User type; strictNullChecks enabled; existing patterns documented |
| scout/reference-map.json | Detailed file inventory and codebase facts | Confirmed file absence; documented ORM, auth, and convention details |
| diagnosis/diagnosis-statement.md | Root cause analysis and success criteria | Confirmed eval ticket; root cause is file absence; defined verification gates |
| diagnosis/apl.json | Diagnosis questions and evidence-backed answers | No User schema; strictNullChecks confirmed; existing patterns as reference |
| repo-guidance.json | Repository intent classification | Single target repo: next-js-boilerplate |
