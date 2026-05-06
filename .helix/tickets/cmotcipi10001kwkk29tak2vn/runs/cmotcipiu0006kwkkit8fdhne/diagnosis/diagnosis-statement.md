# Diagnosis: FIX-382 Tier 4 Fallback Verification

## Problem Summary

The ticket requires writing a test to verify that tier 4 inference endpoint fallback works when:
1. No per-ticket endpoint is set
2. No ANTHROPIC_API_KEY environment variable exists

However, investigation reveals that the tier 4 fallback mechanism **does not currently exist** in the codebase, and there are critical unknowns about its intended implementation location and behavior.

## Root Cause Analysis

The root cause is **incomplete feature specification and missing implementation**:

1. **Missing Implementation**: No tier 4 inference endpoint fallback logic exists anywhere in the codebase
   - No Anthropic SDK (@anthropic-ai/sdk) is installed in any repository
   - No endpoint tiering system or fallback mechanism is implemented
   - No ANTHROPIC_API_KEY handling exists in production code
   - No environment variables related to inference endpoints are configured

2. **Missing Test Infrastructure**: The likely location for tests (next-js-boilerplate) has test framework but no tier 4 feature to test
   - next-js-boilerplate has Vitest and Playwright configured
   - example-server (logical location for API logic) has no test framework installed
   - Mismatch between where tests should be written and where the feature should live

3. **Unclear Specification**: Critical aspects of the feature are undefined
   - "Tier 4" is not standard Anthropic API terminology (they use "Priority Tier" vs "standard_only")
   - It may be a custom tiering system for this project or a future feature
   - The fallback behavior and endpoint destination are not documented
   - Whether this is test-driven development (TDD) or regression testing is ambiguous

## Evidence Summary

### What Exists
| Item | Evidence | Status |
|------|----------|--------|
| Test framework in next-js-boilerplate | package.json: `"test": "vitest run"` | ✓ Present |
| Vitest config | vitest.config.ts exists | ✓ Present |
| Test patterns | tests/integration/*.spec.ts, src/**/*.test.ts | ✓ Present |
| Express backend | example-server with API routes | ✓ Present |
| Anthropic SDK reference in docs | Anthropic TypeScript SDK docs reviewed | ✓ Available |

### What's Missing
| Item | Searched | Result |
|------|----------|--------|
| Tier 4 implementation | Grep across all src/ | ✗ Not found |
| ANTHROPIC_API_KEY usage | Grep across all src/ | ✗ Not found |
| Anthropic SDK installation | package.json across all repos | ✗ Not found |
| Endpoint tiering system | Manual code review | ✗ Not found |
| Environment config for inference | .env.example files | ✗ Not found (only JWT_SECRET, DATABASE_URL in example-server) |

### Scout Artifacts Review
- **next-js-boilerplate scout summary**: Identifies test infrastructure but notes no tier 4 implementation
- **example-server scout summary**: Identifies it as logical location for tier 4 logic but notes no test framework
- **example-client scout summary**: Correctly excludes as context-only (client-side only)
- **Reference maps**: All three repos confirm absence of tier, fallback, and ANTHROPIC_API_KEY references

## Success Criteria

Before implementation can proceed, the following must be clarified:

1. **Define "Tier 4"**: Provide documentation or specification of what tier 4 means in this project's architecture
2. **Specify Fallback Behavior**: Define exactly what happens when no per-ticket endpoint and no ANTHROPIC_API_KEY:
   - Which endpoint should tier 4 fallback to?
   - What error handling should occur?
   - Should it be a default constant endpoint or configurable?
3. **Choose Implementation Location**: Decide if tier 4 logic goes in next-js-boilerplate, example-server, or both
4. **Clarify Project Intent**: Is this a test-first (TDD) task defining behavior, or a regression test for an existing feature?
5. **SDK Integration**: Determine if Anthropic SDK should be installed and where

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| ticket.md | Problem statement | Specifies test verification for tier 4 fallback with two conditions |
| scout-summary.md (all 3 repos) | Context on repo capabilities and missing implementation | Confirms no tier 4 logic anywhere; next-js-boilerplate has test framework |
| reference-map.json (all 3 repos) | Comprehensive search for tier/fallback/endpoint references | No matches in production code; only ticket mentions |
| Context7: Anthropic SDK TypeScript docs | Understand official Anthropic terminology | No "tier 4" in official docs; service_tier uses "auto" or "standard_only" |
| WebSearch: Anthropic API tier docs | Verify tier 4 is not official terminology | Confirmed: Anthropic uses Priority Tier and standard tier, not tier 4 |
| Codebase inspection | Direct observation of packages and code structure | No @anthropic-ai/sdk; no ANTHROPIC_API_KEY; no tier system |

---

## Diagnosis Conclusion

This ticket requires **specification completion before implementation**. The absence of the tier 4 mechanism, unclear terminology, and missing test framework in the logical backend location (example-server) indicate this is either:

1. A **test-driven development (TDD) task** where the test definition drives feature implementation, OR
2. An incomplete ticket specification waiting for clarification

**Recommendation**: Block implementation pending clarification of the five criteria listed above. Once clarified, the implementation plan can determine whether to:
- Add tier 4 logic to example-server and add test framework, OR
- Add tier 4 logic to next-js-boilerplate and write integration tests, OR
- Distribute the feature across both repos
