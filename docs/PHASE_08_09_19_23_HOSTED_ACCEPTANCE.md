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

## Follow-up reschedule probe — 2026-11-19

A second hosted probe passed **7/7** checks with one disposable account and the
real cron worker:

- a personal date created through the UI at `2026-12-02` produced only the
  non-past `T−7` and `T−1` reminder jobs; past `T−30`/`T−14` leads were not
  backfilled;
- two consecutive worker runs produced no duplicate `(revision, lead)` jobs and
  no receipts before the planned times;
- editing the date through the details dialog and edit form changed the
  revision (`b086b6cd…` → `064c90b2…`) and the stored date to `2026-12-09`;
- all queued jobs for the old revision became `canceled`;
- the next worker run created exactly three reminders for the new revision
  (`T−14`, `T−7`, `T−1`) with planned times shifted to the new date.

The temporary account was deleted afterwards. This covers personal-date
rescheduling; an official deadline source change still has SQL/worker coverage
but no hosted UI run.

## Follow-up RLS and role probe — 2026-11-19

A separate hosted probe with two disposable accounts passed **8/8** checks:

- owner profile insert (201) and version bump (200);
- second account reading the first account's profile returned 0 rows;
- second account reading the first account's version history returned 0 rows;
- second account PATCHing the first account's profile left version 2 and the
  original document untouched;
- a self-granted `catalog_editor_memberships` insert was denied (403);
- the non-member's own membership list was empty;
- the non-member's authenticated `GET /api/admin/catalog` returned 403.

Both temporary accounts were deleted. This closes the role-spoof and cross-user
profile-read parts of the Phase 08 exit test. The email-confirmation signup path
and OAuth (external) remain open.

## ClamAV worker acceptance — 2026-11-20

A local ClamAV worker was installed and exercised against the hosted development
project:

- ClamAV 1.5.5 installed with `winget`; `freshclam` downloaded database 28189
  dated 2026-11-20; the copied worker runtime resolves `clamscan` from PATH.
- A clean text essay uploaded through the Vault UI stayed quarantined until
  `node scripts/vault-worker.mjs` ran; it then became **available** with
  `scanner = ClamAV 1.5.5/28189/Fri Nov 20 11:29:13 2026`.
- The EICAR test string was blocked by the host's Windows Defender before
  ClamAV could open the temporary file (exit 2), so it could not exercise the
  infected path. A controlled ClamAV `.ndb` signature
  (`Win.Test.JetuAcceptance.UNOFFICIAL`) on a marker text file was used
  instead: the worker marked it **rejected** and recorded the same scanner
  string. The custom signature file was removed immediately after the test.
  The EICAR fixture remained quarantined and was deleted with the test user.
- Direct Storage isolation passed **5/5**: anonymous direct object read 400,
  cross-user direct read 400, cross-user signed-URL request 400, and
  cross-user `vault_versions`/`vault_documents` rows returned empty.
- The temporary user and all three uploaded objects were deleted.

The worker is a trusted private process using `SUPABASE_SECRET_KEY`; it needs a
host with fresh ClamAV definitions and no public inbound port. A Vault
backup/restore drill, production scanner hosting and the Phase 22 mentor-share
revocation path remain open.

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

- A local Windows ClamAV worker released a clean file and rejected a controlled
  test signature. EICAR was blocked by the host's Defender before ClamAV could
  read it, so the infected-path test used a temporary synthetic signature.
  Production scanner hosting and a Vault backup/restore drill remain open.
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
