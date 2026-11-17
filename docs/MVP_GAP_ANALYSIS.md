# MVP Gap Analysis — 17 phases remaining for P0 closure

**Generated:** 2026-11-17
**Integration base:** `codex/mvp-closure-integration` (commit `85178ad`)
**Status:** `npm run check` passes (format, lint, typecheck, 262 tests, build, audit=0 vulnerabilities)
**Note:** All evidence below is local — real hosted authenticated acceptance, reviewed catalog corpus, and production deployment remain open requirements.

## Closed / Integrated (code present, local evidence sufficient for PARTIAL)

These 8 phases have implementation code merged onto the Phase 23 line. Local checks pass; the gate to VERIFIED is real hosted acceptance or reviewed corpus.

| Phase | Title               | Status                     | Gap to VERIFIED                                                        |
| ----- | ------------------- | -------------------------- | ---------------------------------------------------------------------- |
| 04    | Foundation          | PARTIAL                    | Full local Supabase-steck, cloud REST proofs; no Docker in workspace   |
| 06    | Landing/SEO         | PARTIAL                    | Pricing/mentors/corpus real-data gates; no deployed pricing API        |
| 08    | Auth/RLS            | IMPLEMENTED (NOT VERIFIED) | Hosted two-account acceptance: `NEXT_PUBLIC_SUPABASE_*` keys required  |
| 09    | Profile             | IMPLEMENTED (NOT VERIFIED) | Hosted acceptance of save/reload; no cross-device persistence proof    |
| 10    | Canonical DB        | UNVERIFIED                 | Phase gate acceptance not rechecked with live cloud SQL                |
| 12    | Program Explorer    | PARTIAL                    | Real reviewed corpus; REST proxy 403; no end-to-end E2E from workspace |
| 15    | Search/save/compare | PARTIAL                    | Live corpus/REST/deploy gates; 10k benchmark passed locally only       |
| 16    | Matching            | PARTIAL                    | Zero live program/scholarship rows; no hosted Auth/REST E2E            |

These 5 phases have code on branches/PRs that were merged/rebased into the integration branch. The code is present but requires confirmation that the merged version functions correctly.

| Phase | Title            | Status                     | Gap to VERIFIED                                                                                                                              |
| ----- | ---------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 13    | Scholarships     | BACKLOG (code rebased)     | UI/editor/API rebased onto `main`; real scholarship data and acceptance required                                                             |
| 17    | Roadmap          | IMPLEMENTED (NOT VERIFIED) | Roadmap engine integrated; hosted two-user/data acceptance open (see PHASE_17_QA.md)                                                         |
| 18    | Application CRM  | IMPLEMENTED (NOT VERIFIED) | Application portfolio, state machines, checklist integrated; hosted acceptance open                                                          |
| 19    | Document Vault   | IMPLEMENTED (NOT VERIFIED) | Private Vault/Writing, immutable versions, archive, scanner/backup integrated; acceptance open                                               |
| 28    | Admin publishing | PARTIAL                    | Catalog review/publish console with reviewer roles and audit integrated; editing, role management, support/abuse and broader ops remain open |

These 4 phases require new development, separate audits, or infrastructure that is not yet present in the codebase.

| Phase | Title                  | Status  | Gap to VERIFIED                                                                                                                          |
| ----- | ---------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 07    | IA/mobile/a11y         | BACKLOG | Separate IA/mobile/a11y audit and fixes required                                                                                         |
| 11    | Ingestion/verification | PARTIAL | Full editorial pipeline (provenance, reviewer roles, source claims, publish console) — no automated fetch/parser/scheduler or full queue |
| 29    | Security/QA            | BACKLOG | Full threat model, load/perf, privacy/delete, restore drill required                                                                     |
| 30    | Production readiness   | BACKLOG | Production live/CI/Vercel launch plan, metrics, staging separation, YC-evidence                                                          |

## Summary

- **8 phases** — code integrated, local gates pass, VERIFIED pending hosted acceptance/corpus
- **5 phases** — code merged from branches/PRs, requires merge rebase confirmation + acceptance
- **4 phases** — new development or separate audit required (07, 11, 29, 30)
- **1 phase** (Phase 23) — integration completed locally; hosted two-account acceptance is the single remaining gate (requires `NEXT_PUBLIC_SUPABASE_*` env keys)
- **Phase 05** — VERIFIED (independent UI/visual evidence exists)
- **Phases 01–04/06** — foundation/landing; PARTIAL with cloud REST/Supabase access blocked in workspace

## Immediate Next Steps (in order)

1. **Phase 23 acceptance** — User supplies `C:\Users\Admin\Projects\JETU\.env.local` with valid `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` → create 2 temp accounts, test login→edit dates→reload→settings→read/archive→ICS→cross-user isolation→delete via admin API → update `PHASE_23_QA.md` and open PR #13
2. **Phase 11 editorial pipeline** — Stage source claims, implement reviewer roles, complete catalog review/publish console operations; re-run `npm run check`; update tracker
3. **Phase 13 scholarships rebase** — Rebase PR #1 onto current `main`; add real scholarship data; test acceptance
4. **Phase 28 operations support** — Extend catalog editor console with role management, abuse support, and broader ops workflows; see `CATALOG_EDITOR_QA.md`
5. **Document and track** — After each acceptance, update `docs/PHASE_TRACKER.md` labels and `docs/MVP_GAP_ANALYSIS.md` gaps; promote phases from PARTIAL/IMPLEMENTED (NOT VERIFIED) to VERIFIED only with real hosted evidence

## Infrastructure blockers

- **No Supabase Docker/local** — Windows registry 403 blocks `supabase/*` image pull; CI PostgreSQL also blocked
- **No real Supabase hosted auth** — `.env.local` missing `NEXT_PUBLIC_SUPABASE_*` keys; without these all Auth/REST checks fail CONNECT 403
- **No published corpus** — Development database `edpuovkgoisyzpguksdi` has zero published programs/scholarships; Phase 12/13/15 corpus gates remain open
- **CI cannot reach Supabase** — Managed proxy CONNECT 403 blocks remote REST/SDK round trips from this workspace
