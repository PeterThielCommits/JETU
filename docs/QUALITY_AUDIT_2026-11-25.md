# MVP quality and feature pass — 2026-11-25

Scope: cross-cutting defect audit and additive product work on the existing MVP.
No phase was promoted, no remote project was touched, and no hosted or
admissions result is claimed. Local and production-build evidence only.

## Verification

| Gate                        | Result                                                  |
| --------------------------- | ------------------------------------------------------- |
| `npm run check`             | PASS (format, lint, typecheck, tests, production build) |
| Unit + integration (Vitest) | 166 passed / 19 files                                   |
| Journey UI (Playwright)     | 34 passed                                               |
| Production browser E2E      | 84 passed, 4 skipped (hosted Auth cases)                |
| `npm audit`                 | 0 vulnerabilities (info/low/moderate/high/critical = 0) |
| Production build routes     | 92 generated; all application routes compiled           |

The four E2E skips are the pre-existing cases gated on a reachable hosted
Supabase Auth endpoint. They are not passes. Signed-in two-account acceptance
against a hosted project remains open and outside this local workspace.

## Defects corrected

1. **Dependency security.** `next` 16.4.2 → 16.4.6, `@next/env` → 16.4.6, and
   `typescript-eslint` 8.71.2 → 8.74.0. `npm audit` went from 8 moderate
   advisories to 0.
2. **Inbox cursor pagination.** PostgREST filters treated an unquoted `+00:00`
   timestamp offset as a space. Cursor timestamps are now quoted through
   `notificationCursorFilter`, so older-page requests no longer break for
   offsets other than UTC.
3. **Calendar export correctness.** All-day events now emit `DTEND;VALUE=DATE`
   (the day after `DTSTART`), instant events emit a one-hour `DTEND`, and
   `https` sources emit `URL`. Exported UIDs remain stable.
4. **Single-event export.** `/api/calendar/export` accepts a bounded `event_key`
   and returns `NOT_FOUND` instead of an empty or unrelated calendar.
5. **Catalogue date-only deadlines.** Date-only deadlines previously expired at
   noon UTC and could display on the wrong day. They now stay open for the whole
   calendar day and render with a UTC date-only formatter.
6. **Matching CSRF check.** Same-origin validation now compares the `Origin`
   host with the request `Host` header; the previous `request.url` comparison
   produced false 403s behind local/proxy host differences.
7. **Programme detail resilience.** A missing campus no longer renders
   `undefined, undefined`; only the available location is shown.
8. **Date-only formatting in search.** `YYYY-MM-DD` values no longer shift one
   day backwards in negative-offset time zones.
9. **Onboarding field errors.** Tile groups now expose `aria-invalid` and
   `aria-describedby`, and review links move focus to the owning step and field.
   An invalid/expired email link has its own localized message instead of the
   generic credentials error.
10. **Landing CTA state.** The primary CTA targets onboarding for a local signed-in
    session and signup otherwise, using a cookie-only session hint rather than a
    network authorization call.

## Additive features

- **Deadline radar** on the dashboard: the next three active dates with category
  dots, localized day count, and direct event dialog.
- **Personal dates statistic** replaces the old application-count placeholder.
- **Google Calendar and per-event ICS links** in the deadline dialog.
- **Deadline watch/unwatch** server action, usable from the calendar and from
  programme intakes; watch state is pre-read through owner-scoped RLS.
- **Richer programme detail**: duration, credits and credit system, all study
  languages and delivery formats, and per-intake tracking.
- **Save from detail pages** for programmes, scholarships and opportunities.
- **Saved page shortcuts**: open calendar and compare up to four saved
  programmes without retyping IDs.
- **Localized cost periods** in unified search and additional dates/tags facts.
- **Doctorate catalogue filter** and localized level label.

## Follow-up: account and search UX — 2026-11-25

Scope: local, deterministic usability work only. No password or email value
leaves the browser for scoring, and no security guarantee is implied by the
strength meter.

- **Signup/login guidance.** A local password strength meter (four levels plus
  length, mixed-case, symbol and common-password checks), a caps-lock warning,
  an email-domain typo suggestion with one-click apply, and per-field inline
  errors wired through `aria-invalid`/`aria-describedby`. Signup shows a
  three-step flow preview; login lists what the account unlocks and adds a
  help panel for caps lock, reset and email mistakes.
- **Search ordering.** The plain sort `<select>` is replaced by an icon toolbar
  that explains each order (relevance, closing soon, fresh sources, A–Z), a
  live "sorted by" summary, a result count, type-preset counts, and quick
  deadline chips for any/next 7/next 30 days. Result cards show urgency badges
  for today, tomorrow, the next 30 days and past deadlines.
- **Tests.** New unit coverage for `emailSuggestion` and `passwordStrength`;
  new browser coverage for the signup guidance and the sort toolbar on desktop
  and mobile.

## Honest limitations

- No hosted Supabase project was linked, migrated, reset, or deployed.
- No authenticated browser flow, notification delivery, or admissions decision
  was exercised; those remain unverified.
- The audit found and fixed the defects above, but it is not a proof of
  correctness for unavailable external integrations.
