# Hosting Packages and 20i

## Purpose

This document explains the GSWS hosting package functionality and the 20i provider integration used by hosting-related modules.

## Provider Client

The shared 20i client is `src/lib/api/client.ts`.

Core behaviour:

1. Base URL defaults to `https://api.20i.com`.
2. `TWENTYI_BASE_URL` can override the base URL.
3. `TWENTYI_API_KEY` is base64 encoded and sent as a Bearer token.
4. Requests use JSON content and a 15-second timeout.
5. Common provider errors are normalised into application errors.

## Hosting Ownership

Hosting package access is checked locally before provider calls.

Common ownership table:

```text
gsws_user_packages
```

Common lookup pattern:

```sql
SELECT * FROM gsws_user_packages
WHERE twentyi_package_id = ? AND user_id = ?
```

The effective `user_id` should normally come from the resolved GSWS session. For account members, this may be the owner account ID rather than the real acting member ID.

## Dashboard Areas

Hosting functionality appears under the dashboard navigation group `Websites & Hosting`.

Visible areas include:

1. Hosting Packages.
2. WordPress.
3. Windows Hosting.
4. Linux Hosting.
5. DNS.
6. Email.
7. Databases.
8. Backups.
9. CDN.
10. SSL.
11. Security.

## Package Selector

The sidebar fetches package, VPS and GPU records and combines them into one active package/resource selector. Hosting packages are mapped as the `Hosting` group and link to `/packages/[id]`.

## Common Package Route Pattern

Package routes normally use:

1. `getGswsSession(req)`.
2. Local package ownership check.
3. Optional `checkManagedLock(user.id, 'hosting', id)`.
4. `requireWrite(user)` for mutations.
5. Shared 20i client call.
6. JSON response.

## Managed Lock

Managed services block customer-initiated write operations while still allowing read operations.

Use managed locks for package writes such as:

1. DNS changes.
2. Email changes.
3. Database changes.
4. SSL changes.
5. Security changes.
6. CDN changes.
7. File or SSH-key changes.
8. WordPress maintenance actions.

## Package DNS Example

`/api/packages/[id]/dns` demonstrates the standard pattern:

1. Resolve session.
2. Verify package ownership in `gsws_user_packages`.
3. Check managed lock for the package.
4. Apply write permission checks.
5. Call 20i `/package/{id}/dns`.
6. Normalise provider DNS record fields before returning them.

## Package Functional Areas

| Area | Typical Responsibility |
| --- | --- |
| Package list | Show hosting packages linked to the user. |
| DNS | Read, create and delete DNS records for package domains. |
| Email | Mailboxes, forwarders, autoresponders, quota and catch-all. |
| Databases | MySQL/MSSQL database management. |
| Files | File manager and SSH-key-related controls. |
| WordPress | WordPress management and search/replace operations. |
| PHP | PHP version selection. |
| SSL | SSL certificate management. |
| Security | Malware scanning and force SSL. |
| Backups | Backup listing and restore flows. |
| CDN | CDN settings, cache, headers and blocked IPs. |
| Logs | Package logs. |
| Tasks | Package tasks or background actions. |

## Error Handling

The 20i client maps provider responses:

| Provider Status | Application Error |
| --- | --- |
| `401` | Invalid 20i API key. |
| `403` | Permission denied. |
| `404` | Resource not found. |
| `429` | Rate limit exceeded. |
| Other | Provider message or generic unexpected error. |

## Security Requirements

1. Never call 20i package endpoints without confirming local package ownership.
2. Never allow billing/viewer members to mutate package resources unless their role permits it.
3. Never allow managed-service resources to be mutated directly by customers.
4. Avoid returning raw provider payloads where they include secrets or internal provider metadata.
5. Normalise provider fields into stable dashboard response shapes.
6. Audit high-risk provider mutations.

## Future Improvement

1. Centralise package ownership checks.
2. Add a provider abstraction layer for hosting operations.
3. Add integration tests with mocked 20i responses.
4. Add typed response DTOs for each package feature.
5. Add consistent audit logging for create/update/delete actions.
