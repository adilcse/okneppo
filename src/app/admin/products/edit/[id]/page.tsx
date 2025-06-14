"use client";

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';

// API functions
const fetchProduct = async (id: string) => {
  const response = await axiosClient.get(`/api/products/${id}`);
  return response.data;
};

const updateProduct = async ({ id, data }: { id: string; data: ProductFormData }) => {
  if (data.createNew !== undefined) {
    delete data.createNew;
  }
  const response = await axiosClient.put(`/api/products/${id}`, data);
  return response.data;
};

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch product query
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
  });

  // Update product mutation
  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      router.push('/admin/products');
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await updateMutation.mutateAsync({ id, data });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <Link
              href="/admin/products"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Back to Products
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-red-500">Product not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Transform product data to match ProductFormData format
  const initialFormData: ProductFormData = {
    name: productData.name,
    price: productData.price.toString(),
    category: productData.category,
    description: productData.description || '',
    images: productData.images || [],
    details: productData.details || [''],
    careInstructions: productData.careInstructions || '',
    deliveryTime: productData.deliveryTime || '',
    featured: productData.featured || false
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Products
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <ProductForm
          initialData={initialFormData}
          onSubmit={handleSubmit}
          isSubmitting={updateMutation.isPending}
          error={error}
          submitButtonText="Save Changes"
        />
      </div>
    </div>
  );
} 