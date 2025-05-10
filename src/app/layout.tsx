import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import QueryProvider from '@/providers/QueryProvider';
import OrganizationJsonLd from '@/components/utils/OrganizationJsonLd';
import PageTransition from '@/components/ui/PageTransition';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const metadata: Metadata = {
  metadataBase: new URL('https://okneppo.in'),
  title: 'OKNEPPO | Innovative Fashion Designer',
  description: 'Discover unique, sustainable fashion designs crafted with precision by OKNEPPO.',
  keywords: ['fashion', 'design', 'clothing', 'sustainable', 'ethical', 'innovative'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://okneppo.in',
    siteName: 'OKNEPPO',
    title: 'OKNEPPO | Innovative Fashion Designer',
    description: 'Discover unique, sustainable fashion designs crafted with precision by OKNEPPO.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OKNEPPO Fashion',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={montserrat.variable} suppressHydrationWarning>
      <head />
      <body className="antialiased">
        <ThemeProvider>
          <QueryProvider>
            {children}
            <OrganizationJsonLd />
            <PageTransition />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
