import type { Metadata, Viewport } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import QueryProvider from '@/providers/QueryProvider';
import OrganizationJsonLd from '@/components/utils/OrganizationJsonLd';
import PageTransition from '@/components/ui/PageTransition';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from 'react-hot-toast';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });

export const metadata: Metadata = {
  metadataBase: new URL('https://okneppo.in'),
  title: {
    default: 'OKNEPPO | Innovative Fashion Designer',
    template: '%s | OKNEPPO'
  },
  description: 'Discover unique, sustainable fashion designs crafted with precision by OKNEPPO. Explore our exclusive collection of handcrafted luxury garments.',
  keywords: ['fashion', 'design', 'clothing', 'sustainable', 'ethical', 'innovative', 'luxury fashion', 'handcrafted', 'Nishad Fatma', 'Indian fashion'],
  authors: [{ name: 'Nishad Fatma' }],
  creator: 'Nishad Fatma',
  publisher: 'OKNEPPO',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
  twitter: {
    card: 'summary_large_image',
    title: 'OKNEPPO | Innovative Fashion Designer',
    description: 'Discover unique, sustainable fashion designs crafted with precision by OKNEPPO.',
    images: ['/images/og-image.jpg'],
    creator: '@okneppo',
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
            <Analytics />
            <SpeedInsights />
            {children}
            <OrganizationJsonLd />
            <PageTransition />
            <Toaster position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
