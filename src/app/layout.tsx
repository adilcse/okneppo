import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import OrganizationJsonLd from '@/components/utils/OrganizationJsonLd';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const metadata: Metadata = {
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
          {children}
          <OrganizationJsonLd />
        </ThemeProvider>
      </body>
    </html>
  );
}
