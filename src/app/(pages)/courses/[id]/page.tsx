import { Metadata } from 'next';
import CourseDetailClient from './CourseDetailClient';
import { Course } from '@/types/course';
import axiosClient from '@/lib/axios';
import { AxiosError } from 'axios';
import CourseJsonLd from '@/components/utils/CourseJsonLd';

async function fetchCourse(id: string) {
  try {
    const response = await axiosClient.get(`/api/courses/${id}`);
    return response.data as Course;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch course');
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const course = await fetchCourse(id);
    
    if (!course) {
      return {
        title: 'Course Not Found | Ok Neppo',
        description: 'The requested course could not be found.',
      };
    }

    return {
      title: `${course.title} - Fashion Design Course | Ok Neppo`,
      description: `Learn ${course.title} with Nishad Fatma. Professional fashion design course with hands-on training, expert guidance, and industry insights. Enroll now for ${course.discounted_price ? `₹${course.discounted_price}` : 'competitive pricing'}!`,
      keywords: [
        'fashion design course',
        course.title.toLowerCase(),
        'fashion education',
        'design techniques',
        'Nishad Fatma',
        'fashion training',
        'online fashion course',
        'fashion design certification',
        'design skills',
        'fashion industry',
        'creative design',
        'fashion career'
      ],
      openGraph: {
        title: `${course.title} - Fashion Design Course | Ok Neppo`,
        description: `Learn ${course.title} with Nishad Fatma. Professional fashion design course with hands-on training and expert guidance.`,
        images: course.images && course.images.length > 0 ? [
          {
            url: course.images[0],
            width: 1200,
            height: 630,
            alt: `${course.title} - Fashion Design Course`,
          }
        ] : [
          {
            url: '/images/og-image.jpg',
            width: 1200,
            height: 630,
            alt: 'Ok Neppo Fashion Design Course',
          }
        ],
        type: 'article',
        locale: 'en_US',
        siteName: 'Ok Neppo',
        url: `https://okneppo.in/courses/${id}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${course.title} - Fashion Design Course | Ok Neppo`,
        description: `Learn ${course.title} with Nishad Fatma. Professional fashion design course with hands-on training.`,
        images: course.images && course.images.length > 0 ? [course.images[0]] : ['/images/og-image.jpg'],
      },
      alternates: {
        canonical: `https://okneppo.in/courses/${id}`,
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
  } catch {
    return {
      title: 'Course Not Found | Ok Neppo',
      description: 'The requested course could not be found.',
    };
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await fetchCourse(id);
  
  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
          <p>Course not found. Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <CourseJsonLd course={course} />
      <CourseDetailClient course={course} />
    </>
  );
} 