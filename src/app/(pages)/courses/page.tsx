import { Metadata } from 'next';
import CoursesClient from './CoursesClient';
import { Course } from '@/types/course';
import axiosClient from '@/lib/axios';

// Generate metadata for SEO
export const metadata: Metadata = {
  title: 'Fashion Design Courses | Ok Neppo',
  description: 'Learn fashion design from expert Nishad Fatma. Explore our comprehensive range of courses covering design techniques, sustainable practices, and industry insights. Start your fashion journey today.',
  keywords: ['fashion design courses', 'fashion education', 'design techniques', 'sustainable fashion', 'Nishad Fatma', 'fashion training', 'design skills'],
  openGraph: {
    title: 'Fashion Design Courses | Ok Neppo',
    description: 'Learn fashion design from expert Nishad Fatma. Explore our comprehensive range of courses covering design techniques, sustainable practices, and industry insights.',
    images: [
      {
        url: 'https://storage.googleapis.com/okneppo/images/products/f3f3f6b8c810a2c509037b7e1ec1fce6.webp',
        width: 1200,
        height: 630,
        alt: 'Ok Neppo Fashion Design Courses',
      }
    ],
    type: 'website',
    locale: 'en_US',
    siteName: 'Ok Neppo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fashion Design Courses | Ok Neppo',
    description: 'Learn fashion design from expert Nishad Fatma. Explore our comprehensive range of courses.',
    images: ['https://storage.googleapis.com/okneppo/images/products/f3f3f6b8c810a2c509037b7e1ec1fce6.webp'],
  },
  alternates: {
    canonical: 'https://okneppo.in/courses',
  },
};

async function fetchCourses() {
  const response = await axiosClient.get('/api/courses');
  return response.data.courses as Course[];
}

export default async function CoursesPage() {
  const courses = await fetchCourses();
  
  return <CoursesClient initialCourses={courses} />;
} 