import { MetadataRoute } from 'next';
import { getAllProducts } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get all products for the sitemap
  const products = await getAllProducts();
  
  // Base URL for the site
  const baseUrl = 'https://okneppo.com';
  
  // Generate product URLs
  const productUrls = products.map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  // Static routes
  const routes = [
    '',
    '/products',
    '/about',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));
  
  return [...routes, ...productUrls];
} 