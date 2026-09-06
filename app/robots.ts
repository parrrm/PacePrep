import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ['*', 'GrokBot', 'XBot'],
        allow: '/',
      },
    ],
    host: 'https://paceprep-mental-math.vercel.app',
  };
}
