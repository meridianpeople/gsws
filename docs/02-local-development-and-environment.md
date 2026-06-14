# Local Development and Environment

## Purpose

This document explains the local development surface for GSWS. It covers how to start the app, the expected local services, key environment variables and the special handling required for provider integrations.

## Development Commands

The repository defines the following package scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Build the production application. |
| `npm run start` | Start the production Next.js server after build. |
| `npm run lint` | Run ESLint. |

## Local URL

By default, the Next.js app runs on:

```text
http://localhost:3000
```

The Better Auth trusted origins include both the deployed GSWS URL and localhost.

## Runtime Data Directory

GSWS stores its SQLite database at:

```text
data/gsws.db
```

The `src/lib/db.ts` module creates the `data` directory automatically if it does not already exist.

Do not commit runtime database files.

## Core Environment Variables

| Variable | Used By | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Better Auth | Authentication signing secret. Required. |
| `BETTER_AUTH_URL` | Better Auth | Auth base URL. Defaults to `https://sws.geig.co.uk`. |
| `GSWS_URL` | Better Auth trusted origins | Public GSWS URL. |
| `GITHUB_CLIENT_ID` | Better Auth | GitHub OAuth client ID. |
| `GITHUB_CLIENT_SECRET` | Better Auth | GitHub OAuth client secret. |
| `GOOGLE_CLIENT_ID` | Better Auth | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Better Auth | Google OAuth client secret. |
| `TWENTYI_BASE_URL` | 20i API client | Optional 20i base URL override. Defaults to `https://api.20i.com`. |
| `TWENTYI_API_KEY` | 20i API client | 20i general API key. |
| `TALIUSAPI_URL` | Legacy WordPress auth | WordPress/Talius API base URL. Defaults to `https://taliusapi.geig.co.uk`. |
| `WP_INTERNAL_KEY` | Legacy WordPress role lookup | Internal WordPress API credential. |
| `CONTABO_CLIENT_ID` | Contabo client | OAuth client ID. |
| `CONTABO_CLIENT_SECRET` | Contabo client | OAuth client secret. |
| `CONTABO_API_USER` | Contabo client | Contabo API username. |
| `CONTABO_API_PASSWORD` | Contabo client | Contabo API password. |
| `VASTAI_API_KEY` | Vast.ai client | GPU provider API key. |
| `SWS_SSH_PRIVATE_KEY_PATH` | Terminal server | Private SSH key used by the terminal bridge. |
| `SWS_SSH_PUBLIC_KEY_PATH` | Vast.ai provisioning | Public SSH key injected into GPU instances. |

## Terminal Server Environment

The terminal bridge reads `.env.local` manually from the repository root. It specifically reads:

1. `TWENTYI_API_KEY`.
2. `SWS_SSH_PRIVATE_KEY_PATH`.

The terminal server also expects Redis at:

```text
127.0.0.1:6379
```

The terminal server listens on:

```text
3002
```

## Local Services Required

| Service | Required For |
| --- | --- |
| Node.js | Next.js and terminal server. |
| SQLite | Local database via `better-sqlite3`. |
| Redis | Terminal concurrent-session limiting. |
| Internet access | 20i, Contabo, Vast.ai, Stripe, WordPress/Talius and OAuth providers. |
| SSH keypair | Browser terminal and GPU SSH injection. |

## Recommended Local Setup Sequence

1. Install Node dependencies with `npm install`.
2. Create `.env.local` with the minimum secrets needed for the feature being tested.
3. Start Redis if testing terminal access.
4. Run `npm run dev` for the dashboard.
5. Start `terminal-server.js` separately when testing browser terminal access.
6. Use a clean local `data/gsws.db` unless intentionally testing migrated production data.

## Development Safety Notes

1. Avoid using production provider credentials in local development unless necessary.
2. Treat 20i, Contabo, Vast.ai and Stripe actions as live external mutations.
3. Use test mode for Stripe where possible.
4. Do not commit `.env.local`, `data/gsws.db`, SSH keys, logs or provider response dumps containing customer data.
5. Confirm route permission checks before adding any new write action.

## Troubleshooting

| Symptom | Likely Cause | Check |
| --- | --- | --- |
| Auth cookies not set locally | Secure-cookie settings or base URL mismatch | `BETTER_AUTH_URL`, localhost origin and browser cookie state. |
| API calls return unauthenticated | Session cookie missing or migration mismatch | `getGswsSession()` path and cookie names. |
| 20i actions fail | Missing or invalid `TWENTYI_API_KEY` | Provider client config and response error. |
| VPS actions fail | Contabo credentials missing or invalid | Contabo env variables and token response. |
| GPU search/provisioning fails | Missing `VASTAI_API_KEY` or no matching offers | Vast.ai tier filters and provider response. |
| Terminal fails to connect | Redis, SSH key, session, package ownership or provider credentials | Terminal server logs and `/health`. |
