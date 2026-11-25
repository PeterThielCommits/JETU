const COMMON_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'proton.me',
  'protonmail.com',
  'yandex.ru',
  'yandex.kz',
  'mail.ru',
  'bk.ru',
  'inbox.ru',
  'list.ru',
  'qq.com',
  '163.com',
] as const;

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'letmein',
  'iloveyou',
  'admin123',
  'welcome1',
]);

function oneEditApart(a: string, b: string) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const mismatches: number[] = [];
    for (let index = 0; index < a.length; index += 1) {
      if (a[index] !== b[index]) mismatches.push(index);
      if (mismatches.length > 2) return false;
    }
    if (mismatches.length === 1) return true;
    // A single adjacent transposition is the most common typing mistake.
    return (
      mismatches.length === 2 &&
      mismatches[1] === mismatches[0]! + 1 &&
      a[mismatches[0]!] === b[mismatches[1]!] &&
      a[mismatches[1]!] === b[mismatches[0]!]
    );
  }
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  let shortIndex = 0;
  let longIndex = 0;
  let skipped = false;
  while (shortIndex < shorter.length && longIndex < longer.length) {
    if (shorter[shortIndex] === longer[longIndex]) {
      shortIndex += 1;
      longIndex += 1;
      continue;
    }
    if (skipped) return false;
    skipped = true;
    longIndex += 1;
  }
  return true;
}

/**
 * Suggests a corrected common email domain for a likely typo. The function is
 * intentionally local and deterministic: it never sends the address anywhere.
 */
export function emailSuggestion(value: string) {
  const trimmed = value.trim();
  const email = trimmed.toLowerCase();
  const at = email.indexOf('@');
  if (at < 1 || at !== email.lastIndexOf('@') || at === email.length - 1)
    return null;
  const local = trimmed.slice(0, at);
  const domain = email.slice(at + 1);
  const topLevel = domain.slice(domain.lastIndexOf('.') + 1);
  if (
    !domain.includes('.') ||
    topLevel.length < 2 ||
    (COMMON_DOMAINS as readonly string[]).includes(domain)
  )
    return null;
  const match = COMMON_DOMAINS.find((candidate) =>
    oneEditApart(domain, candidate),
  );
  return match ? `${local}@${match}` : null;
}

export type PasswordChecks = {
  length: boolean;
  long: boolean;
  mixed: boolean;
  symbol: boolean;
};

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  checks: PasswordChecks;
  common: boolean;
};

/** Deterministic local strength estimate used only as student guidance. */
export function passwordStrength(password: string): PasswordStrength {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    long: password.length >= 12,
    mixed: /[A-Za-z]/.test(password) && /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const common = COMMON_PASSWORDS.has(password.trim().toLowerCase());
  let score = Object.values(checks).filter(Boolean).length;
  if (!checks.length || common) score = Math.min(score, 1);
  return { score: score as PasswordStrength['score'], checks, common };
}
