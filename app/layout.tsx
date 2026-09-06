import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './mobile-launch.css';
import './practice-family.css';
import { PwaProvider } from './pwa-provider';

const origin =
  process.env.PACEPREP_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
  'https://recalllab-sbi-ibps-mental-math.milky-horse-8149.chatgpt.site';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title: {
    default: 'PacePrep — Mental Math Recall Training for Banking Exams',
    template: '%s · PacePrep',
  },
  description:
    'Build instant, accurate recall for SBI PO and IBPS PO fractions, tables, squares, cubes, and mental multiplication with adaptive practice.',
  keywords: [
    'mental math practice',
    'SBI PO quantitative aptitude',
    'IBPS PO preparation',
    'fraction percentage practice',
    'multiplication tables practice',
  ],
  alternates: { canonical: '/' },
  robots: { index: process.env.VERCEL_ENV !== 'preview', follow: true },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'PacePrep', statusBarStyle: 'default' },
  icons: { icon: '/icons/app.svg', apple: '/icons/apple-touch-icon.png' },
  openGraph: {
    title: 'PacePrep — Mental Math Recall Training for Banking Exams',
    description:
      'Build instant, accurate recall for SBI PO and IBPS PO quantitative aptitude.',
    url: '/',
    siteName: 'PacePrep',
    type: 'website',
    images: [
      {
        url: '/paceprep-social.png',
        width: 1200,
        height: 630,
        alt: 'PacePrep — Turn calculation into instant recall.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PacePrep — Mental Math Recall Training for Banking Exams',
    description:
      'Adaptive recall practice for faster, more accurate banking-exam calculations.',
    images: ['/paceprep-social.png'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'PacePrep',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  description:
    'Adaptive mental math recall training for SBI PO and IBPS PO quantitative aptitude.',
  audience: { '@type': 'Audience', suggestedMinAge: 18 },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#142d4e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
