import { useQuery } from '@tanstack/react-query';
import { Product } from '@/lib/types';
import axiosClient from '@/lib/axios';
import { AxiosError } from 'axios';

/**
 * Fetches a product by its ID
 * @param id Product ID
 */
async function fetchProduct(id: string | number): Promise<Product> {
  try {
    const response = await axiosClient.get(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || `Failed to fetch product with ID: ${id}`);
  }
}

/**
 * Custom hook for fetching a single product using React Query
 * @param id Product ID
 */
export function useProduct(id: string | number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetches related products by category
 * @param category Product category
 * @param currentProductId ID of current product to exclude from results
 * @param limit Number of products to return
 */
async function fetchRelatedProducts(category: string, currentProductId: string | number, limit: number = 3): Promise<Product[]> {
  try {
    const response = await axiosClient.get('/api/products', {
      params: {
        limit: limit + 1,
        category
      }
    });
    
    // Filter out the current product and limit results
    return (response.data?.products || [])
      .filter((product: Product) => product.id !== Number(currentProductId))
      .slice(0, limit);
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || `Failed to fetch related products for category: ${category}`);
  }
}

/**
 * Custom hook for fetching related products using React Query
 * @param category Product category
 * @param currentProductId ID of current product to exclude
 * @param limit Number of products to return
 */
export function useRelatedProducts(category: string | undefined, currentProductId: string | number, limit: number = 3) {
  return useQuery({
    queryKey: ['relatedProducts', category, currentProductId, limit],
    queryFn: () => {
      if (!category) return Promise.resolve([]);
      return fetchRelatedProducts(category, currentProductId, limit);
    },
    enabled: !!category, // Only run the query if category is provided
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
} 