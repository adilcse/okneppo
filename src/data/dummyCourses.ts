import { Course } from '../types/course';

export const dummyCourses: Course[] = [
  {
    id: '1',
    title: 'Full-Stack Web Development Bootcamp',
    max_price: 20000,
    discounted_price: 15000,
    discount_percentage: 25,
    description: 'Become a job-ready full-stack developer. Learn to build robust web applications from scratch using modern technologies like React, Node.js, Express, and MongoDB.',
    images: ['/images/course1_hero.jpg', '/images/course1_detail.jpg'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subjects: [
      {
        id: '1',
        title: 'Module 1: Frontend with React',
        description: 'Dive deep into React, learning about components, state, props, hooks, and routing. Build interactive UIs and single-page applications.',
        images: ['/images/react_logo.png'],
        course_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Module 2: Backend with Node.js & Express',
        description: 'Master backend development with Node.js and Express. Learn to create RESTful APIs, handle databases, and manage authentication.',
        images: ['/images/nodejs_logo.png'],
        course_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Module 3: Databases with MongoDB',
        description: 'Understand NoSQL databases with MongoDB. Learn data modeling, querying, and aggregation.',
        images: ['/images/mongodb_logo.png'],
        course_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
    ],
  },
  {
    id: '2',
    title: 'Advanced Python Programming',
    max_price: 12000,
    discounted_price: 10000,
    discount_percentage: 16.67,
    description: 'Take your Python skills to the next level. Explore advanced topics like decorators, generators, metaclasses, asynchronous programming, and data science libraries.',
    images: ['/images/course2_hero.jpg'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subjects: [
      {
        id: '4',
        title: 'Advanced Python Concepts',
        description: 'Covering decorators, generators, context managers, and more.',
        images: ['/images/python_advanced.png'],
        course_id: '2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '5',
        title: 'Asynchronous Programming in Python',
        description: 'Learn asyncio, async/await, and building concurrent applications.',
        images: ['/images/python_async.png'],
        course_id: '2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '6',
        title: 'Introduction to Data Science with Python',
        description: 'Explore libraries like NumPy, Pandas, and Matplotlib for data analysis and visualization.',
        images: ['/images/python_datascience.png'],
        course_id: '2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
    ],
  },
  {
    id: '3',
    title: 'UI/UX Design Fundamentals',
    max_price: 8000,
    discounted_price: 7000,
    discount_percentage: 12.5,
    description: 'Learn the principles of user interface and user experience design. Create intuitive and visually appealing digital products. Understand user research, wireframing, prototyping, and usability testing.',
    images: ['/images/course3_hero.jpg', '/images/course3_detail.jpg'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subjects: [
      {
        id: '7',
        title: 'User Research & Personas',
        description: 'Understanding your users and their needs through effective research methods.',
        images: ['/images/uiux_research.png'],
        course_id: '3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '8',
        title: 'Wireframing & Prototyping',
        description: 'Creating low-fidelity and high-fidelity prototypes using tools like Figma.',
        images: ['/images/uiux_prototyping.png'],
        course_id: '3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '9',
        title: 'Visual Design Principles',
        description: 'Learning about color theory, typography, layout, and creating style guides.',
        images: ['/images/uiux_visual.png'],
        course_id: '3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
    ],
  },
]; 