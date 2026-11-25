import { describe, expect, it } from 'vitest';
import {
  emailSuggestion,
  passwordStrength,
} from '@/features/onboarding/account-quality';

describe('email suggestion', () => {
  it('corrects a common adjacent transposition', () => {
    expect(emailSuggestion('student@gmial.com')).toBe('student@gmail.com');
  });

  it('corrects a one-letter substitution', () => {
    expect(emailSuggestion('student@yandex.ri')).toBe('student@yandex.ru');
  });

  it('leaves valid and unrelated domains alone', () => {
    expect(emailSuggestion('student@gmail.com')).toBeNull();
    expect(emailSuggestion('student@example.invalid')).toBeNull();
    expect(emailSuggestion('not-an-email')).toBeNull();
    expect(emailSuggestion('student@')).toBeNull();
  });

  it('preserves the local part and normalizes the domain', () => {
    expect(emailSuggestion('Student@GMAIL.CO')).toBe('Student@gmail.com');
  });
});

describe('password strength', () => {
  it('starts empty and short passwords at the weakest level', () => {
    expect(passwordStrength('')).toMatchObject({ score: 0 });
    expect(passwordStrength('short')).toMatchObject({
      score: 0,
      checks: { length: false },
    });
  });

  it('rewards length, character mix and symbols', () => {
    expect(passwordStrength('abcdefgh')).toMatchObject({
      score: 1,
      checks: { length: true, long: false, mixed: false, symbol: false },
    });
    expect(passwordStrength('abcdefg1')).toMatchObject({ score: 2 });
    expect(passwordStrength('Abcdefgh1234')).toMatchObject({
      score: 3,
      checks: { length: true, long: true, mixed: true, symbol: false },
    });
    expect(passwordStrength('Abcdefgh1234!')).toMatchObject({ score: 4 });
  });

  it('caps a common password even when it is long enough', () => {
    const result = passwordStrength('password123');
    expect(result.common).toBe(true);
    expect(result.score).toBe(1);
  });
});
