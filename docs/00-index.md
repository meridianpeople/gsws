# GSWS Knowledge Base

GSWS means GeiG Simple Web Service. It is a Next.js-based customer control panel for GeiG hosting, domains, DNS, email, databases, SSL, CDN, backups, compute, terminal access, account management, team access, credits and billing.

This knowledge base documents the current codebase as implemented in the repository. It is intended for developers, support operators, deployment maintainers and future AI-assisted code review.

## Documentation Map

| Area | Document |
| --- | --- |
| System overview | [Architecture](./01-architecture.md) |
| Development setup | [Local Development and Environment](./02-local-development-and-environment.md) |
| Authentication, sessions and permissions | [Authentication, Sessions and Permissions](./03-authentication-sessions-and-permissions.md) |
| Database and persistence | [Database and Data Model](./04-database-and-data-model.md) |
| API surfaces | [API Route Map](./05-api-route-map.md) |
| Hosting and 20i package management | [Hosting Packages and 20i](./06-hosting-packages-and-20i.md) |
| Domains, DNS and renewals | [Domains, DNS and Renewals](./07-domains-dns-and-renewals.md) |
| Email, databases, files and WordPress | [Email, Databases, Files and WordPress](./08-email-databases-files-and-wordpress.md) |
| SSL, CDN, backups and security | [SSL, CDN, Backups and Security](./09-ssl-cdn-backups-and-security.md) |
| VPS and GPU compute | [Compute: VPS and GPU](./10-compute-vps-and-gpu.md) |
| Browser terminal and SSH bridge | [Terminal Server](./11-terminal-server.md) |
| Billing, credits and account management | [Billing, Credits and Account Management](./12-billing-credits-and-account-management.md) |
| Support, managed locks and operations | [Support, Managed Locks and Operations](./13-support-managed-locks-and-operations.md) |

## Current Product Modules

GSWS currently exposes customer-facing modules for:

1. Workspace overview.
2. Domains and DNS.
3. Domain registration and renewal.
4. Hosting packages.
5. WordPress tooling.
6. Windows and Linux hosting areas.
7. DNS management.
8. Email management.
9. Database management.
10. Backups.
11. CDN.
12. SSL.
13. Security and malware scanning.
14. VPS compute.
15. GPU compute.
16. Terminal access.
17. API reference and API credentials.
18. Account top-up, statement and member management.
19. Support tickets and managed services.

## Documentation Principles

1. Document behaviour from the code first.
2. Prefer exact route names, table names and environment variables where visible.
3. Mark inferred or partially discovered behaviour as needing verification.
4. Keep customer-facing behaviour separate from provider-specific implementation.
5. Treat provider APIs, SSH access, billing and impersonation as high-risk areas requiring careful review before changes.

## Known Documentation Gaps

The previous root README was the default Next.js starter README. It did not document the GSWS product, the 20i integration, the custom SQLite schema, Better Auth migration, terminal service, Contabo/Vast.ai compute providers, Stripe top-up flow or support/managed-service behaviour.

This `/docs` directory is the first structured knowledge base for the repository.
