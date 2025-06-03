import React, { useState, useEffect } from 'react';
import { Course } from '../types/course';
import { dummyCourses } from '../data/dummyCourses';
import CourseCard from '../components/CourseCard';

// This is a placeholder for navigation. Replace with your actual router logic.
const navigateToCourseDetail = (courseId: string) => {
  // Example: window.location.href = `/courses/${courseId}`;
  // Or if using a router like React Router: history.push(`/courses/${courseId}`);
  alert(`Navigate to course detail page for course ID: ${courseId}. Replace this with actual navigation.`);
  console.log(`Would navigate to /courses/${courseId}`);
};

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    // In a real app, you would fetch this data from an API
    setCourses(dummyCourses);
  }, []);

  const handleSelectCourse = (id: string) => {
    console.log(`Selected course ID: ${id}`);
    // Here you would typically navigate to the course detail page
    // For example, if you have a router: history.push(`/courses/${id}`)
    navigateToCourseDetail(id);
  };

  return (
    <div>
      <h1>Our Courses</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {courses.map(course => (
          <CourseCard key={course.id} course={course} onSelectCourse={handleSelectCourse} />
        ))}
      </div>
    </div>
  );
};

export default CoursesPage; 