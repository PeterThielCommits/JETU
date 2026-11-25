import { describe, expect, it } from 'vitest';
import {
  daysUntil,
  deadlineIdFromEventKey,
  notificationCursorFilter,
  type CalendarEvent,
} from '@/features/deadlines/model';
import { eventExportHref, googleCalendarUrl } from '@/features/deadlines/links';
import { exportIcs } from '@/features/deadlines/ics';

const base: CalendarEvent = {
  event_key: 'official:42',
  user_id: 'private-owner',
  title: 'Official application deadline',
  category: 'application',
  origin: 'official',
  precision: 'date_only',
  due_at: null,
  due_date: '2026-11-20',
  timezone: null,
  source_url: 'https://example.edu/admissions',
  checked_at: '2026-11-01T10:00:00Z',
  verified: true,
  status: 'active',
  revision: 'a',
  version: 3,
  updated_at: '2026-11-01T10:00:00Z',
  muted: false,
};

describe('deadline helpers', () => {
  it('computes whole calendar days without timezone drift', () => {
    expect(daysUntil(base, 'Pacific/Kiritimati', '2026-11-06')).toBe(14);
    expect(daysUntil(base, 'America/Adak', '2026-11-06')).toBe(14);
    expect(
      daysUntil({ ...base, due_date: '2026-11-06' }, 'UTC', '2026-11-06'),
    ).toBe(0);
    expect(
      daysUntil({ ...base, due_date: '2026-11-01' }, 'UTC', '2026-11-06'),
    ).toBe(-5);
  });

  it('only derives positive official deadline ids', () => {
    expect(deadlineIdFromEventKey('official:42')).toBe(42);
    expect(deadlineIdFromEventKey('custom:42')).toBeNull();
    expect(deadlineIdFromEventKey('official:abc')).toBeNull();
    expect(deadlineIdFromEventKey('official:0')).toBeNull();
  });

  it('quotes the PostgREST cursor timestamp', () => {
    expect(
      notificationCursorFilter(
        '2026-11-06T12:00:00+00:00',
        '23000000-0000-4000-8000-000000000020',
      ),
    ).toBe(
      'created_at.lt."2026-11-06T12:00:00+00:00",and(created_at.eq."2026-11-06T12:00:00+00:00",id.lt.23000000-0000-4000-8000-000000000020)',
    );
  });
});

describe('calendar links and single-event export', () => {
  it('builds an all-day Google Calendar link', () => {
    const url = new URL(googleCalendarUrl(base, 'Asia/Almaty')!);
    expect(url.origin).toBe('https://calendar.google.com');
    expect(url.searchParams.get('dates')).toBe('20261120/20261121');
    expect(url.searchParams.get('ctz')).toBe('Asia/Almaty');
    expect(url.searchParams.get('text')).toBe(base.title);
    expect(url.searchParams.get('details')).toContain(
      'https://example.edu/admissions',
    );
  });

  it('builds an instant Google Calendar link in UTC', () => {
    const url = new URL(
      googleCalendarUrl(
        {
          ...base,
          precision: 'instant',
          due_date: null,
          due_at: '2026-11-20T09:00:00.250+05:00',
        },
        'Asia/Almaty',
      )!,
    );
    expect(url.searchParams.get('dates')).toBe(
      '20261120T040000Z/20261120T050000Z',
    );
  });

  it('omits a Google link when no date is published', () => {
    expect(
      googleCalendarUrl(
        { ...base, precision: 'unknown', due_date: null, due_at: null },
        'UTC',
      ),
    ).toBeNull();
  });

  it('encodes a single-event export route', () => {
    expect(eventExportHref('official:42', 'Asia/Almaty')).toBe(
      '/api/calendar/export?event_key=official%3A42&timezone=Asia%2FAlmaty',
    );
  });

  it('adds an all-day DTEND and the official source URL to ICS', () => {
    const ics = exportIcs([base], '2026-11-06T12:00:00Z');
    expect(ics).toContain('DTEND;VALUE=DATE:20261121');
    expect(ics).toContain('URL:https://example.edu/admissions');
  });

  it('gives instant events a one-hour DTEND', () => {
    const ics = exportIcs(
      [
        {
          ...base,
          precision: 'instant',
          due_date: null,
          due_at: '2026-11-20T09:00:00.250+05:00',
        },
      ],
      '2026-11-06T12:00:00Z',
    );
    expect(ics).toContain('DTSTART:20261120T040000Z');
    expect(ics).toContain('DTEND:20261120T050000Z');
  });
});
