import { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/api';
import axiosClient from '@/lib/axios';
import { Course } from '@/types/course';

async function getAllCourses(): Promise<Course[]> {
  try {
    const response = await axiosClient.get('/api/courses?limit=100');
    return response.data.courses || [];
  } catch (error) {
    console.error('Error fetching courses for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all products and courses for the sitemap
  const [products, courses] = await Promise.all([
    getAllProducts(),
    getAllCourses()
  ]);
  
  // Base URL for the site
  const baseUrl = 'https://okneppo.in';
  
  // Generate product URLs
  const productUrls = products?.products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) || [];
  
  // Generate course URLs
  const courseUrls = courses.map((course) => ({
    url: `${baseUrl}/courses/${course.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));
  
  // Static routes with priorities
  const routes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/products', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/courses', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/register', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/gallery', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/cancellation-refund', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: '/shipping-delivery', priority: 0.3, changeFrequency: 'yearly' as const },
  ].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  
  return [...routes, ...productUrls, ...courseUrls];
} 