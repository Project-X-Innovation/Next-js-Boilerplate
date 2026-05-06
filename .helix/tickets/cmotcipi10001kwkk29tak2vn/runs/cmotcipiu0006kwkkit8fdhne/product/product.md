# Product: FIX-382 Tier 4 Fallback Verification

## Problem Statement

The system needs a verified fallback mechanism for inference endpoint selection that activates when:
1. No per-ticket endpoint override is configured
2. No `ANTHROPIC_API_KEY` environment variable exists

Currently, this fallback behavior is not implemented in the codebase, and the exact specification of "tier 4" and its fallback strategy is undefined. The ticket requests a test to verify this behavior, but the behavior itself must be implemented first (or this is a test-first specification task).

## Product Vision

Enable resilient inference endpoint selection that gracefully falls back to tier 4 when higher-priority endpoint sources are unavailable. This ensures the system can still function even when:
- Per-ticket endpoint overrides are not provided
- The primary authentication method (ANTHROPIC_API_KEY) is missing

The verification test will confirm that the fallback mechanism works as designed.

## Users

- **System administrators** configuring inference endpoints without per-ticket overrides
- **End users** whose requests are routed through the tier 4 fallback when API key is not available
- **Development/QA teams** testing endpoint selection resilience

## Use Cases

1. **Fallback activation**: When a request arrives with no per-ticket endpoint and no ANTHROPIC_API_KEY, the system automatically routes to tier 4
2. **Graceful degradation**: Tier 4 fallback provides a defined quality-of-service level when preferred endpoints are unavailable
3. **Behavior verification**: Test confirms that tier 4 fallback is used under specified conditions

## Core Workflow

1. Request arrives with no per-ticket endpoint configuration
2. System checks for ANTHROPIC_API_KEY environment variable
3. If ANTHROPIC_API_KEY is absent, system falls back to tier 4 endpoint
4. Request is processed using tier 4 endpoint/parameters
5. Response is returned to client

## Essential Features (MVP)

- **Tier 4 endpoint configuration**: System has a defined tier 4 endpoint (constant, environment variable, or computed)
- **Fallback logic**: Code path that selects tier 4 when both conditions are met
- **Test verification**: Automated test that validates fallback activation and correct endpoint selection

## Features Explicitly Out of Scope (MVP)

- **Per-ticket endpoint override mechanism** (assumed to exist; test only validates fallback when not set)
- **API key management system** (assumed to exist; test validates behavior when absent)
- **Tier 1, 2, 3 implementations** (only tier 4 fallback is tested)
- **Error handling for tier 4 failures** (test validates fallback activation, not tier 4 robustness)
- **Performance characteristics of tier 4** (functional verification only)

## Success Criteria

1. **Test exists and passes**: Automated test verifies tier 4 fallback works when conditions are met
2. **Conditions properly mocked**: Test mocks/stubs per-ticket endpoint = null and ANTHROPIC_API_KEY = undefined
3. **Correct endpoint selected**: Test asserts that tier 4 endpoint is used for the request
4. **Test is maintainable**: Test follows project patterns (Vitest, co-located or in tests/ directory per convention)
5. **Documentation clear**: Test code or comments explain what tier 4 is and why fallback is needed

## Key Design Principles

- **Resilience**: Fallback should be automatic and require no user intervention
- **Clarity**: The definition of tier 4 and conditions for activation must be unambiguous
- **Testability**: Fallback behavior must be observable and verifiable
- **Maintainability**: Test code should align with existing project patterns and conventions

## Scope & Constraints

### Constraints
- **No Anthropic SDK currently installed**: Will need to be added if inference logic uses it
- **Test framework only in next-js-boilerplate**: Tests will be written using Vitest in this repo
- **"Tier 4" is undefined**: Not standard Anthropic API terminology; may be custom to this project
- **Implementation location unclear**: Could live in next-js-boilerplate or example-server (backend)

### Scope
- Write a test that verifies tier 4 fallback behavior under specified conditions
- Assume fallback logic itself is implemented (or will be implemented as part of this ticket)
- Focus on test verification, not architecture or deployment

## Future Considerations

- **Tier hierarchy documentation**: As tier 4 becomes established, document the full tier 1-4 selection strategy
- **Monitoring/logging**: Add observability to track when tier 4 fallback is triggered in production
- **Configuration options**: Allow per-environment or per-deployment tier 4 endpoint customization
- **Multi-tier fallback chain**: Extend to support cascading fallbacks (tier 1 → tier 2 → tier 3 → tier 4 → error)

## Open Questions / Risks

### Critical Unknowns (Must Be Resolved)

| Question | Risk Level | Impact | Mitigation |
|----------|-----------|--------|-----------|
| **What is "tier 4"?** | 🔴 Critical | Cannot design test without understanding what tier 4 means or how it differs from other tiers | Provide documentation or specification of tier hierarchy |
| **Where is fallback logic implemented?** | 🔴 Critical | May need to add code to example-server (backend) before test can verify it; test location depends on implementation location | Decision: should fallback live in next-js-boilerplate, example-server, or both? |
| **What endpoint does tier 4 use?** | 🔴 Critical | Cannot verify correct fallback without knowing the target endpoint | Specify tier 4 endpoint (constant, env var, or computation logic) |
| **Is this test-first (TDD) or regression testing?** | 🟡 High | Affects whether test is written before or after implementation | Clarify: is the tier 4 feature supposed to already exist, or is this test defining the expected behavior? |
| **What is the "per-ticket endpoint" mechanism?** | 🟡 High | Test must mock this; need to understand how it's currently set/overridden | Provide reference to per-ticket endpoint configuration code |

### Implementation Risks

- **SDK dependency**: May require installing and configuring Anthropic SDK in next-js-boilerplate if not already present
- **Environment assumptions**: Test must handle cases where ANTHROPIC_API_KEY is not set; needs isolation/mocking
- **Cross-repo coordination**: If fallback logic lives in example-server but test is in next-js-boilerplate, must coordinate API/interface changes

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Problem statement | Specifies test for tier 4 fallback when no per-ticket endpoint and no ANTHROPIC_API_KEY |
| scout/scout-summary.md | Codebase capabilities | next-js-boilerplate has Vitest; no tier 4 implementation exists anywhere |
| scout/reference-map.json | Search for existing code | No "tier", "tier4", "ANTHROPIC_API_KEY" references in production code |
| diagnosis/diagnosis-statement.md | Root cause and unknowns | Tier 4 mechanism missing; "tier 4" not standard Anthropic terminology; clarifications needed |
| diagnosis/apl.json | Verification of unknowns | Confirms no SDK, no tiering system, no env handling; lists 5 critical questions |
| repo-guidance.json | Repo responsibilities | next-js-boilerplate = test target; example-server = undecided logic location; example-client = context only |
| AGENTS.md (next-js-boilerplate) | Project conventions | Uses Vitest, Playwright; test patterns: *.spec.ts for integration, *.test.ts for unit; Conventional Commits; TypeScript strict |

