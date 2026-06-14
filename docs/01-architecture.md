# GSWS Architecture

## Purpose

GSWS is a web control panel for GeiG hosting, domains, compute and customer account services. It combines a Next.js application, a local SQLite database, external provider APIs and a separate terminal WebSocket service.

## Main Runtime Components

| Component | Responsibility |
| --- | --- |
| Next.js app | Customer dashboard, server-rendered pages, route handlers and API endpoints. |
| React UI | Dashboard layouts, navigation, managers, forms and account pages. |
| SQLite database | Local persistence for users, sessions, package ownership, credits, account members, compute orders, API credentials, managed locks and audit records. |
| Better Auth | Modern authentication layer using SQLite through Kysely. |
| Legacy auth/session layer | Migration support for WordPress-originated GSWS users and older `gsws_session` cookies. |
| 20i API client | Hosting, package, domain, DNS, email, SSL, CDN, backup and security provider integration. |
| Contabo API client | VPS provisioning and lifecycle actions. |
| Vast.ai API client | GPU offer discovery, provisioning and lifecycle actions. |
| Stripe integration | Account credit top-up and webhook handling. |
| Terminal server | WebSocket-to-SSH bridge for browser terminal access. |
| Redis | Shared terminal connection limit storage. |

## Source Layout

| Path | Role |
| --- | --- |
| `src/app` | Next.js App Router pages, layouts and API route handlers. |
| `src/app/(dashboard)` | Authenticated dashboard UI modules. |
| `src/app/(auth)` | Authentication pages such as registration and email verification. |
| `src/app/api` | Server-side API route handlers used by dashboard components and external clients. |
| `src/components/layout` | Topbar, sidebar, mobile nav, theme provider, loading spinner and idle timeout. |
| `src/components/ui` | Shared UI components such as confirmation modals. |
| `src/lib` | Core server-side services: database, auth, sessions, provider clients, rate limits, mailer, managed locks and helper APIs. |
| `terminal-server.js` | Standalone Node.js terminal bridge service. |
| `data/gsws.db` | Runtime SQLite database location. This file should not be committed. |

## Request Flow

1. A customer opens a dashboard page.
2. The dashboard layout renders the shared topbar, sidebar, loading spinner, idle timeout and main content wrapper.
3. Client-side managers call internal `/api/...` route handlers.
4. Route handlers resolve the current GSWS session using `getGswsSession()`.
5. Ownership and permission checks are applied before sensitive reads or writes.
6. Provider clients call 20i, Contabo, Vast.ai or Stripe where needed.
7. Local database tables store user, ownership, credit, support, compute and audit state.
8. JSON responses return normalised state to the dashboard UI.

## Dashboard Layout

The dashboard layout is a shared shell wrapping all authenticated dashboard content. It includes:

1. `MobileNavProvider`.
2. `Topbar`.
3. `Sidebar`.
4. `LoadingSpinner`.
5. `IdleTimeout`.
6. `MainContent`.

The sidebar defines the visible product taxonomy. The current navigation groups are Workspace, Domains & DNS, Websites & Hosting, Compute and Tools.

## Provider Boundaries

### 20i

Used for hosting, packages, domains, DNS, email, SSL, CDN, backups and related hosting controls.

### Contabo

Used for VPS instance provisioning, listing, lifecycle actions, data-centre discovery, image discovery and secrets.

### Vast.ai

Used for GPU offer search, GPU instance creation, status polling, SSH key injection and lifecycle actions.

### Stripe

Used for account top-up payment sessions and webhook processing.

## High-Risk Boundaries

The following areas require extra review before changes:

1. Session resolution and authentication migration.
2. API key authentication and credential scopes.
3. Account member scoping and owner/member data access.
4. Write routes that mutate 20i/Contabo/Vast.ai resources.
5. Stripe webhook idempotency and credit balance updates.
6. Terminal WebSocket authentication and SSH access.
7. Support impersonation and managed-service write locks.
8. Local SQLite schema drift, because some referenced tables are created outside `src/lib/db.ts`.

## Architecture Rule

Any new module should follow this pattern:

1. Resolve session.
2. Check user status.
3. Check resource ownership.
4. Check member permissions.
5. Check managed-service lock for writes.
6. Validate payload.
7. Call provider or database.
8. Audit high-risk actions.
9. Return a normalised JSON response.
