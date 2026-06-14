# Domains, DNS and Renewals

## Purpose

This document explains GSWS functionality for domain search, registration, transfer, listing, DNS, contacts, privacy, DNSSEC, WHOIS and renewal handling.

## Provider

Domain functionality is provider-backed through the 20i API client. The shared provider client lives at:

```text
src/lib/api/client.ts
```

Domain helper logic is also referenced under:

```text
src/lib/api/domains.ts
```

## Dashboard Areas

The dashboard navigation exposes:

1. Domains.
2. Register Domain.
3. Renewals.

Domain management pages also include domain-specific DNS and nameserver management.

## Main Route Areas

| Route | Purpose |
| --- | --- |
| `/api/domains/list` | List user domains. |
| `/api/domains/register` | Register a new domain. |
| `/api/domains/transfer` | Transfer an existing domain. |
| `/api/domains/[domain]/dns` | Manage DNS records for a domain. |
| `/api/domains/[domain]/nameservers` | Manage nameservers. |
| `/api/domains/[domain]/contacts` | Manage domain contacts. |
| `/api/domains/[domain]/privacy` | Manage domain privacy. |
| `/api/domains/[domain]/dnssec` | Manage DNSSEC. |
| `/api/domains/[domain]/whois` | Retrieve WHOIS data. |
| `/api/domains/[domain]/renew` | Renew a domain. |
| `/api/catalogue/domains` | Domain catalogue/search information. |
| `/api/renewals` | Renewal dashboard data. |

## Ownership and Access

Domain routes should verify that the current effective user owns or can access the domain before exposing details or allowing mutation.

Required checks for write routes:

1. Session exists.
2. Domain ownership/access is confirmed.
3. Account-member role permits the action.
4. Billing permission is checked where the action creates spend.
5. Payload is validated.
6. Provider call is performed.
7. Audit trail is created for high-risk changes.

## DNS Behaviour

GSWS has two DNS surfaces:

1. Package DNS: `/api/packages/[id]/dns`.
2. Domain DNS: `/api/domains/[domain]/dns`.

Package DNS is scoped by hosting package. Domain DNS is scoped directly by domain name.

DNS records should be normalised before they reach the UI, because provider payloads may use different fields for A, AAAA, CNAME, TXT, MX and other record types.

Common normalised fields:

| Field | Meaning |
| --- | --- |
| `ref` | Provider record reference/ID. |
| `type` | DNS record type. |
| `host` | Host/name, commonly `@` for root. |
| `domain` | Parent domain. |
| `data` | Target, IP, IPv6, text or mail server value. |
| `ttl` | TTL. |
| `priority` | MX/SRV style priority where applicable. |

## Domain Registration

Registration should be treated as a billing-sensitive operation.

Expected controls:

1. User must be authenticated.
2. User must have billing permission.
3. Spend PIN or spend controls should be enforced where applicable.
4. Domain availability and price should be confirmed before purchase.
5. Provider registration response should be recorded locally.
6. Credit balance or payment state should be updated consistently.
7. Failure states must not create a false local ownership record.

## Domain Transfer

Domain transfer should be treated as a high-risk operation.

Expected controls:

1. Validate domain format.
2. Confirm transfer eligibility and provider requirements.
3. Require billing permission if transfer has a fee.
4. Store transfer state for follow-up.
5. Surface provider errors clearly.

## Renewals

The renewals area should combine domain and service renewal information into a customer-facing renewal dashboard.

Renewal actions should:

1. Check ownership.
2. Check billing permission.
3. Confirm renewal price and period.
4. Check credit/spend controls.
5. Execute provider renewal.
6. Record payment or credit transaction.
7. Record audit trail.

## DNSSEC, Privacy and Contacts

These features can materially affect domain operation and registrant visibility.

Use careful payload validation and audit logs for:

1. DNSSEC enable/disable.
2. Nameserver changes.
3. Registrant/admin/technical contact changes.
4. Domain privacy changes.

## Support Notes

Common customer issues:

1. DNS propagation delay.
2. Wrong nameservers set at registry level.
3. Domain privacy not available for a TLD.
4. DNSSEC misconfiguration causing resolution failure.
5. Failed renewal because of insufficient balance or provider rejection.
6. Transfer failure because of lock, invalid auth code or recent registration.

## Developer Rules

1. Do not mutate domains using only a path parameter without ownership validation.
2. Do not expose raw provider contact data to unauthorised members.
3. Treat renewal and registration as billing-sensitive.
4. Audit all domain write operations.
5. Keep domain and package DNS concepts separate in code and documentation.
