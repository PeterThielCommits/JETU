import { expect, it, vi } from 'vitest';
import { isIndexableSite } from '../../src/lib/marketing/seo';
import robots from '../../src/app/robots';

it('requires explicit indexing enablement on a nonlocal origin', () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://preview.jetu.example');
  vi.stubEnv('JETU_PUBLIC_INDEXING', 'false');
  expect(isIndexableSite()).toBe(false);

  vi.stubEnv('JETU_PUBLIC_INDEXING', 'true');
  expect(isIndexableSite()).toBe(true);

  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
  expect(isIndexableSite()).toBe(false);
});

it('keeps every private and account route out of the index', () => {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://preview.jetu.example');
  vi.stubEnv('JETU_PUBLIC_INDEXING', 'true');
  const rules = robots().rules;
  const first = Array.isArray(rules) ? rules[0] : rules;
  const disallow = first && 'disallow' in first ? first.disallow : [];
  for (const route of [
    '/*/design-system',
    '/*/login',
    '/*/signup',
    '/*/forgot-password',
    '/*/reset-password',
    '/*/dashboard',
    '/*/onboarding',
    '/*/saved',
    '/*/match',
    '/*/compare',
  ])
    expect(disallow, route).toContain(route);

  vi.stubEnv('JETU_PUBLIC_INDEXING', 'false');
  const closedRules = robots().rules;
  const closed = Array.isArray(closedRules) ? closedRules[0] : closedRules;
  expect(closed && 'disallow' in closed ? closed.disallow : []).toBe('/');
});
