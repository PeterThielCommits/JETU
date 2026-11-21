# Pitch traceability — Phase 01

**Date:** 2026-11-18
**Base:** `codex/mvp-closure-integration`
**Source:** `docs/pitch/jetu-mvp-pitch-july-2026.pdf` (8 slides, SHA-256
`4f04cd1d0a588814b28239907bf4defa18e653f098cbd2cc97a8dabe265b2ba3`), plus the
repository as built through Phase 23.

This document separates what the pitch claims, what the repository actually
implements, what is a hypothesis or proposal, and what cannot be asserted without
external evidence. It is the Phase 01 exit artifact: no claim below is invented,
and every "implemented" line points at code, a migration or a test that exists.

## Status vocabulary

- `PITCH_FACT` — stated in the source deck and kept as positioning.
- `PITCH_HYPOTHESIS` — a market/price/traction number from the deck without an
  independent source; never publish as verified.
- `NEW_PROPOSAL` — an engineering decision made in this repository that the deck
  did not specify.
- `NEEDS_VERIFICATION` — cannot be confirmed from this workspace (hosted runtime,
  external provider, or human review).

## Slide-by-slide evidence matrix

| Slide | Claim / UI in pitch                                                                       | Type             | Repository evidence                                                                                  | Status                            | Planned change / gate                                           |
| ----- | ----------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------- |
| 1     | `Jetu Admissions` brand, AI tools, July 2026                                              | PITCH_FACT       | Vector wordmark, favicon, tokens, localized shell; `docs/design/PHASE_05_EVIDENCE.md`                | VERIFIED visual system (Phase 05) | None; brand stays reference-only                                |
| 1     | `jetu.kz` working product                                                                 | PITCH_HYPOTHESIS | App runs on local/Vercel preview; domain/infra ownership not evidenced                               | NEEDS_VERIFICATION                | Production domain + deploy authorization                        |
| 2     | Consulting cost up to 2,000,000 ₸                                                         | PITCH_HYPOTHESIS | No independent source in repo                                                                        | NEEDS_VERIFICATION                | Do not publish without cited source                             |
| 2     | 170,000+ graduates / consultant shortage                                                  | PITCH_HYPOTHESIS | No source/year/geography in deck                                                                     | NEEDS_VERIFICATION                | Source before any marketing use                                 |
| 3     | Website prototypes: profile → matching                                                    | PITCH_FACT       | `/onboarding`, `/dashboard`, `/match`, `/api/matching/run`; owner RLS; deterministic engine          | IMPLEMENTED (Phase 16 PARTIAL)    | Hosted two-user acceptance                                      |
| 3     | AI coach as a working product                                                             | NEW_PROPOSAL     | Not implemented; no AI provider configured                                                           | BACKLOG (Phase 20)                | Server-side gateway, provider config, prompt-safety tests       |
| 3     | Matching scores shown as UI numbers                                                       | NEW_PROPOSAL     | UI uses explainable fit components, not admission probability; reason codes in engine                | IMPLEMENTED (Phase 16 PARTIAL)    | Keep "not an admission probability" copy                        |
| 4     | Competitive matrix: affordability, reliability, kk/ru, AI 24/7, live mentor, full journey | PITCH_HYPOTHESIS | Current app: kk/ru/en shell and catalog exist; AI coach, mentors, billing, full journey are not live | PARTIAL / BACKLOG                 | Do not market unavailable rows; per-feature status in this repo |
| 5     | TAM $10B+, SAM ~800k graduates, SOM $1.2M                                                 | PITCH_HYPOTHESIS | No sources or measured traction                                                                      | NEEDS_VERIFICATION                | Treat as pitch math only; no public claims                      |
| 6     | Pricing tiers 2,990 ₸ / 14,990 ₸                                                          | PITCH_HYPOTHESIS | No billing provider, no entitlements table, no checkout                                              | BACKLOG (Phase 27)                | Plan config + waitlist/disabled state only                      |
| 7     | Traction roadmap (100–200 beta, 25k users)                                                | PITCH_HYPOTHESIS | No analytics or user counts in repo; no evidence of achievement                                      | NEEDS_VERIFICATION                | Measure only from real telemetry after launch                   |
| 8     | Founder biographies, email, Telegram                                                      | PITCH_HYPOTHESIS | Supplied by user; not independently verified; no outreach authorized                                 | NEEDS_VERIFICATION                | Do not republish or contact                                     |

