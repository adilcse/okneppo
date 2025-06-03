import React from 'react';
import Image from 'next/image';
import { Course } from '@/types/course';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      {course.images && course.images.length > 0 && (
        <div className="relative w-full h-48">
          <Image
            src={course.images[0]}
            alt={course.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
        <p className="text-gray-500 line-through">Price: ${course.max_price.toFixed(2)}</p>
        <p className="text-green-600 font-bold">
          Discounted Price: ${course.discounted_price.toFixed(2)} ({course.discount_percentage.toFixed(2)}% off)
        </p>
        <p className="mt-2 text-gray-600">{course.description.substring(0, 100)}...</p>
        <div className="mt-4">
          <span className="text-sm text-gray-500">{course.subjects.length} subjects</span>
        </div>
      </div>
    </div>
  );
};

export default CourseCard; 