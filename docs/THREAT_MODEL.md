# Phase 29 — Security, QA, privacy and resilience review

**Date:** 2026-11-18
**Scope:** the application and SQL at `codex/mvp-closure-integration`
**Evidence type:** source/migration review + local automated suites. No live
hosted security-advisor run is possible from this workspace (managed proxy CONNECT
403); prior cloud-advisor results are cited only where recorded in the repo.

## 1. Assets

| Asset                                         | Location                              | Sensitivity        |
| --------------------------------------------- | ------------------------------------- | ------------------ |
| Student identity and session                  | Supabase Auth cookies                 | High               |
| Academic/personal profile and versions        | `student_profiles*`                   | High (minors)      |
| Application portfolio, notes, decisions       | `applications*`, events               | High               |
| Uploaded documents                            | private Storage bucket + vault tables | High               |
| Writing drafts                                | writing tables                        | High               |
| Saved lists, searches, matching runs, roadmap | owner-scoped tables                   | Medium             |
| Editorial source claims and review history    | catalog/admin tables                  | Medium (integrity) |
| Service secret                                | server env only                       | Critical           |

## 2. Actors and trust boundaries

- Anonymous visitor — may read only published, verified, source-backed catalog rows.
- Authenticated student — may read/write only rows owned by `auth.uid()`.
- Editor/reviewer/admin — authorized by database membership rows, not claims.
- Background worker (`pg_cron`) — acts inside the database with restricted grants.
- Attacker models: credential stuffing, IDOR/path guessing, malicious upload,
  prompt injection via ingested content (future AI), scraping, privilege escalation
  through editable metadata.

Trust boundaries: browser ↔ Next server (untrusted input, Zod validation),
Next server ↔ PostgREST (request JWT or server-only secret), Storage ↔ client
(short-lived signed URLs only), cron ↔ tables (definer functions with fixed grants).

## 3. Threat register and mitigations

| ID  | Threat                                              | Mitigation in repo                                                                                                                  | Residual risk                                                       |
| --- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| T1  | Reading another student's profile/applications      | Owner RLS on every private table; four-policy model; tests in SQL/pgTAP and unit fixtures                                           | Live two-account proof pending env keys                             |
| T2  | Guessing a Storage object path                      | Private bucket, owner-prefixed paths, server-generated signed URLs, MIME/size/signature validation                                  | External malware scanner not configured; quarantine state is honest |
| T3  | Privilege escalation via metadata                   | Authorization from `catalog_editor_memberships` joined to `auth.uid()`; membership cannot be self-granted; audit events append-only | Admin UI role-management not built (Phase 28 remainder)             |
| T4  | Publishing unverified data                          | Publication requires resolved claims + verified active source + published parents; revision/hash preconditions                      | Human reviewer process needs real editors                           |
| T5  | SQL injection / unbounded reads                     | Parameterized RPCs with allowlisted JSON, bounded pages, SECURITY INVOKER search, no service key in browser                         | None known                                                          |
| T6  | Session fixation / stale claims                     | `@supabase/ssr` cookie handling, claims refresh in middleware, server-side identity checks                                          | Hosted cookie-domain behavior unverified                            |
| T7  | Malicious upload (active content)                   | Allowlist PDF/PNG/JPG/text, 3 MB cap, signature check, quarantine until scan                                                        | Scanner integration is a hook, not a vendor                         |
| T8  | Duplicate or missed deadline notifications          | Unique dedupe key `user+event+scheduled_time+channel`, DB-driven worker, timezone-aware                                             | Email/push channels unavailable; in-app only                        |
| T9  | Prompt injection via sources (future AI)            | AI not implemented; design documents require treating scraped text as data, citations, refusal to invent                            | Phase 20 must implement and test                                    |
| T10 | Secret leakage to client                            | `server-only` guard, no `NEXT_PUBLIC_` secret, bundle canary test in CI                                                             | None known                                                          |
| T11 | Destructive remote operation                        | `scripts/db.mjs` allowlists local-only commands; no remote reset path                                                               | Operator error remains possible via CLI outside scripts             |
| T12 | Cross-tenant access (future B2B)                    | Not implemented; no tenant tables exposed yet                                                                                       | Phase 26 must design from scratch                                   |
| T13 | Dev-toolchain ReDoS (picomatch GHSA-fc5q-39xc-vjpf) | Dev-only chain (lint-staged/vitest/vite/typescript-eslint); runtime audit 0; documented in `SECURITY_ADVISORIES.md`                 | No upstream patch yet; upgrade when released                        |

## 4. Privacy and data lifecycle

- Data minimization: vault collects only purposeful document classes; profile
  answers are user-editable and exportable as JSON at the review step.
- Deletion: `student_account_deletions` records a guard row; the privacy page
  documents request-based access/correction/deletion. A fully automated hard-delete
  job is **not** implemented; deletion is an operator-run procedure.
- Retention: policy text states data is kept while needed for features and until a
  verified deletion request; version history is retained for conflict resolution.
- Minors: age declaration at signup; no public exposure of student files; mentor
  features (future) require scoped consent and safeguarding design.

## 5. Performance and cost evidence

- Phase 15 rollback benchmark (`supabase/benchmarks/phase15_benchmark.sql`):
  10k synthetic rows, browse query measured **327.675 ms** (from 21,834 ms before
  index repair); representative filtered query **698.999 ms**. Rollback leaves no
  rows.
- Search uses bounded pagination and allowlisted filters; no unbounded `select *`
  on catalog surfaces.
- Cost posture: one Next deployment + one managed Postgres; deterministic matching
  (no per-request model spend); AI/billing not configured, so no hidden spend.

## 6. Resilience and recovery

| Control                | State                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| Clean migration replay | CI job twice per run (historical evidence), SQL transactional tests                         |
| Rollback assertions    | pgTAP suites + benchmark rollback                                                           |
| Backup                 | Managed Supabase backups; **restore drill not performed in this workspace**                 |
| Object backup          | Not configured/documented beyond managed storage; vault docs note DB backup ≠ object backup |
| Incident logging       | Sanitized request IDs; no PII in logs; no external error reporter configured                |
| Rate limiting          | Matching API 30s/20-per-day per user; auth relies on Supabase limits                        |

**Honest gaps:** no live restore drill, no formal load test beyond the 10k SQL
benchmark, no penetration test, no hosted advisor run at this commit.

## 7. Exit-test statement

Every high-sensitivity table and bucket has an enforced authorization model in
migrations; browser paths never use the secret key; uploads are quarantined until a
trusted scan; publication is gated by reviewed evidence. The remaining security
work is verification and operations (hosted two-account proof, advisor run, restore
drill, scanner vendor), not missing policy code. Phase 29 is therefore **PARTIAL**
with a concrete, truthful punch list.