## What actually exists in the repository

### Application and domains

- Next.js 16.4.6 App Router, TypeScript strict, Tailwind 4, React 19, Motion.
- Public localized routes (RU/KK/EN) for marketing pages, catalog, universities,
  programs, scholarships, opportunities, search, compare.
- Private workspace: onboarding/profile, dashboard, matching, saved lists,
  calendar/notifications, roadmap, applications, vault, writing, settings,
  catalog editor (role-gated).
- API routes: health, search suggest, catalog universities, matching, deadlines,
  recommendations, roadmaps, applications + checklist + transitions, vault
  upload/file/export, writing, calendar export, admin catalog, admin scholarships
  (branch code).
- 45 SQL migrations, 56 `enable row level security` statements and 119 policies
  in the migration set at this commit.

### Test inventory at this commit

| Suite                             | Files                    | Evidence                                                                  |
| --------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| Unit — `tests/unit`               | 20                       | Vitest, part of the 262-test local run                                    |
| Integration — `tests/integration` | 8                        | Vitest, mocked transport / server contracts                               |
| Journey UI/a11y                   | 2                        | Playwright Chromium 390/820/1440, RU/KK/EN, axe, keyboard, reduced motion |
| E2E specs (need live env)         | 12                       | Playwright, several skipped without Auth/Supabase configuration           |
| SQL/pgTAP                         | CI + cloud transactional | Migration replay, RLS assertions, rollback benchmark                      |

`npm run check` at this commit: format, ESLint, strict TypeScript, 262
unit/integration tests and production build pass. `npm audit` reports zero
vulnerabilities. 34/34 journey UI/a11y cases pass against fixture servers.

### Security and secrets audit (no secret values reproduced)

- `.env.example` documents `NEXT_PUBLIC_APP_URL`, `JETU_PUBLIC_INDEXING`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SECRET_KEY`, `JETU_ENV`; no real keys committed.
- Zod public/server env validation; server secret isolated behind `server-only`.
- No public Storage bucket in migrations; profile evidence bucket is private with
  owner paths and MIME/size checks.
- RLS is enabled with explicit grants; `service_role` is never used in browser
  paths; admin operations go through server route handlers.
- `npm audit --audit-level=high`: 0 vulnerabilities (Next.js 16.4.6,
  typescript-eslint 8.73.0, ESLint 10.15.0).
- Dependency risk remaining: none high/critical; Supabase CLI and Playwright are
  dev-only. No Firebase/legacy SDK references in the app.

### P0 security list (tracked elsewhere, summarized)

1. Hosted two-account Auth/RLS acceptance — blocked on missing `NEXT_PUBLIC_SUPABASE_*`.
2. Reviewed catalog corpus — development project has zero published
   programs/scholarships.
3. Document vault scanner/backup — hook exists, external scanner not configured.
4. Production deployment/domain/backups — not authorized.

## Design deltas versus the pitch

Phase 05 reconciled tokens, logo, contrast and motion; see
`docs/design/PHASE_05_EVIDENCE.md` and `docs/DESIGN_SYSTEM.md`. Remaining deltas:
pitch slide 3 presents score-heavy matching cards; the app intentionally presents
explainable components and explicitly avoids admission-probability claims.

## Exit-test statement

It is now possible to show, with file-level evidence:

- what exists in code and tests (sections above);
- what exists only in the pitch (market numbers, traction, founders, pricing);
- where sources are missing (`NEEDS_VERIFICATION` rows);
- what is a deliberate new proposal (AI coach scope, not-yet-built billing).

No statement in this document asserts hosted functionality that has not been
verified in this workspace.
