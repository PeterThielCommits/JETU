# GO-LIVE plan — Phase 30 production readiness

**Date:** 2026-11-18
**Status:** NOT LIVE. This plan defines the gates; it does not claim they are met.
Production deployment has not been authorized for this workspace.

## 1. Environments

| Environment                                   | Purpose                                         | Data                                   | Access              |
| --------------------------------------------- | ----------------------------------------------- | -------------------------------------- | ------------------- |
| Local                                         | Development, unit/integration/journey tests     | local-only, fixtures                   | developer           |
| Development (Supabase `edpuovkgoisyzpguksdi`) | Authorized schema work, SQL tests               | review/draft data, no published corpus | authorized operator |
| Preview                                       | Vercel branch deployment, anonymous smoke tests | preview env keys only                  | team                |
| Staging                                       | **Not provisioned**                             | —                                      | —                   |
| Production                                    | **Not provisioned/authorized**                  | —                                      | —                   |

Launch requires a real staging project separated from development before
production, per the master constraints.

## 2. Launch gates (P0)

### Engineering

- [x] `npm run check` green: format, lint, strict TS, 262 unit/integration, build.
- [x] `npm audit --audit-level=high` = 0.
- [x] 34/34 journey UI/a11y cases green (fixtures, 3 locales, 3 widths).
- [x] Production build succeeds on Next.js 16.4.6.
- [ ] Hosted two-account Auth/RLS acceptance (blocked: no
      `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SECRET_KEY` in this workspace).
- [ ] Clean CI migration replay at final commit (CI environment reachable? — remote
      job status must be confirmed).
- [ ] Generated DB types regenerated from the final hosted schema.
- [ ] E2E specs against a configured environment (12 specs; Auth-dependent skips).

### Data

- [ ] Reviewed, source-cited catalog corpus (currently zero published
      programs/scholarships in development).
- [ ] Editorial reviewer assigned and publication cycle exercised end-to-end.
- [ ] Freshness policy/worker enabled for deadlines.

### Security and privacy

- [ ] Cloud security advisors clean at release commit (previously clean, needs rerun).
- [ ] Restore drill executed and documented.
- [ ] Malware scanner vendor configured for vault uploads.
- [ ] Legal review of privacy/terms for target jurisdictions.

### Operations

- [ ] Staging provisioned and smoke-tested.
- [ ] Production deploy explicitly authorized.
- [ ] Domain/DNS/TLS ownership confirmed (`jetu.kz` not evidenced here).
- [ ] Monitoring/alerts and on-call owner assigned.
- [ ] Backup + object-storage backup policy verified.

## 3. Deploy procedure (when authorized)

1. Tag release commit; confirm CI green on the tag.
2. Apply migrations to staging first; run pgTAP + QA flows; snapshot.
3. Deploy preview build to staging; run smoke + two-account acceptance.
4. Apply the same migrations to production in a maintenance window; verify advisors.
5. Deploy Next build; verify `/api/health`, locale redirects, private-route
   redirects, and anonymous catalog reads.
6. Run post-deploy smoke script (health, auth redirect, representative pages).
7. Announce; monitor error rate and delivery metrics for 24h.

## 4. Rollback

- Application: redeploy previous Vercel build (immutable deployments).
- Database: migrations are additive; rollback requires a reviewed down-migration or
  PITR restore. **No destructive reset is permitted.**
- Feature flags: AI/mentor/billing remain hidden by default; reverting is a UI
  navigation change, not data surgery.
- Communication: incident owner posts status; data-integrity issues stop writes first.

## 5. Metrics to instrument at launch

Activation funnel (signup → onboarding → search/match → save → plan task),
retention (weekly active planning), delivery health (queued/sent/failed, dedupe
count), catalog trust (claims reviewed/published, stale sources), performance
(p95 catalog query, LCP), cost (DB/storage/AI when enabled). No vanity metrics.

## 6. Support and abuse

- Support inbox owner and response target must be named before launch.
- Abuse reporting for mentor/chat surfaces is required before Phase 22 launch.
- Student data requests follow the privacy page procedure; deletion is operator-run
  until automated.

## 7. Honest current position

The codebase is locally release-grade for the P0 loop. Launch is blocked by
external prerequisites: hosted keys/acceptance, reviewed corpus, staging,
scanner, restore drill and explicit production authorization. This document must
not be read as a production-ready certification.
