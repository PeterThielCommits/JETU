import type { Locale } from '@/lib/i18n/messages';
import { searchCopy } from './copy';

/** Localized labels for catalog enum codes; unknown codes fall back to the raw value. */
export function awardTypeLabel(locale: Locale, code: string) {
  const t = searchCopy[locale];
  return t.awardTypes[code as keyof typeof t.awardTypes] ?? code;
}

export function opportunityTypeLabel(locale: Locale, code: string) {
  const t = searchCopy[locale];
  return t.opportunityTypes[code as keyof typeof t.opportunityTypes] ?? code;
}

export function periodLabel(locale: Locale, code: string) {
  const t = searchCopy[locale];
  return t.periods[code as keyof typeof t.periods] ?? code;
}

export function formatValueLabel(locale: Locale, code: string) {
  const t = searchCopy[locale];
  return (
    {
      on_campus: t.option.onCampus,
      in_person: t.option.inPerson,
      online: t.option.online,
      hybrid: t.option.hybrid,
      unknown: t.unknown,
    }[code] ?? code
  );
}

export function costStateLabel(locale: Locale, code: string) {
  const t = searchCopy[locale];
  return (
    {
      free: t.option.free,
      paid: t.option.paid,
      fee_waiver_available: t.option.feeWaiver,
      unknown: t.unknown,
    }[code] ?? code
  );
}
