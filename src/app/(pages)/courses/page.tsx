import { Metadata } from 'next';
import CoursesClient from './CoursesClient';
import { Course } from '@/types/course';
import axiosClient from '@/lib/axios';

// Generate metadata for SEO
export const metadata: Metadata = {
  title: 'Fashion Design Courses - Learn from Expert Nishad Fatma | Ok Neppo',
  description: 'Master fashion design with professional courses by Nishad Fatma. Comprehensive training in design techniques, sustainable fashion, pattern making, and industry insights. Online and offline classes available. Enroll now!',
  keywords: [
    'fashion design courses',
    'fashion education',
    'design techniques',
    'sustainable fashion',
    'Nishad Fatma',
    'fashion training',
    'design skills',
    'online fashion course',
    'fashion design certification',
    'pattern making',
    'fashion illustration',
    'textile design',
    'fashion industry',
    'creative design',
    'fashion career'
  ],
  openGraph: {
    title: 'Fashion Design Courses - Learn from Expert Nishad Fatma | Ok Neppo',
    description: 'Master fashion design with professional courses by Nishad Fatma. Comprehensive training in design techniques, sustainable fashion, and industry insights.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo Fashion Design Courses - Learn from Expert Nishad Fatma',
      }
    ],
    type: 'website',
    locale: 'en_US',
    siteName: 'Ok Neppo',
    url: 'https://okneppo.in/courses',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fashion Design Courses - Learn from Expert Nishad Fatma | Ok Neppo',
    description: 'Master fashion design with professional courses by Nishad Fatma. Comprehensive training in design techniques and industry insights.',
    images: ['/images/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://okneppo.in/courses',
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

// Set the revalidation timer - refresh the page every hour
export const revalidate = 3600;

async function fetchCourses() {
  try {
    const response = await axiosClient.get('/api/courses');
    return response.data.courses as Course[];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return []; // Return empty array as fallback
  }
}

export default async function CoursesPage() {
  const courses = await fetchCourses();
  
  return <CoursesClient initialCourses={courses} />;
} 