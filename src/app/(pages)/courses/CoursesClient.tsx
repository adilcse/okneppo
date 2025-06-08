"use client";

import CourseCard from '@/components/CourseCard';
import Link from 'next/link';
import { Course } from '@/types/course';

export default function CoursesClient({ initialCourses }: { initialCourses: Course[] }) {
  return (
    <div className="flex flex-col min-h-screen">
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
          {initialCourses.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                No Courses Available
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                We&apos;re currently updating our course catalog. Please check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialCourses.map((course) => (
                <Link href={`/courses/${course.id}`} key={course.id}>
                  <CourseCard course={course} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 