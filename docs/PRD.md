# JETU Product Requirements Document — Phase 02

**Date:** 2026-11-18
**Source of truth for status:** `docs/PHASE_TRACKER.md`
**Evidence baseline:** `docs/PITCH_TRACEABILITY.md`, `docs/ARCHITECTURE.md`,
`docs/STUDENT_EXPERIENCE.md`, `docs/PHASE_23_QA.md`

This PRD links every shipped screen to a user action, a value hypothesis and a
measurable signal. It deliberately excludes features that are not implemented or
cannot be marketed honestly.

## 1. Problem and ICP

**ICP:** a high-school student in Kazakhstan/Central Asia (grades 10–12, ages
15–18, often first-generation, budget-constrained) who wants funded university
study abroad and cannot afford a private admissions consultant. Secondary ICPs:
parent/guardian, verified mentor, school counselor, catalog editor.

**Core JTBD:** "When I want to study abroad with funding, help me find real,
verified opportunities I actually qualify for and keep every deadline and
document on track, so I don't miss a life-changing chance because of scattered
information or missed dates."

**Trust wedge:** verified, source-cited catalog data + explainable matching +
an end-to-end private workspace. Not "AI magic" and not admission-probability
guarantees.

## 2. Personas and primary jobs

| Persona                    | Primary jobs                                                    | Blockers today                             | Product answer                                             |
| -------------------------- | --------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| Budget-constrained student | Find full-funding programs; avoid scams; understand eligibility | Fragmented info, no deadlines, no guidance | Verified search, eligibility explainers, deadline calendar |
| Portfolio-strong student   | Match best-fit programs; compare options; build plan            | Doesn't know what is realistic; time lost  | Explainable matching, compare, roadmap                     |
| Parent/guardian            | Verify what child is doing; decide about costs                  | Opaque agencies, hidden fees               | Transparent product states, no invented costs              |
| Verified mentor (future)   | Review assigned work; track requests                            | Unclear scope/consent                      | Phase 22 scope (not live)                                  |
| School counselor (future)  | Support many students                                           | No shared workspace                        | Phase 26 scope (not live)                                  |
| Catalog editor             | Register sources, review claims, publish                        | Manual, error-prone data                   | Phase 11/28 catalog console                                |

## 3. Three working journeys

1. **Find Full Funding** — search verified programs/scholarships, filter by
   country/funding/level, read source citations, save and compare.
2. **Find Best-Fit Programs** — complete the academic profile, get explainable
   eligibility components and gaps, adjust preferences, recalculate.
3. **Manage Applications** — shortlist, generate roadmap tasks with dependencies,
   track application states with audit trail, upload documents privately, and
   follow deadlines through inbox/calendar.

Each journey maps to implemented routes: `/{locale}/search`,
`/{locale}/scholarships`, `/{locale}/universities`, `/{locale}/programs/{id}`,
`/{locale}/compare`, `/{locale}/match`, `/{locale}/plan`,
`/{locale}/applications`, `/{locale}/vault`, `/{locale}/calendar`,
`/{locale}/notifications`.

## 4. Scope split

### MVP launch (P0 — must be real before promoting)

- Localized public shell and SEO (RU/KK/EN).
- Auth with hosted acceptance (currently IMPLEMENTED, NOT VERIFIED).
- Academic/personal profile with versioned persistence.
- Verified catalog search + explorer with source citations.
- Scholarships explorer (code on branch; needs rebase + real data).
- Saved items/searches and 2–4 program compare.
- Deterministic explainable matching with private results.
- Personalized roadmap with dependencies and workload.
- Application tracker with state machine and audit.
- Private document vault and writing drafts.
- Deadline engine with calendar/ICS and durable inbox.
- Catalog review/publish console for editors.
- Admin-only routes hidden unless membership exists.

### V1 growth (P1 — after verified core loop)

