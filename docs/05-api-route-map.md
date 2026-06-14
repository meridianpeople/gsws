# API Route Map

## Purpose

This document maps the internal API surface used by the GSWS dashboard and external API clients. It is not a full OpenAPI specification. It is a functional map for developers and support operators.

## Route Handler Convention

Most API route handlers follow this pattern:

1. Import `NextRequest` and `NextResponse` from `next/server`.
2. Resolve the current user through `getGswsSession(req)`.
3. Verify resource ownership in SQLite.
4. Check account-member permissions where relevant.
5. Check managed-service lock on write routes.
6. Validate request JSON.
7. Call a provider client or database operation.
8. Return a JSON response.

## Authentication and Account Routes

| Route Area | Purpose |
| --- | --- |
| `/api/auth/...` | Login, logout, reset password, email verification and auth-support endpoints. |
| `/api/auth/me` | Current user/session metadata used by dashboard layout and sidebar. |
| `/api/account/api-credentials` | Create, list and manage API credentials. |
| `/api/account/spend-pin` | Spend PIN controls. |
| `/api/account/topup/stripe` | Stripe top-up session creation. |
| `/api/account/topup/stripe-webhook` | Stripe webhook processing for top-ups. |
| `/api/account/members` | Account member invitation and management. |

## Hosting Package Routes

| Route Area | Purpose |
| --- | --- |
| `/api/packages/list` | List packages available to the current user. |
| `/api/packages/delete` | Delete or detach hosting packages. |
| `/api/packages/[id]/...` | Package-specific controls. |
| `/api/packages/[id]/dns` | DNS records for a hosting package. |
| `/api/packages/[id]/email/...` | Mailbox, forwarder, autoresponder, quota and catch-all controls. |
| `/api/packages/[id]/databases/...` | MySQL/MSSQL database controls. |
| `/api/packages/[id]/ssl` | SSL controls. |
| `/api/packages/[id]/security/...` | Force SSL, malware scan and security controls. |
| `/api/packages/[id]/backups` | Backup controls. |
| `/api/packages/[id]/cdn/...` | CDN controls, blocked IPs and headers. |
| `/api/packages/[id]/files/...` | File/SSH-key controls. |
| `/api/packages/[id]/wordpress/...` | WordPress tools such as search/replace. |
| `/api/packages/[id]/php/version` | PHP version management. |
| `/api/packages/[id]/logs` | Package logs. |
| `/api/packages/[id]/tasks` | Package tasks. |

## Domain Routes

| Route Area | Purpose |
| --- | --- |
| `/api/domains/list` | List domains available to the current user. |
| `/api/domains/register` | Register a domain. |
| `/api/domains/transfer` | Transfer a domain. |
| `/api/domains/[domain]/dns` | Domain-level DNS controls. |
| `/api/domains/[domain]/nameservers` | Nameserver controls. |
| `/api/domains/[domain]/contacts` | Domain contact controls. |
| `/api/domains/[domain]/privacy` | Domain privacy controls. |
| `/api/domains/[domain]/dnssec` | DNSSEC controls. |
| `/api/domains/[domain]/whois` | WHOIS data. |
| `/api/domains/[domain]/renew` | Domain renewal. |
| `/api/catalogue/domains` | Domain catalogue/search data. |
| `/api/renewals` | Renewal dashboard data. |

## Compute Routes

| Route Area | Purpose |
| --- | --- |
| `/api/compute/vps` | VPS list/provisioning entry point. |
| `/api/compute/vps/[instanceId]` | VPS detail and lifecycle actions. |
| `/api/compute/vps/[instanceId]/firewall` | VPS firewall controls. |
| `/api/compute/vps/[instanceId]/rescue` | VPS rescue mode or recovery actions. |
| `/api/compute/gpu` | GPU list/provisioning entry point. |
| `/api/compute/gpu/[orderId]` | GPU detail and lifecycle actions. |
| `/api/compute/gpu/[orderId]/logs` | GPU logs. |

## Support and Managed Routes

| Route Area | Purpose |
| --- | --- |
| `/api/support/tickets` | Support ticket operations. |
| `/api/managed` | Managed-service state and listing. |
| `/api/invite/[token]` | Account/team invitation token flow. |
| `/api/notifications` | Dashboard notifications. |
| `/api/health` | Health endpoint. |
| `/api/cli` | CLI/terminal-related endpoint. |

## Permission Expectations

| Operation Type | Expected Checks |
| --- | --- |
| Public health check | No customer session required. |
| Current account/session read | Session required. |
| Customer resource read | Session and ownership required. |
| Customer resource write | Session, ownership, write permission and managed-lock check required. |
| Billing action | Session, billing permission and spend/PIN controls where applicable. |
| API credential action | Session and account-level permission required. |
| Support impersonation | Support/super-admin role and audit trail required. |
| Terminal connection | Session, ownership, Redis connection limit and SSH key availability required. |

## Route Documentation Rule

When adding a route, update this file with:

1. Route path.
2. HTTP methods.
3. Required permissions.
4. Tables used.
5. Provider called.
6. Managed-lock behaviour.
7. Audit behaviour.
8. Common errors.

## Recommended Future Work

1. Generate a machine-readable OpenAPI or JSON route registry.
2. Add route-level tests for unauthenticated, unauthorized, managed-locked and happy-path cases.
3. Add standard error response types.
4. Centralise ownership checks to reduce route-level duplication.
5. Add a route middleware pattern for repeated permission logic.
