import { Metadata } from 'next';
import CourseDetailClient from './CourseDetailClient';
import { Course } from '@/types/course';
import axiosClient from '@/lib/axios';
import { AxiosError } from 'axios';

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
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const course = await fetchCourse(params.id);
    
    if (!course) {
      return {
        title: 'Course Not Found | Ok Neppo',
        description: 'The requested course could not be found.',
      };
    }

    return {
      title: `${course.title} | Ok Neppo Courses`,
      description: course.description,
      keywords: [
        'fashion design course',
        course.title.toLowerCase(),
        'fashion education',
        'design techniques',
        'Nishad Fatma',
        'fashion training'
      ],
      openGraph: {
        title: `${course.title} | Ok Neppo Courses`,
        description: course.description,
        images: course.images && course.images.length > 0 ? [
          {
            url: course.images[0],
            width: 1200,
            height: 630,
            alt: course.title,
          }
        ] : [],
        type: 'article',
        locale: 'en_US',
        siteName: 'Ok Neppo',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${course.title} | Ok Neppo Courses`,
        description: course.description,
        images: course.images && course.images.length > 0 ? [course.images[0]] : [],
      },
      alternates: {
        canonical: `https://okneppo.in/courses/${params.id}`,
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
  params: { id: string };
}) {
  const course = await fetchCourse(params.id);
  
  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
          <p>Course not found. Please check the URL and try again.</p>
        </div>
      </div>
    );
  }

  return <CourseDetailClient course={course} />;
} 