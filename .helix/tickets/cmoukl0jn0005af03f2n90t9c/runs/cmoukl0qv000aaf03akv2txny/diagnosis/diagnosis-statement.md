# Diagnosis: Marketing Options for Helix

## Problem Summary

The ticket requests an assessment of marketing tools available to Helix. The scout research identified extensive marketing infrastructure across three repositories—next-js-boilerplate (primary frontend), example-server (backend services), and example-client (UI components). However, this infrastructure is incomplete and fragmented, preventing Helix from achieving end-to-end marketing capability. Most critically, key analytics and communication tools are either non-functional (PostHog) or isolated to the backend (SMS/email).

## Root Cause Analysis

The fragmentation stems from three distinct issues:

### 1. **Incomplete PostHog Integration (Highest Impact)**
PostHog product analytics is configured at the environment level (environment variables defined in Env.ts and .env files) but the SDK package is **missing from package.json**. This means analytics are referenced in configuration but non-functional at runtime. Users cannot be tracked, funnels cannot be measured, and product decisions cannot be informed by behavioral data.

*Evidence:*
- `scout/scout-summary.md`: "PostHog (configured but not installed): Environment variables defined... PostHog SDK package is missing from package.json, so analytics are not functional without additional setup."
- `scout/reference-map.json` fact 1: "Env.ts defines NEXT_PUBLIC_POSTHOG_KEY and NEXT_PUBLIC_POSTHOG_HOST (lines 18-19), .env shows NEXT_PUBLIC_POSTHOG_KEY=empty, no PostHog SDK import found in codebase."

### 2. **Frontend-Backend Disconnect (Communication Capabilities)**
Email sending (Nodemailer) and SMS messaging (Twilio) are fully implemented and functional in example-server, but next-js-boilerplate (the primary user-facing frontend) has **no integration or user interface** for these capabilities. Marketing campaigns cannot be launched from the main application, and the backend capabilities are invisible to users.

*Evidence:*
- `scout/scout-summary.md` gaps section: "Frontend-backend disconnect: SMS (Twilio) and email (Nodemailer) capabilities are isolated in example-server. The next-js-boilerplate frontend has no direct integration or UI for these features."
- Backend has messageService.ts and notificationService.ts fully implemented (example-server/src/services/)
- No imports or usage of these services visible in next-js-boilerplate

### 3. **Missing Commercial Email Marketing Platform**
No SendGrid, Mailchimp, ConvertKit, or similar email marketing service is integrated. Only raw email sending (Nodemailer) is available, which lacks campaign management, subscriber lists, templates, analytics, and deliverability optimization.

*Evidence:*
- `scout/scout-summary.md` gaps section: "Email marketing integration: No SendGrid, Mailchimp, or similar email marketing platform configured. Email sending is available only in backend via Nodemailer."
- No `mailchimp`, `sendgrid`, `convertkit`, or similar packages in either package.json file

## Evidence Summary

| Category | Finding | Source |
|----------|---------|--------|
| **Analytics** | PostHog configured but SDK missing; unable to track user behavior | scout/scout-summary.md: "PostHog (configured but not installed)" |
| **Communication** | Twilio (SMS) and Nodemailer (email) in backend only; no frontend UI | scout/scout-summary.md: "Frontend-backend disconnect" |
| **Email Marketing** | No commercial email platform (SendGrid, Mailchimp, etc.) integrated | scout/scout-summary.md: gaps section |
| **Authentication** | Clerk fully integrated with user identity tracking capability | scout/reference-map.json fact 5 |
| **Monitoring** | Sentry (errors), Better Stack (logs), Checkly (uptime) all production-ready | scout/scout-summary.md and reference-map.json facts 2-3 |
| **SEO** | Dynamic sitemap.xml and robots.txt configured for search engine indexing | scout/reference-map.json fact 6 |
| **Localization** | next-intl + Crowdin supporting English and French | scout/reference-map.json fact 9 |
| **Security** | Arcjet (bot detection, WAF) active in production | scout/reference-map.json fact 4 |
| **CRM/Lead Capture** | No lead capture forms, newsletter signup, or CRM found | scout/scout-summary.md gaps section |
| **Social Media** | No social sharing buttons or social media integration | scout/scout-summary.md gaps section |

## Success Criteria

1. **PostHog Integration Complete**: PostHog SDK installed and initialized in next-js-boilerplate; product analytics tracking active in development and production.
2. **Email/SMS Exposed via Frontend**: next-js-boilerplate provides user-facing interface or API for sending SMS and email; backend services properly connected.
3. **Email Marketing Platform Selected**: SendGrid, Mailchimp, or similar platform integrated for campaign management, subscriber tracking, and analytics.
4. **Marketing Toolchain Documented**: Clear guidance on which tools apply to each marketing use case (product analytics, user communication, campaign management, lead capture).
5. **No Production Disruption**: Changes completed without downtime or breaking existing integrations.

## Artifact Inputs Used

| Artifact | Why Used | Key Takeaway |
|----------|----------|--------------|
| `scout/scout-summary.md` | Primary research output identifying all marketing tools and gaps | Comprehensive inventory of 13 tools; PostHog, email/SMS fragmentation, and missing platforms are key gaps |
| `scout/reference-map.json` | Detailed evidence for each marketing tool claim with file paths and line numbers | Facts 1-10 provide precise evidence; unknowns section lists 6 actionable gaps |
| `ticket.md` | Original ticket request | Asks "What tools can Helix use in order to do marketing"—frames diagnosis as capability assessment |
| Repository package.json files (next-js-boilerplate, example-server, example-client) | Validates which tools are actually installed vs. only configured | PostHog SDK absent; Twilio/Nodemailer present only in example-server |
| Env.ts, .env, .env.production | Shows configuration layer vs. implementation layer | PostHog and other tools configured but not all initialized |

---

**Diagnosis Status**: Complete. Root causes identified. Fragmentation across repositories is the core issue; PostHog and email/SMS exposure are the highest-impact quick wins.
