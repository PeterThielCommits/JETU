import { getPublicEnv } from '@/lib/env/public';
import { redirect } from 'next/navigation';
import { BrandLogo } from '@/components/ui/brand';
import { authCopy } from '@/lib/i18n/auth';
import { isLocale, messages } from '@/lib/i18n/messages';
import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { signOut } from './actions';
import { searchCopy } from '@/features/search/copy';
import { matchingCopy } from '@/features/matching/copy';
import { deadlineCopy } from '@/features/deadlines/copy';
import { WorkspaceNav } from '@/features/onboarding/workspace-nav';
import { roadmapCopy } from '@/features/roadmap/copy';
import { vaultCopy } from '@/features/vault/copy';
import { applicationsCopy } from '@/features/applications/copy';
import { editorCopy } from '@/features/catalog-editor/copy';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const env = getPublicEnv();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    redirect(`/${locale}/login`);
  const supabase = await createRequestSupabaseClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect(`/${locale}/login`);
  const editorialMembership = await supabase
    .from('catalog_editor_memberships')
    .select('role')
    .eq('user_id', data.claims.sub)
    .maybeSingle();
  const t = authCopy[locale];
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', data.claims.sub)
    .is('read_at', null)
    .is('archived_at', null);
  return (
    <div className="dashboard-page">
      <a className="skip-link" href="#main">
        {messages[locale].skip}
      </a>
      <header className="dashboard-header">
        <div className="page-shell dashboard-header-inner">
          <a
            href={`/${locale}`}
            className="wordmark"
            aria-label="JETU Admissions"
          >
            <BrandLogo />
            <small>Admissions</small>
          </a>
          <WorkspaceNav
            label={t.dashboard}
            items={[
              {
                href: `/${locale}/calendar`,
                label: deadlineCopy[locale].calendar,
                icon: 'calendar',
              },
              {
                href: `/${locale}/notifications`,
                label: deadlineCopy[locale].inbox,
                count,
                icon: 'bell',
              },
              {
                href: `/${locale}/dashboard`,
                label: t.dashboard,
                icon: 'book',
              },
              {
                href: `/${locale}/onboarding`,
                label: t.onboarding,
                icon: 'check',
              },
              {
                href: `/${locale}/saved`,
                label: searchCopy[locale].savedDestination,
                icon: 'search',
              },
              {
                href: `/${locale}/match`,
                label: matchingCopy[locale].title,
                icon: 'arrow',
              },
              {
                href: `/${locale}/plan`,
                label: roadmapCopy[locale].nav,
                icon: 'check',
              },
              {
                href: `/${locale}/applications`,
                label: applicationsCopy[locale].nav,
                icon: 'book',
              },
              {
                href: `/${locale}/vault`,
                label: vaultCopy(locale).vault,
                icon: 'download',
              },
              {
                href: `/${locale}/writing`,
                label: vaultCopy(locale).writing,
                icon: 'book',
              },
              ...(editorialMembership.data
                ? [
                    {
                      href: `/${locale}/admin`,
                      label: editorCopy[locale].title,
                      icon: 'settings' as const,
                    },
                  ]
                : []),
            ]}
          />
          <form action={signOut}>
            <input type="hidden" name="locale" value={locale} />
            <button className="ui-button ui-button--secondary" type="submit">
              {t.signOut}
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
