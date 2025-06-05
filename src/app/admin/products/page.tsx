"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';
import ListingPage from '@/components/admin/ListingPage';
import { Button } from '@/components/common';
import { Product } from '@/models/Product';
import { GetProductsRequest, GetProductsResponse } from '@/types/api';
import { DataGrid, Column } from '@/components/admin/DataGrid';
import Image from 'next/image';
import axiosClient from '@/lib/axios';
import { useDebouncedState } from '@/lib/clientUtils';

// API function
const fetchProducts = async (params: GetProductsRequest): Promise<GetProductsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.category) queryParams.append('category', params.category);
  if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const response = await axiosClient.get(`/api/products?${queryParams.toString()}`);
  return response.data;
};

// Delete product mutation
const deleteProduct = async (id: string) => {
  const response = await axiosClient.delete(`/api/products/${id}`);
  return response.data;
};

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [, setSearchQuery, debouncedSearchQuery] = useDebouncedState('', 1000);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, searchQuery: debouncedSearchQuery, sortBy, sortOrder }],
    queryFn: () => fetchProducts({
      page,
      limit: 10,
      search: debouncedSearchQuery,
      sortBy,
      sortOrder
    })
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate products query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });

  const handleSort = (field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (product) => (
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <Image
              className="h-10 w-10 rounded-lg object-cover"
              src={product.images[0]}
              alt={product.name}
              width={40}
              height={40}
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {product.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {product.description?.length > 50 
                ? `${product.description.substring(0, 50)}...` 
                : product.description}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (product) => (
        <div className="text-sm text-gray-900 dark:text-white">
          ₹{product.price}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (product) => (
        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {product.category}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (product) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/products/${product.id}`)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <FiEye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/products/edit/${product.id}`)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <FiEdit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(product.id.toString())}
            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
            disabled={deleteMutation.isPending}
          >
            <FiTrash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <ListingPage
      title="Products"
      description="Manage your product inventory and listings"
      addButtonText="Add Product"
      onAddClick={() => router.push('/admin/products/new')}
      searchPlaceholder="Search products..."
      onSearch={setSearchQuery}
    >
      <DataGrid
        columns={columns}
        data={data?.products || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        emptyMessage="No products found"
      />
    </ListingPage>
  );
} 