# Product: Marketing Options for Helix

## Problem Statement

Helix has extensive marketing infrastructure distributed across three repositories, but it is **incomplete and fragmented**, preventing end-to-end marketing capability:

1. **Product Analytics Non-Functional**: PostHog is configured at the environment level but the SDK package is missing from `package.json`, making analytics unavailable.
2. **Communication Isolated**: Email (Nodemailer) and SMS (Twilio) capabilities exist only in the backend (example-server) with no frontend user interface or integration in the primary application (next-js-boilerplate).
3. **No Commercial Email Marketing**: Missing SendGrid, Mailchimp, or similar email marketing platform—only raw Nodemailer email sending is available, lacking campaign management, subscriber lists, and deliverability optimization.

These gaps prevent product managers, marketers, and customer success teams from tracking user behavior, running campaigns, and communicating with customers through the main application.

---

## Product Vision

Unify Helix's fragmented marketing infrastructure into a cohesive, integrated platform that enables:
- **Product Analytics**: Track user behavior and engagement to inform product decisions
- **Customer Communication**: Send emails and SMS directly from the application
- **Email Campaigns**: Manage subscriber lists and run marketing campaigns with analytics
- **User Intelligence**: Combine analytics, authentication, and communication for a complete customer picture

---

## Users

- **Product Managers**: Need product analytics to understand feature adoption and user funnels
- **Marketing Teams**: Need email campaign tools, subscriber management, and delivery analytics
- **Customer Success**: Need to send targeted emails and SMS to customer segments
- **Developers**: Need clear configuration and integration patterns to extend marketing capabilities

---

## Use Cases

1. **Track Product Adoption**: Measure feature engagement, page views, and user journeys to prioritize product development
2. **Send Customer Notifications**: Email or SMS users about account events, deadlines, or announcements
3. **Run Email Campaigns**: Send newsletters, promotional emails, or onboarding sequences with open/click tracking
4. **Contact Management**: Organize users into groups and manage subscriber preferences
5. **Monitor Campaign Performance**: Measure email delivery rates, open rates, and click-through rates

---

## Core Workflow

**Marketer uses Helix to send a campaign:**
1. Define target audience or create contact group
2. Compose email or SMS message
3. Send and track delivery status
4. Monitor engagement metrics (opens, clicks, responses)
5. Use analytics insights to refine future campaigns

**Product Manager uses Helix to understand user behavior:**
1. Dashboard shows real-time product analytics (PostHog)
2. Identify high-engagement features and user funnels
3. Correlate analytics with user communication (who received what campaign)
4. Make data-driven product decisions

---

## Essential Features (MVP)

### 1. **Complete PostHog Integration**
- Install PostHog SDK in next-js-boilerplate
- Initialize analytics on client and server side
- Verify tracking works in development and production
- Expose analytics dashboard to users

### 2. **Expose Email/SMS Capabilities**
- Create API endpoint or frontend UI in next-js-boilerplate to send emails and SMS
- Connect to backend services in example-server (Nodemailer, Twilio)
- Ensure authenticated users can send messages
- Display delivery status and logs

### 3. **Email Marketing Platform Integration**
- Select and integrate SendGrid, Mailchimp, or equivalent
- Manage subscriber lists and opt-in/opt-out
- Support email templates
- Track delivery and engagement metrics

### 4. **Toolchain Documentation**
- Document which tools apply to each marketing use case
- Provide setup and configuration guides
- List dependencies and environment variables
- Include example workflows

---

## Features Explicitly Out of Scope (MVP)

- **Custom CRM**: Building a custom CRM system (use third-party platforms like HubSpot, Pipedrive)
- **Social Media Integration**: Social sharing buttons, social login beyond Clerk, or social posting
- **Advanced Segmentation**: Complex user segmentation engines or SQL-based audience filters (can be added later)
- **Lead Capture Forms**: Custom lead generation forms and landing page builders
- **Push Notifications**: Browser or mobile push notification infrastructure
- **SMS Marketing Campaigns**: Advanced SMS-specific campaign tools (beyond basic Twilio integration)
- **Multi-workspace Tenancy**: Separate marketing tooling per workspace/organization (consider for future)

---

## Success Criteria

1. **PostHog Production-Ready**: Analytics SDK installed, initialized, and collecting events in both development and production environments; analytics dashboard accessible
2. **Email/SMS Exposed**: Frontend API or UI for sending emails and SMS; users can trigger messages without backend access; delivery status visible
3. **Email Marketing Functional**: Email marketing platform selected and integrated; subscriber lists and basic campaigns operational; send/delivery/bounce metrics tracked
4. **Zero Breaking Changes**: All changes completed without downtime or breaking existing integrations; authentication, localization, and error tracking remain intact
5. **Documentation Complete**: Setup guides, architecture diagrams, and troubleshooting steps documented in README; team can onboard new marketers
6. **Metrics Verified**: Marketing tool statuses verified by running tests; PostHog events confirmed, email sends logged, SMS delivery confirmed

---

## Key Design Principles

