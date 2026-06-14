# Database and Data Model

## Purpose

GSWS uses a local SQLite database stored at `data/gsws.db`. The database is accessed directly with `better-sqlite3` and, for Better Auth, through Kysely.

## Runtime Location

```text
data/gsws.db
```

`src/lib/db.ts` creates the `data` directory automatically if required.

## SQLite Pragmas

The database module applies:

1. `journal_mode = WAL`.
2. `busy_timeout = 5000`.
3. `foreign_keys = ON`.

These are important for concurrent access from the Next.js server and terminal server.

## Tables Created in `src/lib/db.ts`

### `gsws_users`

Stores local GSWS user records.

Known columns:

| Column | Purpose |
| --- | --- |
| `id` | Local GSWS user ID. |
| `wp_user_id` | WordPress user ID. Unique and required in the bootstrap schema. |
| `email` | User email. Unique. |
| `name` | Display name. |
| `first_name` | First name. |
| `last_name` | Last name. |
| `avatar_url` | Avatar URL. |
| `role` | Local account role. Defaults to `user`. |
| `credit_balance` | Legacy balance field. Current code prefers `gsws_user_credits` for balance. |
| `is_active` | Active flag. |
| `created_at` | Creation timestamp. |
| `updated_at` | Update timestamp. |

Important note: newer Better Auth code also references additional user fields such as `password_hash`, `stackcp_user_id`, `gswsUserId`, `authProvider` and `isActive`. Confirm migration scripts before changing the user schema.

### `gsws_sessions`

Legacy GSWS session table.

Known columns:

| Column | Purpose |
| --- | --- |
| `id` | Session ID. |
| `user_id` | FK to `gsws_users`. |
| `token` | Legacy session token. |
| `expires_at` | Expiry timestamp. |
| `created_at` | Creation timestamp. |

### `gsws_package_access`

Stores local package access grants.

Known columns:

| Column | Purpose |
| --- | --- |
| `id` | Access record ID. |
| `user_id` | FK to `gsws_users`. |
| `package_id` | External package ID. |
| `can_manage` | Manage permission flag. |
| `can_topup` | Top-up permission flag. |
| `granted_at` | Grant timestamp. |

### `gsws_topup_history`

Stores credit top-up history.

Known columns:

| Column | Purpose |
| --- | --- |
| `id` | Top-up record ID. |
| `user_id` | FK to `gsws_users`. |
| `amount` | Amount. |
| `currency` | Currency, default `GBP`. |
| `reference` | Payment or internal reference. |
| `status` | Payment status. |
| `created_at` | Creation timestamp. |

## Additional Tables Referenced by Code

The codebase references several tables that are not created in the visible `src/lib/db.ts` bootstrap file. These may be created by migration scripts, seed scripts, manual production migrations or future code.

| Table | Referenced For |
| --- | --- |
| `gsws_user_credits` | Current credit balance source. |
| `gsws_credit_transactions` | Credit ledger entries. |
| `gsws_user_packages` | Ownership of 20i hosting packages. |
| `gsws_compute_orders` | VPS and GPU orders. |
| `gsws_account_members` | Delegated account/member access. |
| `gsws_api_credentials` | API client credentials and scopes. |
| `gsws_impersonation` | Support impersonation tokens. |
| `gsws_managed_services` | Managed-service lock enforcement. |
| `gsws_audit_log` | Audit trail for sensitive actions. |
| `twoFactor` | Better Auth two-factor records. |
| `session` | Better Auth session table. |
| `user` | Better Auth user table. |

## Schema Drift Risk

There is a current schema drift risk because the bootstrap database file does not declare every table used by the application. Any deployment, migration, reset or local onboarding process must ensure all referenced tables exist.

Recommended action:

1. Add explicit migration files.
2. Create a migration runner.
3. Document table ownership.
4. Keep generated Better Auth schema separate from GSWS business tables.
5. Avoid adding direct SQL in route handlers without updating this database map.

## Data Ownership Pattern

Most customer resources should be scoped by local GSWS user ID.

When a user is an account member:

1. `session.id` resolves to the owner user ID.
2. `session.actualUserId` preserves the real acting user.
3. Business data should usually use `session.id`.
4. Audit records should preserve `session.actualUserId` where relevant.

## Credits Pattern

The current session code states that credit balance is always read from `gsws_user_credits`. Legacy `gsws_users.credit_balance` may exist but should not be treated as the current source of truth unless confirmed.

Recommended credit tables:

1. `gsws_user_credits` as balance snapshot.
2. `gsws_credit_transactions` as immutable ledger.
3. `gsws_topup_history` as payment/top-up status history.

## Audit Pattern

Use `gsws_audit_log` for:

1. Terminal connect/disconnect.
2. Credit grants.
3. Support impersonation.
4. Provider mutations.
5. Security-sensitive account changes.
6. API credential creation/deletion.
7. Managed-service state changes.

## Backup and Recovery Notes

Because SQLite is a single-file database, operations should define:

1. Backup cadence.
2. WAL checkpoint handling.
3. Restore process.
4. Migration rollback process.
5. Production database file permissions.
6. Separation of runtime database from repo files.

## Developer Rules

1. Do not create new tables implicitly inside unrelated route handlers.
2. Update this document when adding or changing tables.
3. Prefer explicit migration scripts over ad-hoc production SQL.
4. Keep provider IDs as strings where provider formats are not guaranteed numeric.
5. Store secrets only as hashes or provider-side references.
6. Never log session tokens, API secrets, OAuth secrets, Stripe secrets or SSH keys.
