# Tech-Research: FIX-382 Tier 4 Fallback Verification

## Technology Foundation

The tier 4 fallback mechanism is a **custom endpoint-selection system** for this project, not based on any external service's official API (e.g., Anthropic's "Priority Tier" is different). It provides resilient inference endpoint selection when preferred endpoint sources are unavailable.

**Architecture Context:**
- Multi-tier SaaS boilerplate with Next.js frontend (next-js-boilerplate) and Express backend (example-server)
- Currently uses environment variables for configuration management (dotenv in example-server)
- Test infrastructure exists in frontend (Vitest, Playwright)
- Backend has no test framework installed yet

## Architecture Decision

### Selected Option: Backend-Owned Tier Selection with Vitest Unit Testing

**Option A (Selected):** Implement InferenceEndpointResolver in example-server backend, with Vitest unit tests in the same repo.
- **Rationale:**
  - Endpoint/API key management is inherently a backend responsibility (following SaaS patterns)
  - Keeps frontend concerns separate from credential handling
  - Allows tier selection logic to be reused across multiple frontend/client consumers
  - Keeps test infrastructure aligned (Vitest in both repos)
  - Simpler initial implementation: direct function testing vs. integration testing through API

**Option B (Rejected):** Implement in next-js-boilerplate with integration tests via Playwright.
- **Rationale for rejection:**
  - Frontend repo should not own API credential/endpoint management
  - Would require either (a) duplicating logic or (b) making next-js-boilerplate depend on example-server implementation
  - More integration testing complexity for a relatively simple selection function
  - Mixes frontend concerns with backend configuration

**Option C (Rejected):** Implement separately in both repos.
- **Rationale for rejection:**
  - Code duplication and harder to maintain
  - Tier selection is a single responsibility, should be owned by one module
  - Increases coupling if both repos need to stay in sync

## Core API/Methods

### InferenceEndpointResolver Module (example-server/src/lib/InferenceEndpointResolver.ts)

```typescript
interface EndpointConfig {
  url: string;
  apiKey: string;
  tier: 'custom' | 'tier_4';
}

interface SelectEndpointOptions {
  perTicketEndpoint?: string;      // Per-ticket override (highest priority)
  perTicketApiKey?: string;         // Per-ticket API key override
}

/**
 * Selects the appropriate inference endpoint based on tier fallback logic.
 * 
 * Priority (descending):
 * 1. Per-ticket endpoint (if provided)
 * 2. Tier 4 fallback (when no per-ticket endpoint and no ANTHROPIC_API_KEY)
 * 
 * @param options Selection parameters
 * @returns EndpointConfig with URL and credentials
 * @throws Error if tier 4 endpoint not configured (missing env vars)
 */
export function selectEndpoint(options: SelectEndpointOptions): EndpointConfig
```

**Behavior:**
1. If `options.perTicketEndpoint` is provided → return it as 'custom' tier
2. Else if `ANTHROPIC_API_KEY` environment variable is set → use primary endpoint (future: tier 1-3)
3. Else → use tier 4 fallback (requires `TIER_4_ENDPOINT` and `TIER_4_API_KEY` env vars)
4. If tier 4 is required but env vars are missing → throw Error with clear message

**Environment Variables Required:**
- `TIER_4_ENDPOINT`: Fallback inference endpoint URL (e.g., "https://api.example.com/inference")
- `TIER_4_API_KEY`: Fallback API key for tier 4 endpoint
- `ANTHROPIC_API_KEY`: Primary/preferred API key (checked for tier 1-3, optional for tier 4 fallback)

## Technical Decisions

### 1. Framework and Testing Approach
- **Decision:** Add Vitest to example-server matching next-js-boilerplate convention
- **Rationale:** 
  - Consistency across repos (same test framework, same CLI: `npm run test`)
  - Vitest is lightweight and appropriate for backend testing
  - Follows project AGENTS.md which establishes Vitest as the test runner
  - Keeps learning curve minimal for team familiar with next-js-boilerplate tests
- **Alternative Considered:** Jest (industry standard)
  - Rejected: More heavyweight, adds build complexity, Vitest already proven in project

### 2. Endpoint Configuration Storage
- **Decision:** Environment variables (TIER_4_ENDPOINT, TIER_4_API_KEY)
- **Rationale:**
  - Follows existing example-server pattern (dotenv, process.env access)
  - Allows different values per environment (dev/staging/prod)
  - No new configuration file format needed
  - Sensitive data (API keys) handled via standard .env pattern
- **Alternative Considered:** YAML/JSON config file
  - Rejected: Adds complexity, harder to manage secrets in production

### 3. Tier Selection Logic Placement
- **Decision:** Pure utility function in `src/lib/InferenceEndpointResolver.ts`, no coupling to Express routes
- **Rationale:**
  - Reusable across multiple route handlers/services
  - Testable without mock Express objects
  - Easy to export as middleware or use in services
- **Alternative Considered:** Express middleware
  - Rejected for tier selection itself (use middleware to *call* the utility, not define it)

### 4. Error Handling
- **Decision:** Throw descriptive Error when tier 4 required but env vars missing
- **Rationale:**
  - Fails fast during app startup or request processing
  - Clear error message guides operator to configure missing env vars
  - No silent fallbacks to wrong endpoint
- **Alternative Considered:** Return null/undefined and let caller handle
  - Rejected: Moves error handling complexity to caller, harder to debug

