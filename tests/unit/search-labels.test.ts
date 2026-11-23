import { describe, expect, it } from 'vitest';
import { locales } from '@/lib/i18n/messages';
import { searchCopy } from '@/features/search/copy';
import {
  awardTypeLabel,
  costStateLabel,
  formatValueLabel,
  opportunityTypeLabel,
  periodLabel,
} from '@/features/search/labels';

// Canonical database enums from the Phase 10/13/14 migrations. Every code
// that can reach these views must have a localized label in every locale.
const AWARD_TYPES = [
  'scholarship',
  'grant',
  'fellowship',
  'bursary',
  'waiver',
  'assistantship',
  'other',
] as const;
const OPPORTUNITY_TYPES = [
  'olympiad',
  'hackathon',
  'summer_school',
  'research_school',
  'academic_competition',
  'exchange',
  'volunteering',
  'internship',
  'student_conference',
  'award',
  'essay_contest',
  'coding_contest',
  'mentorship',
  'portfolio_program',
  'high_school',
  'gap_year',
  'other',
] as const;
// estimated_tuition.billing_period and living-cost period values.
const PERIODS = [
  'program',
  'academic_year',
  'semester',
  'term',
  'credit',
  'month',
  'year',
] as const;
const FORMATS = [
  'unknown',
  'online',
  'in_person',
  'hybrid',
  'on_campus',
] as const;
const COST_STATES = [
  'unknown',
  'free',
  'paid',
  'fee_waiver_available',
] as const;

describe('localized catalog labels', () => {
  it('translates every award type in every locale', () => {
    for (const locale of locales)
      for (const code of AWARD_TYPES) {
        const label = awardTypeLabel(locale, code);
        expect(label.trim(), `${locale}/${code}`).not.toBe('');
      }
    expect(awardTypeLabel('ru', 'assistantship')).not.toBe('assistantship');
    expect(awardTypeLabel('kk', 'assistantship')).not.toBe('assistantship');
    expect(awardTypeLabel('en', 'assistantship')).toBe('Assistantship');
  });

  it('translates every opportunity type in every locale', () => {
    for (const locale of locales)
      for (const code of OPPORTUNITY_TYPES) {
        const label = opportunityTypeLabel(locale, code);
        expect(label.trim(), `${locale}/${code}`).not.toBe('');
      }
    expect(opportunityTypeLabel('ru', 'summer_school')).toBe('Летняя школа');
    expect(opportunityTypeLabel('kk', 'summer_school')).toBe('Жазғы мектеп');
  });

  it('translates every billing period in every locale', () => {
    for (const locale of locales)
      for (const code of PERIODS) {
        const label = periodLabel(locale, code);
        expect(label.trim(), `${locale}/${code}`).not.toBe('');
      }
    expect(periodLabel('ru', 'academic_year')).toBe('учебный год');
    expect(periodLabel('kk', 'academic_year')).toBe('оқу жылы');
  });

  it('translates delivery formats and opportunity cost states', () => {
    for (const locale of locales) {
      for (const code of FORMATS)
        expect(formatValueLabel(locale, code).trim()).not.toBe('');
      for (const code of COST_STATES)
        expect(costStateLabel(locale, code).trim()).not.toBe('');
    }
    expect(formatValueLabel('ru', 'in_person')).toBe('Очно');
    expect(costStateLabel('kk', 'fee_waiver_available')).not.toBe(
      'fee_waiver_available',
    );
  });

  it('falls back to the raw code for unknown future enum values', () => {
    expect(awardTypeLabel('ru', 'prize_2030')).toBe('prize_2030');
    expect(opportunityTypeLabel('en', 'robotics_camp')).toBe('robotics_camp');
    expect(periodLabel('kk', 'decade')).toBe('decade');
    expect(formatValueLabel('ru', 'metaverse')).toBe('metaverse');
    expect(costStateLabel('en', 'sponsored')).toBe('sponsored');
  });

  it('keeps the three locale label maps structurally identical', () => {
    const keys = (value: object) => Object.keys(value).sort();
    for (const map of ['awardTypes', 'opportunityTypes', 'periods'] as const)
      for (const locale of locales.slice(1))
        expect(keys(searchCopy[locale][map]), `${locale}/${map}`).toEqual(
          keys(searchCopy.ru[map]),
        );
  });
});
