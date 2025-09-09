import { Course } from '@/types/course';

interface CourseJsonLdProps {
  course: Course;
}

export default function CourseJsonLd({ course }: CourseJsonLdProps) {
  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": course.description,
    "provider": {
      "@type": "Organization",
      "name": "Ok Neppo",
      "url": "https://okneppo.in",
      "logo": "https://okneppo.in/images/OkneppoLogo.jpeg",
      "sameAs": [
        "https://www.instagram.com/okneppo",
        "https://www.facebook.com/okneppo"
      ]
    },
    "instructor": {
      "@type": "Person",
      "name": "Nishad Fatma",
      "jobTitle": "Fashion Designer",
      "worksFor": {
        "@type": "Organization",
        "name": "Ok Neppo"
      }
    },
    "courseMode": course.is_online_course ? "online" : "blended",
    "educationalLevel": "beginner",
    "teaches": [
      "Fashion Design",
      "Design Techniques",
      "Creative Skills",
      "Industry Knowledge"
    ],
    "about": [
      {
        "@type": "Thing",
        "name": "Fashion Design"
      },
      {
        "@type": "Thing", 
        "name": "Creative Arts"
      }
    ],
    "offers": {
      "@type": "Offer",
      "price": course.discounted_price || course.max_price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "validFrom": new Date().toISOString(),
      "url": `https://okneppo.in/courses/${course.id}`
    },
    "image": course.images && course.images.length > 0 ? course.images[0] : "https://okneppo.in/images/og-image.jpg",
    "url": `https://okneppo.in/courses/${course.id}`,
    "dateCreated": course.created_at,
    "dateModified": course.updated_at || course.created_at,
    "inLanguage": "en",
    "isAccessibleForFree": false,
    "coursePrerequisites": "No prior experience required",
    "syllabusSections": course.subjects?.map(subject => ({
      "@type": "Syllabus",
      "name": subject.title,
      "description": subject.description
    })) || []
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
    />
  );
}
