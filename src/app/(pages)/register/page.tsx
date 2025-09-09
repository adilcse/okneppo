import { Metadata } from 'next';
import RegisterCoursePage from './RegisterCoursePage';

export const metadata: Metadata = {
  title: 'Register for Online Fashion Design Courses | Ok Neppo',
  description: 'Register for professional fashion design courses by Nishad Fatma. Learn from industry experts with hands-on training, flexible schedules, and career guidance. Start your fashion design journey today!',
  keywords: [
    'fashion design course registration',
    'online fashion design course',
    'fashion design training',
    'Nishad Fatma courses',
    'fashion education',
    'design course enrollment',
    'fashion design certification',
    'online learning',
    'fashion design classes',
    'design course booking'
  ],
  openGraph: {
    title: 'Register for Online Fashion Design Courses | Ok Neppo',
    description: 'Register for professional fashion design courses by Nishad Fatma. Learn from industry experts with hands-on training and flexible schedules.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Ok Neppo',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo Fashion Design Course Registration',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Register for Online Fashion Design Courses | Ok Neppo',
    description: 'Register for professional fashion design courses by Nishad Fatma. Learn from industry experts with hands-on training.',
    images: ['/images/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://okneppo.in/register',
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
};

export default function RegisterPage() {
  return <RegisterCoursePage />;
}