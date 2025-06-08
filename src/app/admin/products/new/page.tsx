"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiUpload, FiX } from 'react-icons/fi';
import { Button, Input, Textarea } from '@/components/common';
import GenerateFromImageButton from '@/components/admin/GenerateFromImageButton';
import JsonFormFiller, { ProductFormData as JsonProductFormData } from '@/components/admin/JsonFormFiller';
import axiosClient from '@/lib/axios';
import { removeImageFromUrl } from '@/lib/clientUtils';

interface ProductFormData {
  name: string;
  price: string;
  category: string;
  description: string;
  images: string[];
  details: string[];
  careInstructions: string;
  deliveryTime: string;
  featured: boolean;
  createNew?: boolean;
}

interface GeneratedProductData {
  name: string;
  price: number;
  category: string;
  description: string;
  details: string[];
  careInstructions: string;
  deliveryTime: string;
}

// API functions
const createProduct = async (data: ProductFormData) => {
  const response = await axiosClient.post('/api/products', data);
  return response.data;
};

export default function NewProduct() {
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

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isNewCategory, setIsNewCategory] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await axiosClient.get('/api/categories');
        setAvailableCategories(response.data.categories || []);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    
    loadCategories();
  }, []);

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (variables.createNew) {
        // Reset form data
        setFormData({
          ...initialFormData,
          category: formData.category, // Keep the same category for convenience
        });
        setError(null);
      } else {
        router.push('/admin/products');
      }
    },
    onError: (error: Error) => {
      setError(error.message);
    }
  });

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'category' && value === 'new') {
      setIsNewCategory(true);
      setFormData(prev => ({ ...prev, category: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleDetailChange = (index: number, value: string) => {
    const newDetails = [...formData.details];
    newDetails[index] = value;
    setFormData(prev => ({ ...prev, details: newDetails }));
  };

  const addDetailField = () => {
    setFormData(prev => ({ ...prev, details: [...prev.details, ''] }));
  };

  const removeDetailField = (index: number) => {
    const newDetails = formData.details.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, details: newDetails }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadingImage(true);
    setError(null);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `upload-${Date.now()}-${i}`;
      
      // Create an entry in the progress tracker
      setUploadProgress(prev => ({
        ...prev,
        [fileId]: 0
      }));
      
      // Create FormData object
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        // Upload the file
        const response = await axiosClient.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        // Update progress to 100%
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: 100
        }));
        
        // Add the uploaded image path to form data
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, response.data.filePath]
        }));
        
        // Remove from progress tracker after 1 second
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = {...prev};
            delete newProgress[fileId];
            return newProgress;
          });
        }, 1000);
        
      } catch (err) {
        console.error('Upload error:', err);
        setError(`Failed to upload ${file.name}. Please try again.`);
        
        // Remove from progress tracker
        setUploadProgress(prev => {
          const newProgress = {...prev};
          delete newProgress[fileId];
          return newProgress;
        });
      }
    }
    
    setUploadingImage(false);
    
    // Reset the file input
    e.target.value = '';
  };

  const removeImage = async (index: number) => {
    const imageUrl = formData.images[index];
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
    const success = await removeImageFromUrl(imageUrl);
    if (!success) {
      setFormData(prev => ({ ...prev, images: [...prev.images, imageUrl] }));
    }
  };

  const handleSubmit = async (e: FormEvent, createNew: boolean = false) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.name.trim() || !formData.price.trim() || !formData.category.trim()) {
      setError('Please fill in all required fields (name, price, category)');
      return;
    }
    
    // Ensure at least one image
    if (formData.images.length === 0) {
      setError('Please upload at least one image');
      return;
    }
    
    // Clean up empty fields
    const cleanedData = {
      ...formData,
      details: formData.details.filter(d => d.trim() !== ''),
      createNew
    };
    
    createMutation.mutate(cleanedData);
  };

  const handleGenerateSuccess = (generatedData: GeneratedProductData) => {
    // Update form data with generated content while keeping existing values
    setFormData(prev => ({
      name: prev.name || generatedData.name,
      price: prev.price || generatedData.price.toString(),
      category: prev.category || generatedData.category,
      description: prev.description || generatedData.description,
      images: prev.images, // Keep existing images
      details: prev.details.length === 1 && !prev.details[0] 
        ? generatedData.details 
        : prev.details,
      careInstructions: prev.careInstructions || generatedData.careInstructions,
      deliveryTime: prev.deliveryTime || generatedData.deliveryTime,
      featured: prev.featured
    }));
  };

  const handleFillFromJson = (jsonData: JsonProductFormData) => {
    setFormData(prev => ({
      name: jsonData.name || prev.name,
      price: jsonData.price || prev.price,
      category: jsonData.category || prev.category,
      description: jsonData.description || prev.description,
      images: prev.images, // Always keep existing images
      details: jsonData.details || prev.details,
      careInstructions: jsonData.careInstructions || prev.careInstructions,
      deliveryTime: jsonData.deliveryTime || prev.deliveryTime,
      featured: typeof jsonData.featured !== 'undefined' ? jsonData.featured : prev.featured
    }));
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Add JSON Form Filler Component */}
          <JsonFormFiller onFillForm={handleFillFromJson} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Product Name *
              </label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleTextChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Price *
              </label>
              <Input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleTextChange}
                placeholder="₹12,500"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category *
              </label>
              {!isNewCategory ? (
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleTextChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  required
                >
                  <option value="">Select a category</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new">+ Add New Category</option>
                </select>
              ) : (
                <div className="flex">
                  <Input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleTextChange}
                    placeholder="Enter new category"
                    className="flex-1 mt-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsNewCategory(false)}
                    className="mt-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-r hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Delivery Time */}
            <div>
              <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Delivery Time
              </label>
              <Input
                type="text"
                id="deliveryTime"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleTextChange}
                placeholder="1-2 weeks"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleTextChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
              rows={4}
            />
          </div>

          {/* Care Instructions */}
          <div>
            <label htmlFor="careInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Care Instructions
            </label>
            <Textarea
              id="careInstructions"
              name="careInstructions"
              rows={2}
              value={formData.careInstructions}
              onChange={handleTextChange}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Featured Product */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Feature this product on homepage
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Featured products will be displayed in the showcase section on the home page
            </p>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Images *
            </label>
            
            {/* Generate from Image Button */}
            {formData.images.length > 0 && (
              <div className="mb-4">
                <GenerateFromImageButton 
                  images={formData.images}
                  onSuccess={handleGenerateSuccess}
                  disabled={uploadingImage}
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative">
                  <Image
                    src={image}
                    alt={`Product image ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-100 transition-opacity z-1"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FiUpload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      Uploading...
                    </p>
                    <div className="w-full px-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <label className="relative p-4 flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FiUpload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </label>
            </div>
          </div>

          {/* Product Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Product Details
            </label>
            {formData.details.map((detail, index) => (
              <div key={index} className="flex mb-2">
                <Input
                  type="text"
                  value={detail}
                  onChange={(e) => handleDetailChange(index, e.target.value)}
                  placeholder="Product detail or feature"
                  className="flex-grow mt-1 block w-full rounded-l-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => removeDetailField(index)}
                  className="mt-1 px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 transition-colors rounded-r"
                >
                  −
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDetailField}
              className="mt-2 px-4 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              + Add Detail
            </button>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSubmit(e as unknown as FormEvent, true)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save & Create New'}
            </Button>
            <Button
              type="submit"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleSubmit(e as unknown as FormEvent, false)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 