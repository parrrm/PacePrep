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
  title: 'RecallLab — Mental Math for SBI PO & IBPS PO',
  description: 'Build instant, accurate recall for fractions, tables, squares, cubes and mental multiplication.',
  openGraph: {
    title: 'RecallLab — Mental Math for SBI PO & IBPS PO',
    description: 'Build instant, accurate recall for fractions, tables, squares, cubes and mental multiplication.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'RecallLab mental math recall trainer' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RecallLab — Mental Math for SBI PO & IBPS PO',
    description: 'Build instant, accurate recall for fractions, tables, squares, cubes and mental multiplication.',
    images: ['/og.png'],
  },
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
        {children}
      </body>
    </html>
  );
}
