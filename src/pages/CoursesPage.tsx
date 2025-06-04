import React, { useState, useEffect } from 'react';
import { Course } from '../types/course';
import { dummyCourses } from '../data/dummyCourses';
import CourseCard from '../components/CourseCard';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    setCourses(dummyCourses);
  }, []);

  return (
    <div>
      <h1>Our Courses</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

export default CoursesPage; 