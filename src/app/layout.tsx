import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/hooks/useLanguage';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const devanagari = Noto_Sans_Devanagari({ subsets: ['devanagari'], variable: '--font-devanagari', display: 'swap' });

export const metadata: Metadata = {
  title: 'AdhikarSetu — From Confusion to Claim',
  description:
    'Prepare investor claims one step at a time. Check documents, find missing evidence, and spot inconsistencies before submission.',
  keywords: 'IEPF claim, unclaimed shares, legal heir, share transmission, SEBI SCORES, investor rights India',
  openGraph: {
    title: 'AdhikarSetu — From Confusion to Claim',
    description: 'A guided workspace for preparing investor claims and organizing document evidence.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#FCFAF8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${devanagari.variable}`}>
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