1. **Production-Ready First**: All tools must be fully installed and functional; no "configured but missing" dependencies
2. **Unified User Experience**: Marketing tools should be discoverable and usable from next-js-boilerplate; avoid hiding backend capabilities
3. **Minimal Breaking Changes**: Extend existing architecture rather than refactor; preserve working integrations (Clerk, Sentry, Arcjet)
4. **Multi-Repository Coordination**: Frontend, backend, and UI components work together; clear responsibility boundaries (frontend owns UX, backend owns execution)
5. **Observable & Debuggable**: All marketing tool failures should be logged; Sentry captures errors; Better Stack/LogTape provides visibility

---

## Scope & Constraints

**In Scope (affected repositories):**
- **next-js-boilerplate**: Target for PostHog completion, email/SMS exposure, email platform integration, and unified marketing UI
- **example-server**: Reference for backend services; may need minor API enhancements
- **example-client**: Reference for contact/group management UI patterns

**Constraints:**
- Must avoid breaking existing functionality (authentication, monitoring, error tracking, localization)
- Changes must be compatible with multi-language setup (i18n)
- Production configuration in `.env.production` must not be disrupted
- Clerk user identity must be preserved and leveraged for email/SMS targeting
- Arcjet security policies must be reviewed before exposing new endpoints

**Dependencies:**
- Existing backend services in example-server (Twilio, Nodemailer, node-cron, Prisma)
- Clerk for user authentication and identity
- Sentry for error tracking
- Environment variable validation via Env.ts

---

## Future Considerations

1. **Advanced User Segmentation**: SQL-based audience filters, behavioral triggers, and multi-step campaigns
2. **Workflow Automation**: Trigger emails/SMS based on user events, deadlines, or milestones
3. **Custom CRM Integration**: HubSpot, Pipedrive, or Salesforce sync for lead management
4. **Social Media Tools**: Social sharing metadata, social login extensions, and social posting
5. **A/B Testing**: Email subject line and content variants with statistical significance testing
6. **Mobile Push**: Notification support for mobile apps and web browsers
7. **Compliance & Privacy**: GDPR, CCPA, and CAN-SPAM compliance tooling and audit logs
8. **Multi-Workspace Marketing**: Separate marketing config and analytics per workspace/tenant
9. **Custom Email Templates**: Visual email builder with drag-and-drop components
10. **Real-Time Dashboards**: Live campaign performance, engagement trends, and cohort analysis

---

## Open Questions / Risks

### Architectural Decisions (Blocking)
1. **Email/SMS Exposure Strategy**: Should Twilio/Nodemailer capabilities be migrated into next-js-boilerplate or remain in example-server with API exposure?
   - *Risk*: Choosing the wrong approach could require rework; consider scalability, ownership, and testing
2. **Email Platform Selection**: Which platform (SendGrid, Mailchimp, Klaviyo, Twilio SendGrid)? Requirements differ (cost, features, API maturity)
   - *Risk*: Switching platforms after launch is expensive; validate with marketing team first

### Integration Risks
1. **PostHog SDK Install**: Does PostHog have any conflicts with existing Sentry instrumentation or Next.js middleware?
   - *Mitigation*: Test in development first; review Sentry/PostHog docs for known issues
2. **Email Service Quotas**: Does Nodemailer / selected email platform have rate limits or monthly quotas that could block campaigns?
   - *Mitigation*: Document limits in setup guide; implement request throttling if needed
3. **Twilio SMS Cost**: SMS sending has per-message costs; ensure billing is monitored and alerted
   - *Mitigation*: Implement usage tracking and cost estimates before sending campaigns

### Technical Unknowns
1. Does PostHog SDK installation require webpack config changes or Next.js middleware updates beyond what's in next.config.ts?
2. Should email/SMS API endpoints be added to next-js-boilerplate or to example-server with next-js-boilerplate acting as a proxy?
3. How should subscriber lists be synced between Clerk user identity and the email marketing platform?
4. What logging/audit trail is needed for GDPR and CCPA compliance?

---

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `scout/scout-summary.md` | Comprehensive inventory of 13 marketing tools across Helix | Identified 6 critical gaps: PostHog SDK missing, email/SMS isolated, no email marketing platform, no CRM/lead capture, no social media integration |
| `scout/reference-map.json` | Detailed file paths and evidence for each tool's status | PostHog configured but SDK absent from package.json; Twilio/Nodemailer present only in example-server; Sentry and Clerk production-ready |
| `diagnosis/diagnosis-statement.md` | Root cause analysis and priority assessment | Three root causes: (1) PostHog incomplete, (2) frontend-backend disconnect, (3) missing email marketing platform; prioritized PostHog and email/SMS exposure as highest-impact quick wins |
| `diagnosis/apl.json` | Q&A format evidence and prioritization reasoning | Confirmed 13 tools identified; 1 non-functional (PostHog SDK), 12 production-ready; five answers explain gaps and recommend priority sequence |
| `repo-guidance.json` | Repository role and intent clarification | next-js-boilerplate is target for changes; example-server and example-client provide context/reference; fragmentation is core issue |
| `ticket.md` | Original problem statement | Asks "What tools can Helix use in order to do marketing"—frames need as capability assessment and toolchain completion |

