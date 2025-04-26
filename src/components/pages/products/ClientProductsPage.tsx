"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, FilterData, mapProductFields, formatPrice } from '@/lib/types';

interface ClientProductsPageProps {
  initialProducts: Product[];
  initialFilterData?: FilterData;
}

export default function ClientProductsPage({ initialProducts, initialFilterData }: ClientProductsPageProps) {
  // Map initial products to ensure all fields are properly structured
  const mappedInitialProducts = Array.isArray(initialProducts) 
    ? initialProducts.map(mapProductFields) 
    : [];
  
  const [products, setProducts] = useState<Product[]>(mappedInitialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const filterData: FilterData = initialFilterData 
    ? { categories: ["All", ...initialFilterData.categories], priceRanges: initialFilterData.priceRanges } 
    : { categories: ["All"], priceRanges: [] };

  // Function to fetch products with filters
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add category filter
      if (selectedCategory !== "All") {
        params.append('category', selectedCategory);
      }
      
      // Add price range filter
      if (selectedPriceRange) {
        const priceRange = filterData.priceRanges.find(range => range.label === selectedPriceRange);
        if (priceRange) {
          params.append('minPrice', priceRange.min.toString());
          if (priceRange.max !== Infinity) {
            params.append('maxPrice', priceRange.max.toString());
          }
        }
      }
      
      // Add sorting
      if (sortOption !== "default") {
        const [field, direction] = sortOption.split('-');
        
        if (field === 'price') {
          params.append('sortBy', 'price');
          params.append('sortOrder', direction === 'high' ? 'desc' : 'asc');
        } else if (field === 'name') {
          params.append('sortBy', 'name');
          params.append('sortOrder', direction === 'z' ? 'desc' : 'asc');
        }
      }
      
      // Fetch filtered products
      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products (status: ${response.status})`);
      }
      
      const data = await response.json();
      const mappedProducts = Array.isArray(data) ? data.map(mapProductFields) : [];
      setProducts(mappedProducts);
    } catch (err) {
      console.error('Error fetching filtered products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedPriceRange, sortOption, filterData.priceRanges]);
  
  // Fetch products whenever filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceRange(null);
    setSortOption("default");
  };

  const handlePriceRangeChange = (range: string | null) => {
    setSelectedPriceRange(range === selectedPriceRange ? null : range);
  };

  return (
    <main className="flex-grow py-6 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Filters</h2>
          
          <div className="flex flex-wrap gap-6 mb-6">
            {/* Categories filter */}
            <div className="w-full sm:w-auto">
              <h3 className="text-sm font-medium mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {filterData.categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors
                      ${selectedCategory === category
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    disabled={isLoading}
                    aria-pressed={selectedCategory === category}
                    aria-label={`Filter by ${category}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range filter */}
            {filterData.priceRanges.length > 0 && (
              <div className="w-full sm:w-auto">
                <h3 className="text-sm font-medium mb-2">Price Range</h3>
                <div className="flex flex-wrap gap-2">
                  {filterData.priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => handlePriceRangeChange(range.label)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors
                        ${selectedPriceRange === range.label
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      disabled={isLoading}
                      aria-pressed={selectedPriceRange === range.label}
                      aria-label={`Filter by price range: ${range.label}`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort options */}
            <div className="ml-auto w-full sm:w-48">
              <h3 className="text-sm font-medium mb-2">Sort By</h3>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full border border-gray-300 rounded py-2 px-3 text-sm"
                disabled={isLoading}
                aria-label="Sort products by"
              >
                <option value="default">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-a">Name: A to Z</option>
                <option value="name-z">Name: Z to A</option>
              </select>
            </div>
          </div>
          
          {/* Applied filters */}
          {(selectedCategory !== "All" || selectedPriceRange !== null || sortOption !== "default") && (
            <div className="flex justify-between items-center border-t pt-4">
              <div className="text-sm flex flex-wrap gap-2">
                <span className="text-gray-500">Applied Filters: </span>
                
                {selectedCategory !== "All" && (
                  <button 
                    onClick={() => !isLoading && setSelectedCategory("All")}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs inline-flex items-center hover:bg-gray-200 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Category: {selectedCategory}
                    <span className="ml-1 font-medium hover:text-red-500" aria-label={`Remove ${selectedCategory} filter`}>×</span>
                  </button>
                )}
                
                {selectedPriceRange && (
                  <button 
                    onClick={() => !isLoading && setSelectedPriceRange(null)}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs inline-flex items-center hover:bg-gray-200 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Price: {selectedPriceRange}
                    <span className="ml-1 font-medium hover:text-red-500" aria-label={`Remove price range filter`}>×</span>
                  </button>
                )}
                
                {sortOption !== "default" && (
                  <button 
                    onClick={() => !isLoading && setSortOption("default")}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs inline-flex items-center hover:bg-gray-200 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Sort: {sortOption.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <span className="ml-1 font-medium hover:text-red-500" aria-label="Remove sort filter">×</span>
                  </button>
                )}
              </div>
              
              <button 
                onClick={resetFilters}
                className="text-sm text-gray-600 hover:text-black disabled:opacity-50"
                disabled={isLoading}
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-gray-300 border-r-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={fetchProducts} 
              className="ml-4 text-sm underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && !error && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {products.map((product) => (
              <Link href={`/products/${product.id}`} key={product.id} className="group">
                <div className="bg-gray-100 rounded-lg overflow-hidden h-52 sm:h-64 mb-3 relative">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-medium mb-1">{product.name}</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-2">{product.category}</p>
                <p className="font-bold text-lg sm:text-xl">{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        ) : !isLoading && !error ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">No products found matching your criteria.</p>
            <button 
              onClick={resetFilters}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              aria-label="Reset filters"
            >
              Clear Filters
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
} 