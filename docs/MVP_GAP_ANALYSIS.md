# MVP Gap Analysis — 17 phases remaining for P0 closure

**Generated:** 2026-11-17
**Updated:** 2026-11-18 — audit/planning phases delivered
**Integration base:** `codex/mvp-closure-integration` (commit `85178ad` + docs)
**Status:** `npm run check` passes (format, lint, typecheck, 262 tests, build, audit=0 vulnerabilities)
**Note:** All evidence below is local — real hosted authenticated acceptance, reviewed catalog corpus, and production deployment remain open requirements.

## 2026-11-18 update — phases closed as analysis deliverables

The following phases now have complete, repository-grounded artifacts and are no
longer pure backlog:

| Phase | Deliverable                               | New status                      |
| ----- | ----------------------------------------- | ------------------------------- |
| 01    | `docs/PITCH_TRACEABILITY.md`              | IMPLEMENTED_AND_TESTED          |
| 02    | `docs/PRD.md`                             | IMPLEMENTED_AND_TESTED          |
| 03    | `docs/PHASE_03_ARCHITECTURE.md`           | IMPLEMENTED_AND_TESTED          |
| 07    | `docs/IA_MOBILE_A11Y_AUDIT.md`            | IMPLEMENTED (NOT VERIFIED)      |
| 29    | `docs/THREAT_MODEL.md`                    | PARTIAL (verification/ops open) |
| 30    | `docs/GO_LIVE.md`, `docs/YC_READINESS.md` | PARTIAL (staging/deploy open)   |

Remaining phase count for full MVP P0 is therefore reduced, but **no blocked phase
was promoted to VERIFIED**: scanner release, Vault restore drill, deadline-change
reschedule UI, email delivery, real reviewed corpus and production authorization
still gate 04/06/10/12/15/16/19/23.

## Closed / Integrated (code present, local evidence sufficient for PARTIAL)

These 8 phases have implementation code merged onto the Phase 23 line. Local checks pass; the gate to VERIFIED is real hosted acceptance or reviewed corpus.

| Phase | Title               | Status                 | Gap to VERIFIED                                                                                              |
| ----- | ------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| 04    | Foundation          | PARTIAL                | Hosted Auth/REST/Storage proofs pass; full local Supabase stack blocked by no Docker                         |
| 06    | Landing/SEO         | PARTIAL                | Pricing/mentors/corpus real-data gates; no deployed pricing API                                              |
| 08    | Auth/RLS            | IMPLEMENTED_AND_TESTED | Hosted two-account Auth + isolation passed; role-membership denial passed; email-confirmation and OAuth open |
| 09    | Profile             | IMPLEMENTED_AND_TESTED | Hosted save/version/reload passed; delete and eligibility-impact display open                                |
| 10    | Canonical DB        | UNVERIFIED             | Phase gate acceptance not rechecked with live cloud SQL                                                      |
| 12    | Program Explorer    | PARTIAL                | Real reviewed corpus; hosted REST works; no live-data E2E                                                    |
| 15    | Search/save/compare | PARTIAL                | Live reviewed corpus/deploy gates; 10k benchmark local only                                                  |
| 16    | Matching            | PARTIAL                | Zero live program/scholarship rows; hosted Auth/REST passes                                                  |

These 5 phases have code on branches/PRs that were merged/rebased into the integration branch. The code is present but requires confirmation that the merged version functions correctly.

| Phase | Title            | Status                     | Gap to VERIFIED                                                                                                                              |
| ----- | ---------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 13    | Scholarships     | BACKLOG (code rebased)     | UI/editor/API rebased onto `main`; real scholarship data and acceptance required                                                             |
| 17    | Roadmap          | IMPLEMENTED (NOT VERIFIED) | Roadmap engine integrated; hosted two-user/data acceptance open (see PHASE_17_QA.md)                                                         |
| 18    | Application CRM  | IMPLEMENTED (NOT VERIFIED) | Application portfolio, state machines, checklist integrated; hosted acceptance open                                                          |
| 19    | Document Vault   | IMPLEMENTED_AND_TESTED     | Hosted upload→quarantine + cross-user 404 passed; scanner release, backup/restore and mentor sharing open                                    |
| 28    | Admin publishing | PARTIAL                    | Catalog review/publish console with reviewer roles and audit integrated; editing, role management, support/abuse and broader ops remain open |

These 4 phases require new development, separate audits, or infrastructure that is not yet present in the codebase (statuses updated 2026-11-18 where noted).

| Phase | Title                  | Status                     | Gap to VERIFIED                                                                                                                          |
| ----- | ---------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 07    | IA/mobile/a11y         | IMPLEMENTED (NOT VERIFIED) | Audit delivered in `IA_MOBILE_A11Y_AUDIT.md`; physical-device and hosted-auth a11y passes open                                           |
| 11    | Ingestion/verification | PARTIAL                    | Full editorial pipeline (provenance, reviewer roles, source claims, publish console) — no automated fetch/parser/scheduler or full queue |
| 29    | Security/QA            | PARTIAL                    | Threat model delivered; hosted advisors, restore drill, scanner vendor and load test open                                                |
| 30    | Production readiness   | PARTIAL                    | Go-live/YC plans delivered; staging, corpus, hosted keys and deploy authorization open                                                   |

## Summary

- **8 phases** — code integrated, local gates pass, VERIFIED pending reviewed corpus/scanner/restore
- **5 phases** — code merged from branches/PRs, requires merge rebase confirmation + acceptance
- **4 phases** — audit/planning deliverables now written (01, 02, 03, 07); 29/30 have plans but verification open; 11 remains the largest code gap
- **Phase 23** — hosted two-account acceptance and personal-date reschedule passed (26/26 + 7/7); remaining gates are official source-change hosted replay and the email channel
- **Phase 05** — VERIFIED (independent UI/visual evidence exists)
- **Phases 04/06** — foundation/landing; PARTIAL with cloud REST/Supabase access blocked in workspace

## Immediate Next Steps (in order)

1. **Phase 23/19 residual gates** — configure trusted malware scanner (Vault release), run restore drill, add deadline-change reschedule UI acceptance, configure Resend email; then re-run hosted acceptance
2. **Phase 11 editorial pipeline** — Stage source claims, implement reviewer roles, complete catalog review/publish console operations; re-run `npm run check`; update tracker
3. **Phase 13 scholarships rebase** — Rebase PR #1 onto current `main`; add real scholarship data; test acceptance
4. **Phase 28 operations support** — Extend catalog editor console with role management, abuse support, and broader ops workflows; see `CATALOG_EDITOR_QA.md`
5. **Document and track** — After each acceptance, update `docs/PHASE_TRACKER.md` labels and `docs/MVP_GAP_ANALYSIS.md` gaps; promote phases from PARTIAL/IMPLEMENTED (NOT VERIFIED) to VERIFIED only with real hosted evidence. Hosted 2026-11-18 evidence is in `PHASE_08_09_19_23_HOSTED_ACCEPTANCE.md`.

## Infrastructure blockers

- **No Supabase Docker/local** — Windows registry 403 blocks `supabase/*` image pull; CI PostgreSQL also blocked
- **No real Supabase hosted auth** — `.env.local` missing `NEXT_PUBLIC_SUPABASE_*` keys; without these all Auth/REST checks fail CONNECT 403
- **No published corpus** — Development database `edpuovkgoisyzpguksdi` has zero published programs/scholarships; Phase 12/13/15 corpus gates remain open
- **CI cannot reach Supabase** — Managed proxy CONNECT 403 blocks remote REST/SDK round trips from this workspace
