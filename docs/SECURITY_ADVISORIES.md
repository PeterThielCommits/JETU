# Security advisories and dependency exceptions

**Updated:** 2026-11-18

## Active exceptions

### GHSA-fc5q-39xc-vjpf — picomatch ReDoS (dev-only, no patch)

- **Package:** `picomatch` (transitive, development toolchain only)
- **Affected:** `<= 4.0.7`
- **Patched:** none published at review time
- **Chain:** `lint-staged`, `vitest`, `vite`, `tinyglobby`, `fdir`,
  `typescript-eslint`
- **Runtime exposure:** none. `npm audit --omit=dev --audit-level=high` reports
  **0 vulnerabilities**; the production dependency set does not include these
  packages.
- **Impact if exploited in dev:** event-loop denial of service when globbing
  attacker-controlled patterns. In this repository, glob patterns come from
  developer commands and test fixtures, not from untrusted runtime input.
- **Mitigation:** keep the toolchain pinned; do not accept user-supplied glob
  patterns in any script; upgrade as soon as an upstream patched version exists;
  re-run the audit at each release gate.
- **Review owner/date:** engineering, 2026-11-18; re-check before each release.

## Quality-gate policy

1. `npm audit --omit=dev --audit-level=high` **must be 0** for runtime
   dependencies. This is the blocking gate.
2. Full `npm audit` is reviewed at every release. A dev-only advisory with no
   published patch may be accepted only when:
   - it is listed in this file with chain, exposure and mitigation;
   - it cannot be reached by untrusted runtime input;
   - an upstream upgrade is tracked.
3. Any high/critical advisory in runtime dependencies blocks release with no
   exception.
4. When a patched version is published, upgrade immediately and remove the
   exception.

## History

| Date       | Advisory                            | Resolution                                       |
| ---------- | ----------------------------------- | ------------------------------------------------ |
| 2026-11-18 | GHSA-fc5q-39xc-vjpf picomatch ReDoS | Accepted dev-only, no patch; runtime audit clean |
