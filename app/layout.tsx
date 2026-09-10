import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './mobile-launch.css';
import './practice-family.css';
import './training-workspace.css';
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
    default: 'PacePrep — Find and Fix Weak Mental Maths for Banking Exams',
    template: '%s · PacePrep',
  },
  description:
    'Find the mental-math facts costing marks and time in SBI PO and IBPS PO exams, then fix them with focused practice and measurable progress.',
  keywords: [
    'mental math practice',
    'SBI PO quantitative aptitude',
    'IBPS PO preparation',
    'fraction percentage practice',
    'multiplication tables practice',
  ],
  robots: { index: process.env.VERCEL_ENV !== 'preview', follow: true },
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'PacePrep', statusBarStyle: 'default' },
  icons: { icon: '/icons/app.svg', apple: '/icons/apple-touch-icon.png' },
  openGraph: {
    title: 'PacePrep — Know What Is Costing You Marks',
    description:
      'Identify weak mental maths, protect accuracy, and recover time for SBI PO and IBPS PO quantitative aptitude.',
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
    title: 'PacePrep — Know What Is Costing You Marks',
    description:
      'Focused mental-math practice that shows what is holding you back and what to improve next.',
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
    'Identifies weak mental-math recall, gives focused corrective practice, and measures accuracy and pace for SBI PO and IBPS PO preparation.',
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
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <div id="main-content" className="content-root" tabIndex={-1}>
          <PwaProvider>{children}</PwaProvider>
        </div>
      </body>
    </html>
  );
}
