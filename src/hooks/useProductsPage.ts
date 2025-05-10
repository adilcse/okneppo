import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { AxiosError } from 'axios';
import { Product } from '@/lib/types';

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface FilterData {
  categories: string[];
  priceRanges: { min: number; max: number; label: string }[];
}

interface ProductsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface InputParams {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

interface ProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

/**
 * Fetches products with optional filters and pagination
 */
async function fetchProductsWithParams(params: ProductsQueryParams = {}): Promise<ProductsResponse> {
  try {
    const response = await axiosClient.get('/api/products', { params });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || 'Failed to fetch products');
  }
}

/**
 * Fetches available product filters (categories and price ranges)
 */
async function fetchProductFilters(): Promise<FilterData> {
  try {
    const response = await axiosClient.get('/api/product-filters');
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || 'Failed to fetch product filters');
  }
}

/**
 * Custom hook for product filtering and pagination with React Query
 */
export function useProductsPage(params: ProductsQueryParams = {}) {
  // Query for products with filters
  const productsQuery = useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProductsWithParams(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  // Query for filters (categories, price ranges)
  const filtersQuery = useQuery({
    queryKey: ['productFilters'],
    queryFn: fetchProductFilters,
    staleTime: 60 * 60 * 1000, // 1 hour - filters don't change often
    retry: 1,
    refetchOnWindowFocus: false,
  });
  
  return {
    products: productsQuery.data?.products || [],
    pagination: productsQuery.data?.pagination,
    filterData: filtersQuery.data,
    isLoading: productsQuery.isLoading || filtersQuery.isLoading,
    error: productsQuery.error || filtersQuery.error,
    refetch: productsQuery.refetch
  };
} 