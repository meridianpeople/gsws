# SSL, CDN, Backups and Security

## Purpose

This document explains the GSWS package-level controls for SSL, CDN, backups, malware/security scanning and force-SSL behaviour.

These modules are normally provider-backed through 20i and scoped to a hosting package.

## Common Access Pattern

All package-level read operations should:

1. Resolve the current GSWS session.
2. Confirm the package belongs to the effective user.
3. Return only safe, normalised data.

All package-level write operations should additionally:

1. Check member write permission.
2. Check managed-service lock.
3. Validate the payload.
4. Audit the action where it changes security, certificate, backup or CDN state.

## SSL

### Functional Scope

SSL functionality allows users to view or manage SSL state for hosting packages and domains.

Known route area:

```text
/api/packages/[id]/ssl
```

### Expected Behaviour

SSL actions may include:

1. Viewing certificate state.
2. Requesting or enabling SSL.
3. Renewing or reinstalling SSL.
4. Removing or replacing certificate settings.
5. Checking certificate errors.

### Risk Notes

SSL changes can make a customer site unavailable or insecure. Always validate package ownership and audit state-changing actions.

## Force SSL

Known route area:

```text
/api/packages/[id]/security/forcessl
```

Force SSL redirects HTTP traffic to HTTPS. It should be treated as a write operation because it can affect site accessibility.

Rules:

1. Confirm package ownership.
2. Require write permission.
3. Apply managed-service lock.
4. Confirm SSL availability where possible before enabling.
5. Audit enable/disable changes.

## Malware and Security Scanning

Known route areas:

```text
/api/packages/[id]/security/scan
/api/packages/[id]/malware
```

Security features may include malware status, scan initiation and threat visibility.

Rules:

1. Read access can show scan status and findings to authorised users.
2. Scan initiation should require write permission if it triggers provider-side work.
3. Remediation actions should require write permission and audit logging.
4. Do not expose sensitive filesystem details beyond what the customer needs.

## CDN

### Functional Scope

CDN features include CDN configuration, headers and blocked IP controls.

Known route areas:

```text
/api/packages/[id]/cdn
/api/packages/[id]/cdn/block/ips
/api/packages/[id]/cdn/headers
```

### CDN Rules

1. Confirm package ownership.
2. Require write permission for configuration changes.
3. Apply managed-service lock.
4. Validate header names and values.
5. Validate IP addresses and CIDR ranges before blocking.
6. Audit blocked IP and security-header changes.
7. Surface provider errors clearly.

## Backups

Known route area:

```text
/api/packages/[id]/backups
```

Backup functionality may include listing available backups, requesting restoration or managing backup-related state.

### Backup Rules

1. Backup listing requires ownership.
2. Restore operations require write permission.
3. Restore operations should warn customers about overwrite risk.
4. Managed-service locks should block customer restores where the service is managed.
5. Audit restore initiation.
6. Avoid exposing provider-internal backup identifiers unless needed by the UI.

## Logs

Known route area:

```text
/api/packages/[id]/logs
```

Logs are normally read-only but may contain sensitive path, IP or request data. Only authorised users should be able to access them.

## Operational Failure Modes

| Module | Common Failure |
| --- | --- |
| SSL | Certificate pending, failed validation, DNS not pointing correctly, provider rejection. |
| Force SSL | Redirect loop, SSL unavailable, mixed content. |
| CDN | Cache not purged, incorrect header, blocked legitimate IP. |
| Backups | No restore point available, restore failed, restore overwrote customer changes. |
| Malware/security | Scan pending, false positive, remediation unavailable. |

## Support Guidance

For support triage, capture:

1. User email.
2. Package ID.
3. Domain name.
4. Action attempted.
5. Provider error.
6. Timestamp.
7. Whether the service is managed.
8. Whether the user is an account member.
9. Audit log reference where available.

## Developer Rules

1. Treat SSL, CDN, backup restore and malware remediation as high-risk operations.
2. Do not bypass managed locks.
3. Do not return raw provider data if it contains sensitive implementation details.
4. Add audit logs for destructive or security-sensitive changes.
5. Keep customer-facing status messages clearer than provider error strings.
