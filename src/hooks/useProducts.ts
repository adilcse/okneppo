import { useQuery } from '@tanstack/react-query';
import { Product } from '@/lib/types';
import axiosClient from '@/lib/axios';
import { AxiosError } from 'axios';

interface ProductsResponse {
  products: Product[];
  pagination?: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

interface ProductsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
  all?: boolean;
  search?: string;
}

/**
 * Fetches products with optional filtering and pagination
 */
async function fetchProducts(params: ProductsQueryParams = {}): Promise<ProductsResponse> {
  try {
    const response = await axiosClient.get('/api/products', { params });
    
    return {
      products: response.data.products || [],
      pagination: response.data.pagination
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || 'Failed to fetch products');
  }
}

/**
 * Custom hook for fetching products with React Query
 */
export function useProducts(params: ProductsQueryParams = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetches featured products for homepage
 */
async function fetchFeaturedProducts(limit: number = 3): Promise<Product[]> {
  try {
    const response = await axiosClient.get('/api/featured-products', {
      params: { limit }
    });
    
    return response.data.products || [];
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || 'Failed to fetch featured products');
  }
}

/**
 * Custom hook for fetching featured products using React Query
 */
export function useFeaturedProducts(limit: number = 3) {
  return useQuery({
    queryKey: ['featuredProducts', limit],
    queryFn: () => fetchFeaturedProducts(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
} 