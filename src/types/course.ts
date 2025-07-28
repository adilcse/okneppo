export interface Subject {
  id: string;
  title: string;
  description: string;
  images?: string[]; // Optional array of image URLs or paths
  created_at: string;
  updated_at: string;
  courses?: Course[]; // Optional array of associated courses
}

export interface Course {
  id: number; // Unique identifier for the course
  title: string;
  max_price: string;
  discounted_price: string;
  discount_percentage: string;
  description: string;
  images: string[]; // Array of image URLs or paths
  created_at: string;
  updated_at: string;
  subjects?: Subject[]; // Optional array of associated subjects
} 