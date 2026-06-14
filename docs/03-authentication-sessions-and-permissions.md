# Authentication, Sessions and Permissions

## Purpose

GSWS uses a layered authentication model. The current code supports Better Auth, API key authentication, support impersonation and a legacy GSWS session fallback used during migration.

## Authentication Layers

Session resolution is centralised in `src/lib/session.ts`.

The intended layers are:

1. API key authentication using `X-Client-ID` and `X-Client-Secret` headers.
2. Support impersonation through the `gsws_impersonate` cookie.
3. Better Auth session cookie lookup.
4. Legacy `gsws_session` cookie fallback.
5. Enrichment into a GSWS-specific session object.

## Better Auth Configuration

Better Auth is configured in `src/lib/better-auth.ts`.

Key behaviours:

1. SQLite persistence through Kysely and the `@better-auth/kysely-adapter` package.
2. Base URL defaults to `https://sws.geig.co.uk` unless overridden by `BETTER_AUTH_URL`.
3. Sessions last seven days.
4. Session cookies use the `gsws_ba` prefix.
5. Email/password auth is enabled.
6. Email verification is currently disabled in Better Auth config.
7. Passwords are hashed with bcrypt at cost factor 12.
8. GitHub and Google providers are configured through environment variables.
9. Two-factor authentication is enabled through Better Auth's two-factor plugin.
10. Rate limiting is enabled, including a stricter custom rule for email sign-in.

## Legacy WordPress Authentication

`src/lib/auth.ts` retains legacy WordPress authentication support.

The flow is:

1. Authenticate against the WordPress/Talius JWT endpoint.
2. Fetch roles from WordPress where possible.
3. Upsert a local `gsws_users` record.
4. Grant welcome credit for eligible roles.
5. Create a legacy `gsws_sessions` token.

This path should be treated as migration-sensitive. Do not remove it until all active users have been migrated to Better Auth and no route depends on `gsws_session` fallback.

## API Key Authentication

API key authentication is handled first when a request object is available.

Expected headers:

```text
X-Client-ID: <client id>
X-Client-Secret: <client secret>
```

Behaviour:

1. Look up an active row in `gsws_api_credentials`.
2. Compare the submitted secret with the stored bcrypt hash.
3. Resolve the owning `gsws_users` row.
4. Update `last_used_at`.
5. Build a session with API key scopes.
6. Fail closed if API key headers are present but invalid.

Scopes are used by `checkPermission()` in `src/lib/auth.ts`. API credentials must include `read` for read operations and `write` for write operations.

## Impersonation

Support impersonation uses `gsws_impersonate`.

Behaviour:

1. Read impersonation token from request cookies or request headers.
2. Look up the token in `gsws_impersonation`.
3. Require active status and non-expired token.
4. Require the support user role to be `support` or `super_admin`.
5. Return a session scoped to the target user, with `actualUserId` pointing to the support user.

All impersonation-sensitive actions should audit both the target user and the acting support user where possible.

## Account Member Scoping

GSWS supports delegated account access through `gsws_account_members`.

When a logged-in user is an active member of another account:

1. `session.id` becomes the owner account ID for data access.
2. `session.actualUserId` remains the real logged-in user.
3. `session.isMember` is true.
4. `session.memberRole` controls permissions.
5. Credit balance resolves from the owner account.

This is important: database queries for packages, domains, credits and compute resources should use the effective owner ID, while audit trails should preserve the actual acting user where possible.

## Permission Roles

The visible role model is:

| Role | Read | Write | Billing | Manage Team |
| --- | --- | --- | --- | --- |
| `admin` | Yes | Yes | Yes | Yes |
| `billing` | Yes | No | Yes | No |
| `viewer` | Yes | No | No | No |

Account owners are treated as having full access.

## Permission Helpers

Use these helpers consistently:

| Helper | Use |
| --- | --- |
| `checkPermission(user, permission)` | General role and API scope permission check. |
| `requireWrite(user)` | Enforce write access before mutation. |
| `requireBilling(user)` | Enforce billing access before billing/account-money actions. |
| `requirePermission(session, permission)` | Session-level permission helper in `session.ts`. |

## Required Pattern for New API Routes

New protected routes should follow this order:

1. Resolve session through `getGswsSession(req)`.
2. Return `401` if missing.
3. Check ownership of the target resource.
4. Check managed-service lock for write routes.
5. Check role/API-key permission.
6. Validate request payload.
7. Perform database or provider action.
8. Audit high-risk changes.
9. Return JSON.

## Common Cookie Names

| Cookie | Purpose |
| --- | --- |
| `gsws_ba.session_token` | Better Auth session token. |
| `__Secure-gsws_ba.session_token` | Secure Better Auth session token. |
| `gsws_session` | Legacy GSWS session token. |
| `__Secure-gsws_session` | Secure legacy GSWS session token. |
| `gsws_impersonate` | Support impersonation token. |

## Security Notes

1. API key headers must fail closed if invalid.
2. Do not fall back to cookie auth when explicit invalid API credentials are supplied.
3. Never expose password hashes, API credential hashes, session tokens or impersonation tokens in API responses.
4. Do not use `session.email` for ownership checks where a stable local user ID is available.
5. Use `actualUserId` in audit logs when members or support impersonation are involved.
6. Review all write routes for `requireWrite()` and managed-lock enforcement.
