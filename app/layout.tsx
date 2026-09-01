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
  title: 'RecallLab — Mental Math Speed Training for Banking Exams',
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
    title: 'RecallLab — Mental Math Speed Training for Banking Exams',
    description:
      'Build instant, accurate recall for SBI PO and IBPS PO quantitative aptitude.',
    url: '/',
    siteName: 'RecallLab',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'RecallLab mental math recall trainer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RecallLab — Mental Math Speed Training for Banking Exams',
    description:
      'Adaptive recall practice for faster, more accurate banking-exam calculations.',
    images: ['/og.png'],
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RecallLab',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  description:
    'Adaptive mental math recall training for SBI PO and IBPS PO quantitative aptitude.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
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
