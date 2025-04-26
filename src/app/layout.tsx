import { Montserrat } from 'next/font/google';
import './globals.css';
import type { Metadata } from 'next';

const montserrat = Montserrat({ subsets: ['latin'], display: 'swap', variable: '--font-montserrat' });

export const metadata: Metadata = {
  title: {
    template: '%s | Ok Neppo - Luxury Fashion by Nishad Fatma',
    default: 'Ok Neppo - Luxury Fashion by Nishad Fatma',
  },
  description: 'Discover handcrafted luxury fashion by designer Nishad Fatma. Elegant, timeless pieces for the modern woman, featuring sustainable materials and exceptional craftsmanship.',
  keywords: ['fashion', 'luxury clothing', 'Nishad Fatma', 'designer wear', 'sustainable fashion', 'handcrafted', 'Indian designer'],
  creator: 'Nishad Fatma',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://okneppo.com',
    title: 'Ok Neppo - Luxury Fashion by Nishad Fatma',
    description: 'Discover handcrafted luxury fashion by designer Nishad Fatma. Elegant, timeless pieces for the modern woman.',
    siteName: 'Ok Neppo',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo Fashion Collection',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ok Neppo - Luxury Fashion by Nishad Fatma',
    description: 'Discover handcrafted luxury fashion by designer Nishad Fatma.',
    images: ['/images/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        {children}
      </body>
    </html>
  );
}
