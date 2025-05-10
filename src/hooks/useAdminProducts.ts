import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '@/lib/types';
import axiosClient from '@/lib/axios';
import { AxiosError } from 'axios';

interface AdminProductsResponse {
  products: Product[];
  pagination?: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

interface AdminProductsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ImageDeletionSummary {
  totalImages: number;
  deletedImages: number;
  failedImages: number;
}

interface DeleteProductResponse {
  success: boolean;
  imagesDeletionSummary?: ImageDeletionSummary;
}

/**
 * Fetches products for the admin area with pagination
 */
async function fetchAdminProducts(params: AdminProductsQueryParams = {}): Promise<AdminProductsResponse> {
  try {
    const response = await axiosClient.get('/api/products', { params });
    
    return {
      products: response.data.products || [],
      pagination: response.data.pagination
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || 'Failed to fetch admin products');
  }
}

/**
 * Custom hook for fetching admin products with React Query
 */
export function useAdminProducts(params: AdminProductsQueryParams = {}) {
  return useQuery({
    queryKey: ['adminProducts', params],
    queryFn: () => fetchAdminProducts(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

/**
 * Deletes a product by ID
 */
async function deleteProduct(id: number): Promise<DeleteProductResponse> {
  try {
    const response = await axiosClient.delete(`/api/products/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    throw new Error(axiosError.message || `Failed to delete product with ID: ${id}`);
  }
}

/**
 * Custom hook for deleting a product using React Query mutation
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate and refetch all admin products queries
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
} 