"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Image from 'next/image';
import { Product, mapProductFields } from '@/lib/types';

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
}

export default function EditProduct({params}: { params: Promise<{ id: string }> }) {
  // Store the ID in a ref to avoid direct params access
  const idRef = React.use(params);
  const id = idRef?.id;
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isNewCategory, setIsNewCategory] = useState(false);
  const router = useRouter();

  // Check authentication and load product data
  useEffect(() => {
    if (!id) {
      return;
    }
    const token = Cookies.get('admin-token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    // Load product data
    async function loadProduct() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to load product');
        }
        
        const productData = await response.json();
        const product: Product = mapProductFields(productData);
        
        // Set form data from product
        setFormData({
          name: product.name,
          price: product.price.toString(),
          category: product.category,
          description: product.description,
          images: product.images,
          details: product.details.length > 0 ? product.details : [''],
          careInstructions: product.careInstructions,
          deliveryTime: product.deliveryTime,
          featured: product.featured
        });
        
        setError(null);
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    
    // Load categories
    async function loadCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setAvailableCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }
    
    loadProduct();
    loadCategories();
  }, [router, id]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        // Update progress to 100%
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: 100
        }));
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const data = await response.json();
        
        // Add the uploaded image path to form data
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, data.filePath]
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
    if (formData.images.length <= 0) return;
    try {
      // Get the image URL that's being removed
      const imageUrl = formData.images[index];
      
      // Only attempt to delete from storage if it's a GCS URL
      if (imageUrl.includes('storage.googleapis.com')) {
        // Call the API to delete the image from GCS
        const response = await fetch('/api/delete-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookies.get('admin-token')}`
          },
          body: JSON.stringify({ imageUrl })
        });
        
        if (!response.ok) {
          console.error('Failed to delete image from storage:', await response.text());
          // Continue with UI removal even if storage deletion fails
        }
      }
    } catch (error) {
      console.error('Error while deleting image from storage:', error);
      // Continue with UI removal even if there's an error
    }
    
    // Remove the image from the form data regardless of whether storage deletion succeeded
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
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
    if (formData.details.length <= 1) return;
    const newDetails = formData.details.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, details: newDetails }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    // Validation
    if (!formData.name.trim() || !formData.price.trim() || !formData.category.trim()) {
      setError('Please fill in all required fields (name, price, category)');
      setIsSubmitting(false);
      return;
    }
    
    // Ensure at least one image
    if (formData.images.length === 0) {
      setError('Please upload at least one image');
      setIsSubmitting(false);
      return;
    }
    
    // Clean up empty fields and ensure optional fields are present
    const cleanedData = {
      ...formData,
      details: formData.details.filter(d => d.trim() !== ''),
      // Explicitly include these fields to ensure they're sent
      // Important: Convert undefined to empty string for consistent handling
      careInstructions: formData.careInstructions || '',
      deliveryTime: formData.deliveryTime || ''
    };
    
    // Debug log to see what's being sent
    console.log('Submitting product data:', JSON.stringify(cleanedData));
    
    try {
      // Use PUT request to update the product
      const response = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('admin-token')}`
        },
        body: JSON.stringify(cleanedData)
      });
      
      // No need to clone response since we're handling the response properly
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update product');
      }
      
      // Get the response data
      const responseData = await response.json().catch(error => {
        console.error('Error parsing JSON response:', error);
        return { success: true };
      });
      
      console.log('Update successful:', responseData);
      
      setSuccess(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/products');
      }, 2000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating product. Please try again.';
      setError(errorMessage);
      console.error('Update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-black text-white shadow-md">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <Link href="/admin/products" className="mr-6 hover:underline">
              ← Back to Products
            </Link>
            <h1 className="text-xl font-semibold">Edit Product</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-xl">Loading product data...</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-black text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/products" className="mr-6 hover:underline">
              ← Back to Products
            </Link>
            <h1 className="text-xl font-semibold">Edit Product</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">Product updated successfully! Redirecting...</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleTextChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                
                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <input
                    type="text"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleTextChange}
                    placeholder="₹5,999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  {isNewCategory ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleTextChange}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Enter new category"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsNewCategory(false)}
                        className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleTextChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {availableCategories.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
                      <option value="new">+ Add New Category</option>
                    </select>
                  )}
                </div>
                
                {/* Delivery Time */}
                <div>
                  <label htmlFor="deliveryTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Time
                  </label>
                  <input
                    type="text"
                    id="deliveryTime"
                    name="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={handleTextChange}
                    placeholder="7-10 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Product Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleTextChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>
            
            {/* Product Images */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4">Product Images *</h2>
              
              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (First image will be the main product image)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  multiple
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={uploadingImage}
                />
                
                {/* Upload Progress */}
                {Object.keys(uploadProgress).length > 0 && (
                  <div className="mt-2">
                    {Object.entries(uploadProgress).map(([key, progress]) => (
                      <div key={key} className="mb-1">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {formData.images.map((src, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                        <Image
                          src={src}
                          alt={`Product image ${index + 1}`}
                          width={150}
                          height={150}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      {index === 0 && (
                        <span className="absolute top-1 left-1 bg-black text-white text-xs px-2 py-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Details */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4">Product Details</h2>
              
              {formData.details.map((detail, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={detail}
                    onChange={(e) => handleDetailChange(index, e.target.value)}
                    placeholder={`Detail ${index + 1}`}
                    className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeDetailField(index)}
                    className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md text-sm"
                    disabled={formData.details.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addDetailField}
                className="mt-2 text-emerald-600 hover:text-emerald-800 text-sm font-medium"
              >
                + Add Another Detail
              </button>
            </div>
            
            {/* Care Instructions */}
            <div className="mb-6">
              <label htmlFor="careInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                Care Instructions
              </label>
              <textarea
                id="careInstructions"
                name="careInstructions"
                value={formData.careInstructions}
                onChange={handleTextChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              ></textarea>
            </div>
            
            {/* Featured Product */}
            <div className="mb-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                  Feature this product on homepage
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Featured products will be displayed in the showcase section on the home page
              </p>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Link
                href="/admin/products"
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:bg-emerald-300"
                disabled={isSubmitting || uploadingImage}
              >
                {isSubmitting ? 'Updating...' : 'Update Product'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 