- AI coach grounded in verified data (server-side gateway, citations).
- AI writing feedback with rubric and version history.
- Verified mentor network with scoped access.
- Outcome dashboards and post-offer checklist.
- Billing/entitlements only with a configured provider.
- Search quality (semantic retrieval) after measured need.

### V2 expansion (P2)

- B2B school/counselor multi-tenant workspace.
- Post-offer finance/visa/enrollment workflows.
- Native mobile apps and OAuth calendar sync.
- Partnerships/API distribution.

## 5. Prioritization and NOT DOING

**P0:** the list above.

**P1:** AI coach, writing studio, mentors, analytics.

**P2:** multi-tenant B2B, monetization automation, mobile apps.

**NOT DOING (until explicitly authorized and resourced):**

- invented or scraped data published as verified;
- admission-probability or "guaranteed admission" claims;
- auto-submitting applications to universities;
- mentor live access without identity verification and consent;
- billing with no licensed provider/refunds policy;
- public mentor contact details for minors;
- visa/legal advice beyond sourced informational checklists.

## 6. North Star and KPIs

**North Star Metric:** number of _verified completed application milestones_ per
active student per month (task completed with evidence, not chat messages).

Supporting KPIs (instrument after launch, never fabricate):

1. Eligible verified opportunities discovered per active student.
2. Profile activation rate (onboarding completed / signups).
3. Matched-to-shortlist conversion.
4. Shortlist-to-application conversion.
5. Weekly active planning (student opens plan and completes a task).
6. Verified outcome capture (offer/enrollment recorded with provenance).

## 7. Activation funnel and retention loop

```
Landing → Sign up → Onboarding (profile) → Search/Match
→ Save/Compare → Roadmap generated → Task completed
→ Application created → Deadline reminder opened → Return next week
```

Retention loop: fresh deadlines + roadmap tasks + source updates create a
legitimate reason to return. No dark patterns, no fake urgency.

## 8. Screen → action → hypothesis map (shipped surface)

| Screen                    | User action                 | Value hypothesis              | Signal                    |
| ------------------------- | --------------------------- | ----------------------------- | ------------------------- |
| `/{locale}` landing       | Understand product, sign up | Trust through honest scope    | CTA click → signup        |
| `/{locale}/search`        | Search/filter/sort          | Find real options fast        | Search → detail open      |
| `/{locale}/programs/[id]` | Read sourced facts          | Trust through provenance      | Save/compare action       |
| `/{locale}/compare`       | Compare 2–4 programs        | Better shortlist decisions    | Compare → save            |
| `/{locale}/match`         | Run matching                | Know eligibility/gaps         | Match run → save          |
| `/{locale}/plan`          | Complete tasks              | Plan removes missed deadlines | Task completion           |
| `/{locale}/applications`  | Track states                | One source of truth           | Status transitions        |
| `/{locale}/vault`         | Upload documents            | Private readiness             | Upload → application link |
| `/{locale}/calendar`      | Follow deadlines            | No missed dates               | ICS export, reminder open |
| `/{locale}/notifications` | Read inbox                  | Timely nudges                 | Read/archive              |
| `/{locale}/admin`         | Review/publish claims       | Trustworthy catalog           | Review decisions          |

## 9. Risks and mitigations

| Risk                 | Mitigation                                                        |
| -------------------- | ----------------------------------------------------------------- |
| Data trust           | Source claims, verification states, no publication without review |
| AI overclaim         | Deterministic eligibility; AI only drafts, never changes statuses |
| Minors' privacy      | Data minimization, private buckets, retention rules               |
| Scope bloat          | P0 list above; unimplemented routes stay hidden                   |
| Hosted/Auth blockers | Explicit PARTIAL labels; no fake acceptance                       |
| Cost blowout         | Deterministic engines; AI quotas when Phase 20 starts             |

## 10. Exit-test statement

Every P0 item has a route, a domain service, a persistence path, a test or an
explicit blocker recorded in `docs/PHASE_TRACKER.md`. Every P1/P2 item is labeled
and hidden from navigation until implemented. No screen exists only to inflate
scope.
