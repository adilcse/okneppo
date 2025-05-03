"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import Image from 'next/image';
import GenerateFromImageButton from '@/components/admin/GenerateFromImageButton';

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

interface GeneratedProductData {
  name: string;
  price: number;
  category: string;
  description: string;
  details: string[];
  careInstructions: string;
  deliveryTime: string;
}

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isNewCategory, setIsNewCategory] = useState(false);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const token = Cookies.get('admin-token');
    if (!token) {
      router.push('/admin/login');
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
    
    loadCategories();
  }, [router]);

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

  const removeImage = (index: number) => {
    if (formData.images.length <= 0) return;
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
    
    // Clean up empty fields
    const cleanedData = {
      ...formData,
      details: formData.details.filter(d => d.trim() !== '')
    };
    
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('admin-token')}`
        },
        body: JSON.stringify(cleanedData)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }
      
      setSuccess(true);
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/products');
      }, 2000);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error creating product. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
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
        ? generatedData.details // Replace empty details
        : prev.details, // Keep existing details
      careInstructions: prev.careInstructions || generatedData.careInstructions,
      deliveryTime: prev.deliveryTime || generatedData.deliveryTime,
      featured: prev.featured
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Admin Header */}
      <header className="bg-black text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin/products" className="mr-6 hover:underline">
              ← Back to Products
            </Link>
            <h1 className="text-xl font-semibold">Add New Product</h1>
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
            <span className="block sm:inline">Product created successfully! Redirecting...</span>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleTextChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleTextChange}
                  placeholder="₹12,500"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
              
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                {!isNewCategory ? (
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleTextChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleTextChange}
                      placeholder="Enter new category"
                      className="flex-1 p-2 border border-gray-300 rounded-l focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => 
                        (false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
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
                  placeholder="1-2 weeks"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleTextChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            
            {/* Care Instructions */}
            <div className="mb-6">
              <label htmlFor="careInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                Care Instructions
              </label>
              <textarea
                id="careInstructions"
                name="careInstructions"
                rows={2}
                value={formData.careInstructions}
                onChange={handleTextChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
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
            
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images <span className="text-red-500">*</span>
              </label>
              
              {/* Upload Button */}
              <div className="mb-4">
                <label className="inline-block px-4 py-2 bg-emerald-600 text-white rounded cursor-pointer hover:bg-emerald-700 transition-colors">
                  <span>Upload Images</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleFileUpload}
                    className="hidden" 
                    disabled={uploadingImage}
                  />
                </label>
                <span className="ml-3 text-sm text-gray-500">
                  Upload one or multiple product images
                </span>
              </div>
              
              {/* Upload Progress */}
              {Object.keys(uploadProgress).length > 0 && (
                <div className="mb-4">
                  {Object.entries(uploadProgress).map(([id, progress]) => (
                    <div key={id} className="mb-2">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-300" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Uploading... {progress}%</p>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Uploaded Images */}
              {formData.images.length > 0 && (
                <>
                  <div className="mb-4">
                    <GenerateFromImageButton 
                      images={formData.images}
                      onSuccess={handleGenerateSuccess}
                      disabled={uploadingImage}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square relative border border-gray-200 rounded overflow-hidden">
                          <Image 
                            src={image} 
                            alt={`Product image ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {formData.images.length === 0 && !uploadingImage && (
                <p className="text-sm text-gray-500 italic">No images uploaded yet</p>
              )}
            </div>
            
            {/* Product Details */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Details
              </label>
              {formData.details.map((detail, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={detail}
                    onChange={(e) => handleDetailChange(index, e.target.value)}
                    placeholder="Product detail or feature"
                    className="flex-grow p-2 border border-gray-300 rounded-l focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeDetailField(index)}
                    className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
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
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <Link
                href="/admin/products"
                className="px-6 py-2 mr-4 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors disabled:opacity-70"
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 