### 5. Anthropic SDK Integration
- **Decision:** Not required for tier 4 fallback mechanism. Deferred to later.
- **Rationale:**
  - Tier selection mechanism is agnostic to how endpoints are used
  - @anthropic-ai/sdk can be integrated later when actual Anthropic API calls are needed
  - Keeps initial scope focused: endpoint selection, not API integration
- **Implementation Path:** When ready to add SDK, create `InferenceClient` that uses `selectEndpoint()` internally

## Cross-Platform Considerations

### Multi-Environment Support (Dev/Staging/Prod)
- Tier 4 endpoint and key configured per environment via .env files
- Each environment can have different tier 4 values (supports different service tiers across environments)
- `.env.example` should document TIER_4_ENDPOINT and TIER_4_API_KEY as required vars

### Per-Tenant Configuration (if future requirement)
- Current mechanism is global (single tier 4 per environment)
- If future requirement: extend SelectEndpointOptions with `tenantId?: string` parameter
- Lookup tier 4 config from database using tenant context
- Not in scope for FIX-382, but architecture supports it

## Performance Expectations

### Runtime Performance
- **selectEndpoint() execution:** Synchronous, O(1)
  - Checks environment variables (lookup table)
  - No I/O, no network calls
  - Expected latency: <1ms per invocation
  
### Scaling Characteristics
- No database queries or network dependencies
- Safe for per-request invocation (e.g., in request middleware)
- Suitable for high-throughput scenarios

### Memory Impact
- Minimal: only stores endpoint strings and API keys in environment
- No caching needed (env var lookup is cheap)

## Dependencies

### Required New Dependencies (example-server)
- **vitest**: ^1.0.0 (dev dependency, test runner)
  - Justification: Matches next-js-boilerplate, already used in frontend
- **@vitest/ui**: ^1.0.0 (optional, test reporting)

### Existing Dependencies Used
- **dotenv**: Already in example-server package.json (env var loading)
- No SDK dependencies required (framework-agnostic implementation)

### Future Dependencies (Deferred)
- **@anthropic-ai/sdk**: When integrating with Anthropic API (not required for tier selection)

## Deferred to Round 2

1. **Tier 1-3 Implementation:** FIX-382 covers tier 4 fallback only. Higher tiers and their selection logic can be added incrementally.
2. **Anthropic SDK Integration:** Not required for the fallback mechanism; can be added separately when actual Anthropic API calls are needed.
3. **Monitoring/Logging:** Observability for when tier 4 fallback is triggered in production. Can be added via middleware after basic mechanism is working.
4. **Multi-Tier Fallback Chain:** Extending to cascading fallbacks (e.g., tier 1 → tier 2 → tier 3 → tier 4 → error). Deferred until tier 1-3 are defined.
5. **Per-Tenant Tier Configuration:** Database-backed tier configuration per tenant. Deferred pending future requirements.
6. **API Gateway Integration:** Exposing tier selection as API endpoint for external consumers. Deferred pending integration needs.

## Summary Table

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Location** | example-server/src/lib/InferenceEndpointResolver.ts | Backend responsibility for endpoint/credential management |
| **Testing Framework** | Vitest (unit tests) | Consistency with next-js-boilerplate, lightweight, proven in project |
| **Configuration** | Environment variables (TIER_4_ENDPOINT, TIER_4_API_KEY) | Existing project pattern, supports multi-environment setup |
| **Selection Logic** | Synchronous utility function | Reusable, testable, simple to reason about |
| **Error Handling** | Throw descriptive Error on missing config | Fail fast, clear guidance to operators |
| **SDK Integration** | Deferred (not required) | Tier selection is framework-agnostic, SDK can come later |
| **Tier Scope** | Tier 4 fallback only (MVP) | Simpler to implement and test; higher tiers deferred |

## APL Statement Reference

See [tech-research/apl.json](./apl.json) for the detailed APL analysis with questions, answers, and evidence.

**APL Summary:** Tier 4 is a custom fallback tier system implemented in example-server as an InferenceEndpointResolver module. Fallback triggers when no per-ticket endpoint exists AND ANTHROPIC_API_KEY is absent. Configuration uses environment variables (TIER_4_ENDPOINT, TIER_4_API_KEY). Unit tests are implemented in example-server using Vitest to verify tier selection logic. Mechanism is framework-agnostic and does not require Anthropic SDK installation.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| diagnosis/diagnosis-statement.md | Understand root causes and unknowns | Tier 4 mechanism missing; undefined terminology; clarifications needed about TDD vs regression |
| diagnosis/apl.json | Detailed investigation of 5 key questions | Confirmed no SDK, no tiering system; identified backend responsibility for endpoint logic |
| product/product.md | Understand product vision and use cases | System needs resilient fallback when per-ticket endpoint and API key both unavailable |
| repo-guidance.json | Understand repo responsibilities | next-js-boilerplate = test target; example-server = logic location; example-client = context only |
| scout/scout-summary.md | Verify test infrastructure and missing implementation | Confirmed Vitest in next-js-boilerplate; no tier 4 logic anywhere; next-js-boilerplate has test patterns |
| example-server/package.json | Verify backend dependencies and capabilities | Express.js, dotenv, TypeScript configured; no test framework; no Anthropic SDK |
| next-js-boilerplate/AGENTS.md | Understand project conventions and test patterns | Vitest for tests; *.test.ts unit, *.spec.ts integration patterns; TypeScript strict mode |
| Anthropic SDK docs (Context7) | Verify official terminology and API | Confirmed service_tier is official parameter; "tier 4" not standard terminology |
| Test examples (Helpers.test.ts, Counter.spec.ts) | Understand test patterns | Vitest describe/it/expect pattern; Playwright for integration tests |
