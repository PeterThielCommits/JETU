import { Temporal } from '@js-temporal/polyfill';
import { eventDate, type CalendarEvent } from './model';

function compactDate(date: string) {
  return date.replaceAll('-', '');
}

function compactInstant(instant: Temporal.Instant) {
  return instant
    .toString({ smallestUnit: 'second' })
    .replaceAll('-', '')
    .replaceAll(':', '');
}

/**
 * Builds a user-initiated Google Calendar template link. No network request is
 * made by JETU; the title is sent to Google only after the user opens the link.
 */
export function googleCalendarUrl(event: CalendarEvent, zone: string) {
  const date = eventDate(event, zone);
  if (!date) return null;
  const params = new URLSearchParams({ action: 'TEMPLATE', text: event.title });
  if (event.precision === 'date_only' || !event.due_at) {
    const end = Temporal.PlainDate.from(date).add({ days: 1 }).toString();
    params.set('dates', `${compactDate(date)}/${compactDate(end)}`);
  } else {
    const start = Temporal.Instant.from(event.due_at);
    const end = start.add({ hours: 1 });
    params.set('dates', `${compactInstant(start)}/${compactInstant(end)}`);
  }
  params.set('ctz', zone);
  const details = [
    event.origin === 'official'
      ? event.verified
        ? 'Official JETU catalog deadline. Verify the current deadline before applying.'
        : 'Unverified JETU catalog deadline. Check the official source.'
      : 'Personal JETU planning date. Not an official deadline.',
    event.source_url && /^https:\/\//.test(event.source_url)
      ? `Source: ${event.source_url}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
  params.set('details', details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Single-event export uses the same authenticated, owner-scoped route. */
export function eventExportHref(eventKey: string, zone: string) {
  const params = new URLSearchParams({ event_key: eventKey, timezone: zone });
  return `/api/calendar/export?${params.toString()}`;
}
