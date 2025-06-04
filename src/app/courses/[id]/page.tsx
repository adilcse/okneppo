"use client";

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Course } from '@/types/course';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { use } from 'react';
import { WHATSAPP_NUMBER } from '@/constant';

function generateWhatsAppLink(course: Course) {
  const message = `Hello!

I'm interested in the course: "${course.title}"
Discounted Price: ₹${course.discounted_price}

Could you please provide more information about this course?

Reference: ${location.href}`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

async function fetchCourse(id: string) {
  const response = await fetch(`/api/courses/${id}`);
  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    throw new Error('Failed to fetch course');
  }
  return response.json() as Promise<Course>;
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => fetchCourse(id),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {isLoading ? (
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E94FFF]"></div>
            </div>
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
              <p>Failed to load course details. Please try again later.</p>
            </div>
          </div>
        ) : course ? (
          <>
            {/* Hero Section */}
            <section className="bg-gray-50 dark:bg-gray-900">
              <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                    {course.title}
                  </h1>
                  
                  {course.images && course.images.length > 0 && (
                    <div className="relative w-full h-[400px] md:h-[500px] mb-8 rounded-lg overflow-hidden">
                      <Image
                        src={course.images[0]}
                        alt={course.title}
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    </div>
                  )}

                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400 line-through text-lg">
                          Original Price: ₹{course.max_price}
                        </p>
                        <div className="flex items-center gap-3">
                          <p className="text-[#E94FFF] font-bold text-2xl">
                            ₹{course.discounted_price}
                          </p>
                          <span className="bg-[#E94FFF] bg-opacity-10 text-[white] text-sm font-medium px-3 py-1 rounded-full">
                            {course.discount_percentage}% OFF
                          </span>
                        </div>
                      </div>
                      <a
                        href={generateWhatsAppLink(course)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-[#E94FFF] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#D13FE8] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                        </svg>
                        Enquire on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Course Content */}
            <section className="py-12">
              <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Course Description</h2>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300">{course.description}</p>
                    </div>
                  </div>

                  {/* Subjects Section */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Course Subjects</h2>
                    <div className="grid gap-6">
                      {course.subjects && course.subjects.length > 0 ? (
                        course.subjects.map((subject) => (
                          <div 
                            key={subject.id} 
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            <div className="flex flex-col md:flex-row gap-6">
                              {subject.images && subject.images.length > 0 && (
                                <div className="relative w-full md:w-1/2 aspect-video rounded-lg overflow-hidden">
                                  <Image
                                    src={subject.images[0]}
                                    alt={subject.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                                  {subject.title}
                                </h3>
                                <p className="text-gray-700 dark:text-gray-300">{subject.description}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          No subjects available for this course yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <Footer />
    </div>
  );
} 