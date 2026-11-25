'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';

function localeOf(formData: FormData): Locale {
  const value = String(formData.get('locale') ?? '');
  return isLocale(value) ? value : 'ru';
}

/** Only same-locale application paths are accepted as a return destination. */
function safeReturnPath(value: FormDataEntryValue | null, locale: Locale) {
  const raw = typeof value === 'string' ? value : '';
  if (
    raw.length > 300 ||
    raw.includes('\\') ||
    raw.includes('\r') ||
    raw.includes('\n') ||
    !raw.startsWith(`/${locale}/`) ||
    raw.startsWith(`/${locale}//`)
  )
    return `/${locale}/calendar`;
  return raw;
}

export async function trackDeadline(formData: FormData) {
  const locale = localeOf(formData);
  const deadlineId = z.coerce
    .number()
    .int()
    .positive()
    .safeParse(formData.get('deadlineId'));
  const returnTo = safeReturnPath(formData.get('returnTo'), locale);
  const watch = formData.get('watch') === '1';
  if (!deadlineId.success) {
    const target = new URL(returnTo, 'https://jetu.local');
    target.searchParams.set('status', 'error');
    redirect(`${target.pathname}${target.search}`);
  }
  let failed = false;
  try {
    const supabase = await createRequestSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect(`/${locale}/login`);
    const result = watch
      ? await supabase
          .from('deadline_watches')
          .upsert(
            { user_id: data.user.id, deadline_id: deadlineId.data },
            { ignoreDuplicates: true },
          )
      : await supabase
          .from('deadline_watches')
          .delete()
          .eq('user_id', data.user.id)
          .eq('deadline_id', deadlineId.data);
    failed = Boolean(result.error);
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error;
    failed = true;
  }
  const target = new URL(returnTo, 'https://jetu.local');
  target.searchParams.set(
    'status',
    failed ? 'error' : watch ? 'tracked' : 'untracked',
  );
  redirect(`${target.pathname}${target.search}`);
}
