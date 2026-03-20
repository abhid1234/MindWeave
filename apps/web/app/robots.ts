import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.mindweave.space';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/embed/', '/share/'],
        disallow: ['/api/', '/dashboard/', '/onboarding', '/.well-known/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
