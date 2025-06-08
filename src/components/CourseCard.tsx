import React from 'react';
import Image from 'next/image';
import { Course } from '@/types/course';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  return (
    <div className="group bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {course.images && course.images.length > 0 && (
        <div className="relative w-full h-48">
          <Image
            src={course.images[0]}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-opacity duration-300" /> */}
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-900 group-hover:text-emerald-600 transition-colors duration-300">
          {course.title}
        </h3>
        <div className="mb-4">
          <p className="text-gray-500 line-through text-sm">₹{course.max_price}</p>
          <div className="flex items-center gap-2">
            <p className="text-emerald-600 font-bold text-lg">
              ₹{course.discounted_price}
            </p>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-1 rounded">
              {course.discount_percentage}% OFF
            </span>
          </div>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {course.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {course.subjects?.length || 0} subjects
          </span>
          <span className="text-emerald-600 text-sm font-medium group-hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseCard; 