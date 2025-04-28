"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import { Product, FilterData, mapProductFields } from '@/lib/types';
import { PaginationInfo } from '@/lib/api';
import { Suspense } from 'react';

interface ClientProductsPageProps {
  initialProducts: Product[];
  initialFilterData?: FilterData;
  initialPagination?: PaginationInfo;
}

export default function ClientProductsPage({ 
  initialProducts, 
  initialFilterData,
  initialPagination
}: ClientProductsPageProps) {
  return (
    <Suspense fallback={<ProductsPageLoading />}>
      <ClientProductsPageContent {...{ initialProducts, initialFilterData, initialPagination }} />
    </Suspense>
  );
}

function ProductsPageLoading() {
  return (
    <div className="w-full py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-gray-300 dark:border-gray-700 border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientProductsPageContent({ 
  initialProducts, 
  initialFilterData,
  initialPagination
}: ClientProductsPageProps) {
  const searchParams = useSearchParams();
  
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
  const [pagination, setPagination] = useState<PaginationInfo>(
    initialPagination || {
      page: 1,
      limit: 9,
      totalCount: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false
    }
  );
  
  const filterData: FilterData = initialFilterData 
    ? { categories: ["All", ...initialFilterData.categories], priceRanges: initialFilterData.priceRanges } 
    : { categories: ["All"], priceRanges: [] };

  // Get the current page from URL params or use default
  const getCurrentPage = useCallback(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam) : 1;
  }, [searchParams]);

  // Function to update URL with new params without full page reload
  const updateUrlParams = useCallback((params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    
    // Update URL without triggering navigation
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  }, [searchParams]);

  // Function to fetch products with filters and pagination
  const fetchProducts = useCallback(async (page?: number) => {
    setIsLoading(true);
    setError(null);
    
    const currentPage = page || getCurrentPage();
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add pagination
      params.append('page', currentPage.toString());
      params.append('limit', pagination.limit.toString());
      
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
      
      // Update browser URL with the new parameters
      if (currentPage !== 1) {
        params.set('page', currentPage.toString());
      } else {
        params.delete('page');
      }
      updateUrlParams({ page: currentPage === 1 ? '' : currentPage.toString() });
      
      // Fetch filtered products
      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products (status: ${response.status})`);
      }
      
      const data = await response.json();
      setProducts(data.products.map(mapProductFields));
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching filtered products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedPriceRange, sortOption, filterData.priceRanges, pagination.limit, getCurrentPage, updateUrlParams]);
  
  // Fetch products whenever filters change
  useEffect(() => {
    fetchProducts(1); // Reset to page 1 when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedPriceRange, sortOption]);
  
  // Fetch products when page changes in URL
  useEffect(() => {
    const page = getCurrentPage();
    if (page !== pagination.page && !isLoading) {
      fetchProducts(page);
    }
  }, [searchParams, getCurrentPage, pagination.page, isLoading, fetchProducts]);
  
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceRange(null);
    setSortOption("default");
  };

  const handlePriceRangeChange = (range: string | null) => {
    setSelectedPriceRange(range === selectedPriceRange ? null : range);
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    if (newPage !== pagination.page) {
      fetchProducts(newPage);
    }
  };

  // Generate pagination links
  const getPaginationLinks = () => {
    const { page, totalPages } = pagination;
    const links = [];
    
    // Previous button
    links.push(
      <button
        key="prev"
        onClick={() => handlePageChange(page - 1)}
        disabled={!pagination.hasPrevPage || isLoading}
        className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
    
    // Determine which page links to show
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      links.push(
        <button
          key="1"
          onClick={() => handlePageChange(1)}
          className={`px-3 py-1 rounded-md border text-sm ${page === 1 ? 'bg-black text-white border-black dark:bg-primary dark:border-primary' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
          disabled={isLoading}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        links.push(
          <span key="ellipsis1" className="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
        );
      }
    }
    
    // Add page links
    for (let i = startPage; i <= endPage; i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last pages as they're added separately
      
      links.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md border text-sm ${page === i ? 'bg-black text-white border-black dark:bg-primary dark:border-primary' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
          disabled={isLoading}
        >
          {i}
        </button>
      );
    }
    
    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        links.push(
          <span key="ellipsis2" className="px-2 py-1 text-gray-500 dark:text-gray-400">...</span>
        );
      }
      
      links.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 rounded-md border text-sm ${page === totalPages ? 'bg-black text-white border-black dark:bg-primary dark:border-primary' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}`}
          disabled={isLoading}
        >
          {totalPages}
        </button>
      );
    }
    
    // Next button
    links.push(
      <button
        key="next"
        onClick={() => handlePageChange(page + 1)}
        disabled={!pagination.hasNextPage || isLoading}
        className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    );
    
    return links;
  };

  return (
    <main className="flex-grow py-6 sm:py-8 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-700">
          <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Filters</h2>
          <div className="flex row">
          <div className="flex flex-wrap gap-6 mb-6">
            {/* Categories filter */}
            <div className="w-full sm:w-auto">
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {filterData.categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors
                      ${selectedCategory === category
                        ? 'bg-black dark:bg-primary text-white border-black dark:border-primary'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
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
                <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Price Range</h3>
                <div className="flex flex-wrap gap-2">
                  {filterData.priceRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => handlePriceRangeChange(range.label)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors
                        ${selectedPriceRange === range.label
                          ? 'bg-black dark:bg-primary text-white border-black dark:border-primary'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
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

          </div>

            {/* Sort options */}
            <div className="ml-auto w-full sm:w-48">
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Sort By</h3>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded py-2 px-3 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
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
            <div className="flex justify-between items-center border-t dark:border-gray-700 pt-4">
              <div className="text-sm flex flex-wrap gap-2">
                <span className="text-gray-500 dark:text-gray-400">Applied Filters: </span>
                
                {selectedCategory !== "All" && (
                  <button 
                    onClick={() => !isLoading && setSelectedCategory("All")}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs inline-flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Category: {selectedCategory}
                    <span className="ml-1 font-medium hover:text-red-500" aria-label={`Remove ${selectedCategory} filter`}>×</span>
                  </button>
                )}
                
                {selectedPriceRange && (
                  <button 
                    onClick={() => !isLoading && setSelectedPriceRange(null)}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs inline-flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Price: {selectedPriceRange}
                    <span className="ml-1 font-medium hover:text-red-500" aria-label={`Remove price range filter`}>×</span>
                  </button>
                )}
                
                {sortOption !== "default" && (
                  <button 
                    onClick={() => !isLoading && setSortOption("default")}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs inline-flex items-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Sort: {sortOption.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <span className="ml-1 font-medium hover:text-red-500" aria-label="Remove sort filter">×</span>
                  </button>
                )}
              </div>
              
              <button 
                onClick={resetFilters}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-50"
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
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-gray-300 dark:border-gray-700 border-r-transparent" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={() => fetchProducts()}
              className="ml-4 text-sm underline"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Product grid */}
        {!isLoading && !error && products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.images?.[0] || ''}
                  category={product.category}
                />
              ))}
            </div>
            
            {/* Pagination controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-2">
                {getPaginationLinks()}
              </div>
            )}
            
            {/* Products count */}
            <div className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              Showing {products.length} of {pagination.totalCount} products
            </div>
          </>
        ) : !isLoading && !error ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No products found matching your criteria.</p>
            <button 
              onClick={resetFilters}
              className="px-4 py-2 bg-black dark:bg-primary text-white rounded hover:bg-gray-800 dark:hover:bg-primary-dark transition-colors"
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