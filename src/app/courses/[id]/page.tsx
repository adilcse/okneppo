import { db } from '@/lib/db';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Course, Subject } from '@/types/course';

async function getCourse(id: string): Promise<Course> {
  const course = await db.findById<Course>('courses', id);
  
  if (!course) {
    notFound();
  }
  
  const subjects = await db.find<Subject>('subjects', { course_id: id });
  return { ...course, subjects };
}

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const course = await getCourse(params.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">{course.title}</h1>
        
        {course.images && course.images.length > 0 && (
          <div className="relative w-full h-96 mb-8">
            <Image
              src={course.images[0]}
              alt={course.title}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}

        <div className="mb-8">
          <p className="text-gray-500 line-through text-xl">Original Price: ${course.max_price.toFixed(2)}</p>
          <p className="text-green-600 font-bold text-2xl">
            Discounted Price: ${course.discounted_price.toFixed(2)} ({course.discount_percentage.toFixed(2)}% off)
          </p>
        </div>

        <div className="prose max-w-none mb-12">
          <h2 className="text-2xl font-semibold mb-4">Course Description</h2>
          <p className="text-gray-700">{course.description}</p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Subjects</h2>
          <div className="grid gap-6">
            {course.subjects.map((subject) => (
              <div key={subject.id} className="border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">{subject.title}</h3>
                {subject.images && subject.images.length > 0 && (
                  <div className="relative w-full h-48 mb-4">
                    <Image
                      src={subject.images[0]}
                      alt={subject.title}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                )}
                <p className="text-gray-700">{subject.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a
            href={`https://wa.me/YOUR_WHATSAPP_NUMBER?text=${encodeURIComponent(
              `Hello, I am interested in enquiring about the course: "${course.title}".`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Enquire on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
} 