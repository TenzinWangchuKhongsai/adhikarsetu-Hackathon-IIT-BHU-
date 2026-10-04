import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/hooks/useLanguage';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AdhikarSetu — Your Bridge to Financial Rights',
  description:
    'AdhikarSetu guides Indian investors and legal heirs through IEPF claims, share transmission, SEBI SCORES complaints, and nominee registration — step by step, in plain language.',
  keywords: 'IEPF claim, unclaimed shares, legal heir, share transmission, SEBI SCORES, investor rights India',
  openGraph: {
    title: 'AdhikarSetu — Your Bridge to Financial Rights',
    description: 'Step-by-step claim assistant for Indian investors',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
