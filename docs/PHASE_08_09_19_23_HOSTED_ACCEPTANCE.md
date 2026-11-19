# Hosted acceptance — Auth, profiles, Vault and deadlines

Date: 2026-11-18
Project: `edpuovkgoisyzpguksdi` (Jetuu development project)
Runtime: production build (`npm run build`) served by `next start` on
`http://127.0.0.1:3200`, system Chrome through Playwright.
Accounts: two disposable users created with the Admin API using
`email_confirm: true`, then deleted from the project. No real student data was
used. Passwords and keys were read from an untracked `.env.local` and never
printed.

## Result

**26/26 hosted checks passed** in a single run.

| Check                                                    | Observed                               |
| -------------------------------------------------------- | -------------------------------------- |
| Anonymous private dashboard redirect                     | `/en/dashboard` → `/en/login`          |
| Hosted email + password sign-in                          | `/en/dashboard`                        |
| Session survives full reload                             | `/en/dashboard`                        |
| Wrong password rejected                                  | visible alert                          |
| Second account sign-in through the form                  | `/en/dashboard`                        |
| Sign-out                                                 | back to `/en/login`                    |
| Owner profile insert and version bump                    | 201 then 200                           |
| Immutable profile version history                        | contiguous `[1..N]`, first version `1` |
| Saved profile renders in onboarding after reload         | `country = Kazakhstan`                 |
| Personal calendar date created through the UI            | event visible                          |
| Personal date survives reload and appears in private API | same title                             |
| Notification preferences saved through the app API       | 200                                    |
| Preferences persist after reload                         | `Asia/Almaty`                          |
| Notification job dispatched by the hosted cron worker    | one in-app delivery                    |
| Inbox renders the delivered notification                 | same title                             |
| Mark read / archive                                      | both succeed                           |
| Authenticated ICS export                                 | 200, `BEGIN:VCALENDAR`, event present  |
| Vault upload                                             | document enters `quarantined`          |
| Vault document row persisted                             | `vault_documents` row present          |
| Cross-user file request by version id                    | 404                                    |
| Cross-user calendar isolation                            | 0 matching rows                        |
| Cross-user inbox isolation                               | 0 matching rows                        |

The hosted cron worker had already produced `notification_worker_runs` rows
before this run; the staged job was delivered by the real schedule, not by a
local call to the worker function.

## Defects found and fixed during acceptance

1. **Every same-origin deadline write returned 403.** `POST /api/deadlines`
   compared the `Origin` header with `new URL(request.url).host`. Under
   `next start --hostname 0.0.0.0` the request URL carries the bind address
   (`0.0.0.0:3200`), so a browser on `127.0.0.1:3200` never matched. The route
   now uses the shared `hasSameOrigin` helper, which compares against the
   `Host` header and honours `x-forwarded-proto` for TLS proxies. A regression
   test covers the bind-address case and a foreign origin.
2. **Notification preferences could not be saved.** The route used a PostgREST
   upsert, which requires table-level `UPDATE`; Phase 23 grants only
   column-level privileges, so the request failed with `42501`. The route now
   performs an owner `UPDATE` first and falls back to an owner `INSERT` only
   when the row is missing. Both paths have unit-level regression tests.

## Explicit limits

- No trusted malware scanner is configured. Uploads stay in quarantine and
  cannot be downloaded or attached; no document was released. Phase 19 remains
  short of its scanner/release gate.
- Email and push channels have no provider; only in-app delivery is proven.
  Phase 23 email acceptance remains open.
- No OAuth provider is enabled.
- No Vault backup/restore drill and no production deployment were performed.
- The reviewed public corpus still has no published degree programs or
  scholarships, so catalog-dependent phases are not advanced by this evidence.

## Reproduce

The checks were executed by a local Playwright/Node harness outside the
repository. It read `ENV_FILE`, created the two accounts through
`/auth/v1/admin/users`, drove the real forms at `http://127.0.0.1:3200`, and
wrote a sanitized result list. The same flow can be rerun after a fresh
`npm run build` with any `.env.local` that holds a real development project's
public URL, publishable key and `sb_secret_...` key.
