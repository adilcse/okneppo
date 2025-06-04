"use client";

import { useQuery } from '@tanstack/react-query';
import CourseCard from '@/components/CourseCard';
import Link from 'next/link';
import { Course } from '@/types/course';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

async function fetchCourses() {
  const response = await fetch('/api/courses');
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  const data = await response.json();
  return data.courses as Course[];
}

export default function CoursesPage() {
  const { data: courses, isLoading, error } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">Our Courses</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl text-sm sm:text-base">
            Explore our comprehensive range of courses designed to help you master new skills. 
            Each course is carefully crafted with expert knowledge and practical experience.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E94FFF]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
              <p>Failed to load courses. Please try again later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses?.map((course) => (
                <Link href={`/courses/${course.id}`} key={course.id}>
                  <CourseCard course={course} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
} 