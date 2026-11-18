# YC-readiness evidence framework — Phase 30

**Date:** 2026-11-18
**Status:** framework only. No traction, revenue, partnership or outcome claims are
verified in this repository. Anything marked PITCH is from the July 2026 deck and
requires independent evidence before use in an application.

## 1. What can be shown today (with evidence links)

| Item                        | Evidence                                                                             | Honest framing                                          |
| --------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Working product surface     | Production build: 108 static pages generated; routes in `docs/STUDENT_EXPERIENCE.md` | Student loop code exists; hosted acceptance pending     |
| Explainable matching engine | `docs/AI_MATCHING_ARCHITECTURE.md`, unit + SQL tests                                 | Deterministic, not an admission probability             |
| Editorial integrity model   | `docs/CATALOG_EDITOR_QA.md`, migrations, SQL assertions                              | Console exists; real reviewed corpus absent             |
| Deadline engine             | `docs/DEADLINE_ENGINE.md`, journey tests                                             | In-app delivery proven locally; email/push unconfigured |
| Security posture            | `docs/THREAT_MODEL.md`, RLS matrix, npm audit 0                                      | Advisors/restore drill pending                          |
| Quality discipline          | `npm run check`, 262 unit/integration, 34 journey                                    | Local evidence; CI status must be confirmed             |
| Brand/design system         | `docs/design/PHASE_05_EVIDENCE.md`                                                   | VERIFIED visual system                                  |

## 2. What cannot be claimed yet

- Users, waitlist size, beta cohorts, retention, revenue, ARPU.
- Published verified program/scholarship counts (currently zero in development).
- Partnerships with schools, mentors, universities.
- Acceptance outcomes or scholarship wins.
- Market-size figures from the pitch (`$10B+`, `800k`, `$1.2M`) as validated data.
- Founder credentials as independently verified facts.

## 3. The wedge narrative (honest version)

> Central Asian students applying abroad face fragmented, often-scammy
> information and expensive consultants. JETU is being built as a verified-data
> admissions operating system: source-cited catalog, explainable eligibility,
> and a private workflow from shortlist to deadline and documents. The product
> deliberately does not sell admission probabilities or auto-submit applications.

## 4. Metrics to gather before an application

1. Number of students who complete onboarding and run matching.
2. Number of verified opportunities saved per active student.
3. Weekly active planning rate.
4. Catalog review throughput and source freshness.
5. Task completion and deadline adherence.
6. Outcome captures with provenance (offer/enrollment recorded by the student).

Instrumentation must be added to the app (events table/analytics provider) before
these numbers exist. Until then, report zero, not estimates.

## 5. Demo script (what actually runs today)

1. Landing in RU/KK/EN; language switch; responsive layout.
2. Search/explorer empty state and verified unavailable state (no fake corpus).
3. Sign in (requires configured env) → onboarding → profile version.
4. Match run with deterministic components and unknown-data handling.
5. Save, compare, roadmap generation, application tracker, vault upload quarantine.
6. Calendar/ICS and notification inbox fixtures.
7. Editorial console (reviewer membership) with audit trail.
8. Quality gate: run `npm run check` live if asked.

## 6. Risks to disclose

- No hosted user evidence yet; core loop needs two-account acceptance.
- Zero published corpus; data operations are the next critical path.
- No AI provider, billing, mentors or B2B in the current build.
- The team must not present roadmap items as shipped.

## 7. Readiness scorecard

| Dimension                 | Score | Basis                                             |
| ------------------------- | ----- | ------------------------------------------------- |
| Product completeness (P0) | 7/10  | Code present; hosted/corpus gates open            |
| Engineering quality       | 8/10  | All local gates green; CI/restore/advisor pending |
| Data trust                | 3/10  | Integrity model solid; real corpus absent         |
| Traction evidence         | 0/10  | None claimed or measured                          |
| Team/GTM evidence         | n/a   | Outside repository scope                          |

This framework is the truthful baseline; it should be updated only with measured
evidence, never with pitch numbers relabeled as traction.
