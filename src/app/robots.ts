import type { MetadataRoute } from 'next';
import { getPublicEnv } from '@/lib/env/public';
import { isIndexableSite } from '@/lib/marketing/seo';

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicEnv().NEXT_PUBLIC_APP_URL;
  const publicSite = isIndexableSite();
  return {
    rules: {
      userAgent: '*',
      ...(publicSite
        ? {
            allow: '/',
            disallow: [
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
            ],
          }
        : { disallow: '/' }),
    },
    sitemap: new URL('/sitemap.xml', origin).toString(),
  };
}
