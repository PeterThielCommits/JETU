# Phase 07 — IA, mobile, localization and accessibility audit

**Date:** 2026-11-18
**Scope:** the shipped application at `codex/mvp-closure-integration`
**Method:** route inventory from a production build, source inspection of layouts
and navigation, dictionary parity inspection, and the automated journey suite
(Chromium at 390/820/1440 in RU/KK/EN with axe, keyboard and reduced-motion
assertions).

## 1. Route and IA inventory

### Public (marketing group)

`/{locale}` landing, `/{locale}/search`, `/{locale}/universities`,
`/{locale}/universities/{slug}`, `/{locale}/programs/{id}`,
`/{locale}/scholarships/{slug}`, `/{locale}/opportunities/{slug}`,
`/{locale}/compare`, and localized info pages through `/{locale}/{slug}`
(about, how-it-works, pricing, for-schools, mentors, faq, contact, privacy,
terms) plus `/{locale}/design-system`.

Navigation model: one header with wordmark, primary nav (search + info links),
account actions (sign in / sign up) and a language switcher; one footer nav.
Skip link targets `#main` and every inspected page renders a single
`<main id="main" tabIndex={-1}>` landmark.

### Auth group

`/{locale}/login`, `/{locale}/signup`, `/{locale}/forgot-password`,
`/{locale}/reset-password`, `/auth/callback`, `/auth/confirm`.

### Workspace group (authenticated)

`/{locale}/dashboard`, `/onboarding`, `/match`, `/saved`, `/calendar`,
`/notifications`, `/notification-settings`, `/plan`, `/applications`,
`/applications/{id}`, `/vault`, `/writing`, and role-gated `/{locale}/admin`.

Navigation model: `WorkspaceNav` renders labelled links with `aria-current="page"`,
a live unread counter for the inbox, and the admin entry only when a database
membership row exists. The layout ships the same skip link pattern as marketing.

## 2. Findings

### Strengths verified in this pass

| Area                     | Evidence                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Landmarks and skip links | `skip-link` + `#main` in marketing and dashboard layouts; feature views render one `<main>`                           |
| Language attribute       | Root layout sets `<html lang={locale}>` from the resolved locale                                                      |
| Localization parity      | Typed dictionaries for RU/KK/EN (`satisfies Record<Locale, …>`); no locale fallback strings in navigation             |
| Navigation semantics     | `nav aria-label` in marketing, footer, language switcher and workspace; `aria-current` on active workspace link       |
| Icon semantics           | Decorative SVG icons are `aria-hidden`; text labels accompany every nav icon                                          |
| Keyboard                 | Journey suite opens dialogs, presses Escape, and navigates with keyboard; passes                                      |
| Reduced motion           | Journey suite emulates `prefers-reduced-motion: reduce`; CSS has 4 reduce blocks and motion is transform/opacity only |
| Forced colors            | `@media (forced-colors: active)` block present                                                                        |
| Axe                      | Journey suite runs axe on calendar and profile flows in 3 locales × 3 widths; zero violations                         |
| Responsive               | Breakpoints at 380/600/640/700/768/900/960/1024/1100 px; journey suite covers 390/820/1440                            |
| Touch targets            | Primary buttons and nav rows use 44 px minimum height in the workspace styles                                         |

### Gaps and residual risks (honest)

1. **No physical-device pass in this workspace.** Evidence is Chromium emulation;
   iOS Safari/VoiceOver and Android TalkBack remain unverified.
2. **Hosted authenticated accessibility not re-run.** The journey suite uses
   fixture servers for calendar/profile; authenticated `/{locale}/admin`,
   `/applications`, `/vault` and `/writing` axe runs need the hosted test accounts.
3. **Long-text stress is partial.** RU/KK dictionary lengths are covered by tests,
   but 200% text zoom on every workspace screen is not automated.
4. **Marketing mobile nav is horizontally scrollable** with a decorative gradient
   arrow. It is keyboard reachable; a visible scroll affordance for touch-only
   users could be clearer.
5. **Focus return after route transitions** is handled by Next defaults plus
   `tabIndex={-1}` main targets; no custom focus-restoration test exists for every
   modal flow.

None of these gaps breaks the P0 loop; items 1–2 are hosted-acceptance items, and
items 3–5 are scheduled as incremental polish, not blockers.

## 3. Actions taken in this pass

- Verified every marketing route renders a `#main` target (landing and info pages
  inspected; catalog/search/compare render feature views that include it).
- Confirmed the workspace nav type supports the vault/settings icons added during
  the integration and remains labelled.

No code change was required for the audited P0 surface; findings are recorded so
they are not rediscovered as surprises.

## 4. Exit-test statement

The application exposes a coherent three-level IA (public → auth → workspace),
RU/KK/EN parity for shipped surfaces, responsive layouts at phone/tablet/desktop
widths, keyboard and axe evidence for the highest-traffic flows, and explicit
residual limits. Phase 07 is **implemented and locally tested**; the remaining
work is hosted/device acceptance and incremental polish listed above.
