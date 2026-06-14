# Email, Databases, Files and WordPress

## Purpose

This document explains GSWS package-level customer functionality for email, databases, files, SSH keys and WordPress tooling.

These features are normally scoped to a hosting package and therefore require package ownership checks before use.

## Common Security Pattern

For every package-level feature:

1. Resolve session with `getGswsSession(req)`.
2. Confirm the package belongs to the effective user.
3. Check account-member permissions.
4. Apply managed-service lock for write actions.
5. Validate the payload.
6. Call the provider or local database.
7. Return a safe normalised response.
8. Audit destructive or sensitive actions.

## Email

### Functional Scope

Email management covers:

1. Mailbox creation and deletion.
2. Mailbox password changes.
3. Mailbox quota changes.
4. Forwarders.
5. Autoresponders.
6. Catch-all address handling.

### Route Areas

| Route Area | Purpose |
| --- | --- |
| `/api/packages/[id]/email/mailbox` | Mailbox listing and mailbox operations. |
| `/api/packages/[id]/email/mailbox/password` | Mailbox password reset/change. |
| `/api/packages/[id]/email/quota` | Mailbox quota changes. |
| `/api/packages/[id]/email/forwarder` | Email forwarding rules. |
| `/api/packages/[id]/email/autoresponder` | Autoresponder rules. |
| `/api/packages/[id]/email/catchall` | Catch-all routing. |

### Email Rules

1. Do not return mailbox passwords.
2. Validate mailbox names and domain ownership.
3. Require write permission for password, quota, forwarder, autoresponder and catch-all changes.
4. Audit mailbox deletion and password reset actions.
5. Make provider errors clear to support users without exposing secrets.

## Databases

### Functional Scope

Database management covers package-level database services, including MySQL-style and MSSQL-style functionality where available.

### Route Areas

| Route Area | Purpose |
| --- | --- |
| `/api/packages/[id]/databases/...` | Database listing and management. |
| `/api/packages/[id]/mssql` | MSSQL-related controls. |

### Database Rules

1. Confirm hosting package ownership before database operations.
2. Validate database names, usernames and passwords.
3. Do not return database passwords once set.
4. Require write permission for create, delete, password reset or quota-style operations.
5. Audit database deletion and password reset operations.

## Files and SSH Keys

### Functional Scope

File and SSH-key functionality supports package-level file access and SSH-key management.

### Route Areas

| Route Area | Purpose |
| --- | --- |
| `/api/packages/[id]/files/...` | File-management endpoints. |
| `/api/packages/[id]/files/sshkeys` | SSH-key management for hosting packages. |

### File and SSH Rules

1. Confirm package ownership before file or SSH-key operations.
2. Do not expose filesystem paths outside the package scope.
3. Validate SSH public key format before sending to provider.
4. Audit SSH-key additions and deletions.
5. Treat file deletion, upload and permission changes as high-risk.

## WordPress

### Functional Scope

WordPress tooling appears as both a dashboard navigation item and package-specific tools.

Known route area:

```text
/api/packages/[id]/wordpress/searchreplace
```

Expected functionality includes WordPress maintenance operations such as search/replace. Other WordPress features should follow the same package ownership and managed-lock model.

### WordPress Rules

1. Confirm package ownership.
2. Require write permission for maintenance actions.
3. Apply managed-service lock before mutation.
4. Validate search and replace values.
5. Warn users before destructive or irreversible operations.
6. Audit search/replace and other high-impact WordPress actions.

## PHP Version Selection

Known route area:

```text
/api/packages/[id]/php/version
```

PHP version changes can affect site runtime compatibility.

Rules:

1. Confirm package ownership.
2. Require write permission.
3. Apply managed lock.
4. Validate requested PHP version against provider-supported values.
5. Surface provider failure clearly.
6. Audit the old and new version where available.

## Logs and Tasks

Known route areas:

```text
/api/packages/[id]/logs
/api/packages/[id]/tasks
```

Logs are usually read-only and should require ownership. Tasks may include provider-side or application-side background work and should be documented individually as they mature.

## Support Considerations

Common support scenarios:

1. Customer cannot log into mailbox after password change.
2. Mailbox quota reached.
3. Forwarder loops or incorrect destination.
4. WordPress search/replace affected unexpected content.
5. Database credentials lost or reset needed.
6. PHP version change caused a site error.
7. SSH key is invalid or not applied by provider.

## Developer Rules

1. Keep package-level features scoped to `twentyi_package_id` plus effective user ID.
2. Never trust client-provided domain or package labels for ownership.
3. Do not return secrets in JSON responses.
4. Add audit logs to destructive actions.
5. Apply managed-service locks consistently across all write routes.
