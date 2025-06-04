import React, { useState, useEffect } from 'react';
import { Course, Subject } from '../types/course';
import { dummyCourses } from '../data/dummyCourses';
import Image from 'next/image';

// Placeholder for getting courseId, e.g., from URL params or props
interface CourseDetailPageProps {
  courseId: string; // This would typically come from a router, e.g., useParams()
}

const CourseDetailPage: React.FC<CourseDetailPageProps> = ({ courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const foundCourse = dummyCourses.find(c => c.id === courseId);
    setCourse(foundCourse || null);
  }, [courseId]);

  const handleEnquiry = () => {
    if (!course) return;
    const message = `Hello, I am interested in enquiring about the course: "${course.title}".`;
    const whatsappUrl = `https://wa.me/YOUR_WHATSAPP_NUMBER?text=${encodeURIComponent(message)}`;
    // Replace YOUR_WHATSAPP_NUMBER with your actual WhatsApp number (including country code)
    // e.g., https://wa.me/1XXXXXXXXXX?text=...
    alert(`Redirecting to WhatsApp: ${whatsappUrl}. Replace YOUR_WHATSAPP_NUMBER in the code.`);
    window.open(whatsappUrl, '_blank');
  };

  if (!course) {
    return <div>Loading course details or course not found...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{course.title}</h1>
      {course.images && course.images.length > 0 && (
        <Image 
          src={course.images[0]} 
          alt={course.title} 
          style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '20px' }} 
        />
      )}
      <p><strong>Description:</strong> {course.description}</p>
      <p style={{ textDecoration: 'line-through', color: 'gray' }}>Original Price: ₹{course.max_price}</p>
      <h3 style={{ color: 'green' }}>Discounted Price: ₹{course.discounted_price} ({course.discount_percentage}% off)</h3>
      
      <button 
        onClick={handleEnquiry} 
        style={{
          backgroundColor: '#25D366', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px', 
          fontSize: '16px', 
          cursor: 'pointer', 
          marginTop: '20px',
          marginBottom: '30px'
        }}
      >
        Enquire on WhatsApp
      </button>

      <h2>Subjects Offered:</h2>
      {course.subjects && course.subjects.length > 0 ? (
        course.subjects.map((subject: Subject, index: number) => (
          <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '15px', margin: '15px 0' }}>
            <h4>{subject.title}</h4>
            {subject.images && subject.images.length > 0 && (
              <Image 
                src={subject.images[0]} 
                alt={subject.title} 
                style={{ width: '100%', maxWidth:'300px', height: 'auto', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} 
              />
            )}
            <p>{subject.description}</p>
          </div>
        ))
      ) : (
        <p>No specific subjects listed for this course.</p>
      )}
    </div>
  );
};

export default CourseDetailPage; 