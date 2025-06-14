"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import ProductForm, { ProductFormData } from '@/components/admin/ProductForm';
import axios from 'axios';

// API functions
const createProduct = async (data: ProductFormData) => {
  try {
    const response = await axiosClient.post('/api/products', data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to create product');
    }
    throw error;
  }
};

export default function NewProduct() {
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  const initialFormData: ProductFormData = {
    name: '',
    price: '',
    category: '',
    description: '',
    images: [],
    details: [''],
    careInstructions: '',
    deliveryTime: '',
    featured: false
  };

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (variables.createNew) {
        // Reset form data
        setError(null);
      } else {
        router.push('/admin/products');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleSubmit = async (data: ProductFormData) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (axios.isAxiosError(err)) {
        console.error(err);
        setError(err?.response?.data?.message || err?.response?.data?.error || 'An unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">New Product</h1>
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Back to Products
          </Link>
        </div>

        <ProductForm
          initialData={initialFormData}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending}
          error={error}
          submitButtonText="Create Product"
          showCreateNewButton={true}
        />
      </div>
    </div>
  );
} 