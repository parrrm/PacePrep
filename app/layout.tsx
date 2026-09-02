import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    'https://recalllab-sbi-ibps-mental-math.milky-horse-8149.chatgpt.site',
  ),
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
  robots: { index: true, follow: true },
  openGraph: {
    title: 'PacePrep — Mental Math Recall Training for Banking Exams',
    description:
      'Build instant, accurate recall for SBI PO and IBPS PO quantitative aptitude.',
    url: '/',
    siteName: 'PacePrep',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PacePrep — Mental Math Recall Training for Banking Exams',
    description:
      'Adaptive recall practice for faster, more accurate banking-exam calculations.',
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
        {children}
      </body>
    </html>
  );
}
