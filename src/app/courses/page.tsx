import { db } from '@/lib/db';
import CourseCard from '@/components/CourseCard';
import Link from 'next/link';
import { Course, Subject } from '@/types/course';

async function getCourses(): Promise<Course[]> {
  const courses = await db.find<Course>('courses', {}, {
    orderBy: 'created_at',
    order: 'DESC'
  });

  // Fetch subjects for each course
  const coursesWithSubjects = await Promise.all(
    courses.map(async (course) => {
      const subjects = await db.find<Subject>('subjects', { course_id: course.id });
      return { ...course, subjects };
    })
  );

  return coursesWithSubjects;
}

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link href={`/courses/${course.id}`} key={course.id}>
            <CourseCard course={course} />
          </Link>
        ))}
      </div>
    </div>
  );
} 