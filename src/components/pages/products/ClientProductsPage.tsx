"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ui/ProductCard';
import { Product } from '@/lib/types';
import { Suspense } from 'react';
import { useProductsPage, FilterData, PaginationInfo, InputParams } from '@/hooks/useProductsPage';
import Input from '@/components/common/Input';
import { mapProductFields } from '@/lib/utils';

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
  const router = useRouter();
  
  // Map initial products to ensure all fields are properly structured
  const mappedInitialProducts = Array.isArray(initialProducts) 
    ? initialProducts.map(mapProductFields) 
    : [];
  
  // States for filter and sort options
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<string>("default");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [filterData, setFilterData] = useState<FilterData>(initialFilterData || { categories: ["All"], priceRanges: [] });
  
  // Initialize search from URL params
  useEffect(() => {
    const query = searchParams?.get('search');
    if (query) {
      setSearchQuery(query);
      setDebouncedSearchQuery(query);
    }
  }, [searchParams]);
  
  // Effect to debounce the search query updates
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout to update the debounced value
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce delay
    
    // Cleanup on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);
  
  // When debounced search query changes, update URL params
  useEffect(() => {
    if (debouncedSearchQuery !== searchParams?.get('search')) {
      if (debouncedSearchQuery) {
        updateUrlParams({ search: debouncedSearchQuery, page: '' });
      }
    }
  }, [debouncedSearchQuery]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Get the current page from URL params or use default
  const getCurrentPage = useCallback(() => {
    const pageParam = searchParams?.get('page');
    return pageParam ? parseInt(pageParam) : 1;
  }, [searchParams]);
  
  // Compute query parameters based on filters
  const getQueryParams = useCallback(() => {
    const currentPage = getCurrentPage();
    const params: InputParams = {
      page: currentPage,
      limit: initialPagination?.limit || 9
    };
    
    // Add search query if present
    if (searchQuery) {
      params.search = searchQuery;
    }
    
    // Add category filter
    if (selectedCategory !== "All") {
      params.category = selectedCategory;
    }
    
    // Add price range filter
    if (selectedPriceRange && filterData) {
      const priceRange = filterData.priceRanges.find(range => range.label === selectedPriceRange);
      if (priceRange) {
        params.minPrice = priceRange.min;
        if (priceRange.max !== Infinity) {
          params.maxPrice = priceRange.max;
        }
      }
    }
    
    // Add sorting
    if (sortOption !== "default") {
      const [field, direction] = sortOption.split('-');
      
      if (field === 'price') {
        params.sortBy = 'price';
        params.sortOrder = direction === 'high' ? 'desc' : 'asc';
      } else if (field === 'name') {
        params.sortBy = 'name';
        params.sortOrder = direction === 'z' ? 'desc' : 'asc';
      }
    }

    return params;
  }, [getCurrentPage, initialPagination?.limit, selectedCategory, selectedPriceRange, sortOption, filterData, searchQuery]);
  
  // Call the React Query hook with computed params
  const { 
    products, 
    pagination, 
    isLoading, 
    error,
    filterData: fetchedFilterData,
  } = useProductsPage(getQueryParams());
  
  useEffect(() => {
    if (!fetchedFilterData) {
      return;
    }
    
    const filterData: FilterData = {
      categories: ["All", ...fetchedFilterData.categories],
      priceRanges: fetchedFilterData.priceRanges
    };
    
    setFilterData(filterData);
  }, [fetchedFilterData]);

  // Function to update URL with new params without full page reload
  const updateUrlParams = useCallback((params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });
    
    // Update URL without triggering navigation
    const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, router]);

  // Update URL when page changes
  useEffect(() => {
    const currentPage = getCurrentPage();
    updateUrlParams({ 
      page: currentPage === 1 ? '' : currentPage.toString() 
    });
  }, [getCurrentPage, updateUrlParams]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    updateUrlParams({ page: '' }); // Reset page to 1
  }, [selectedCategory, selectedPriceRange, sortOption, searchQuery, updateUrlParams]);

  // Reset all filters including search
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriceRange(null);
    setSortOption("default");
    setSearchQuery("");
    
    // Update URL to remove search parameter
    const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
    newSearchParams.delete('search');
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
  };

  const handlePriceRangeChange = (range: string | null) => {
    setSelectedPriceRange(range === selectedPriceRange ? null : range);
  };

  // Handle page changes
  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage === 1 ? '' : newPage.toString() });
  };

  // Generate pagination links
  const getPaginationLinks = () => {
    const page = pagination?.page || initialPagination?.page || 1;
    const totalPages = pagination?.totalPages || initialPagination?.totalPages || 1;
    const links = [];
    
    // Previous button
    links.push(
      <button
        key="prev"
        onClick={() => handlePageChange(page - 1)}
        disabled={page <= 1 || isLoading}
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
      links.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 rounded-md border text-sm ${
            i === page
              ? 'bg-black text-white border-black dark:bg-primary dark:border-primary'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}
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
          className={`px-3 py-1 rounded-md border text-sm ${
            page === totalPages
              ? 'bg-black text-white border-black dark:bg-primary dark:border-primary'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
          }`}
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
        disabled={page >= totalPages || isLoading}
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

  // Show initial products when loading, then switch to fetched products
  const displayProducts = isLoading && initialProducts.length > 0 ? mappedInitialProducts : products;

  // Handle search input change with debounce
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // The actual search will be performed in the effect when debouncedSearchQuery changes
  };

  // Handle clearing search
  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    const newSearchParams = new URLSearchParams(searchParams?.toString() || '');
    newSearchParams.delete('search');
    router.replace(`${window.location.pathname}?${newSearchParams.toString()}`, { scroll: false });
  };

  return (
    <div className="flex-grow bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search results heading */}
        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Search Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            <button
              onClick={handleClearSearch}
              className="text-[#E94FFF] hover:underline text-sm mt-1"
            >
              Clear Search
            </button>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Panel */}
          <div className="w-full lg:w-1/4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              {/* Desktop search input */}
              <div className="mb-6 hidden lg:block">
                <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Search</h2>
                <div className="flex">
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Search products..."
                    className="rounded-r-none"
                  />
                  <button
                    onClick={() => updateUrlParams({ search: searchQuery, page: '' })}
                    className="bg-[#E94FFF] text-white px-3 py-2 rounded-r-md hover:bg-[#D13FE8]"
                    disabled={!searchQuery.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="text-gray-500 hover:text-[#E94FFF] text-sm mt-1"
                  >
                    Clear search
                  </button>
                )}
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Categories</h2>
                <div className="space-y-2">
                  {filterData.categories.map(category => (
                    <div key={category} className="flex items-center">
                      <label className="flex items-center w-full cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category}
                          onChange={() => setSelectedCategory(category)}
                          className="form-radio h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">{category}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Price Range</h2>
                <div className="space-y-2">
                  {filterData.priceRanges.map(range => (
                    <div key={range.label} className="flex items-center">
                      <label className="flex items-center w-full cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPriceRange === range.label}
                          onChange={() => handlePriceRangeChange(range.label)}
                          className="form-checkbox h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">{range.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="w-full lg:w-3/4">
            {/* Sorting & Results Info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
                {isLoading ? (
                  <span>Loading products...</span>
                ) : (
                  <>
                    Showing {displayProducts.length} product{displayProducts.length !== 1 ? 's' : ''}
                    {selectedCategory !== "All" && ` in ${selectedCategory}`}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </>
                )}
              </p>
              
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  disabled={isLoading}
                >
                  <option value="default">Default Sorting</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-a">Name: A to Z</option>
                  <option value="name-z">Name: Z to A</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6" role="alert">
                <p>{error instanceof Error ? error.message : 'Error loading products. Please try again.'}</p>
              </div>
            )}
            
            {/* Loading or no products */}
            {isLoading && displayProducts.length === 0 ? (
              <div className="flex justify-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-gray-300 dark:border-gray-700 border-r-transparent" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Try changing your filters or search criteria.</p>
                <button 
                  onClick={resetFilters}
                  className="px-4 py-2 bg-black dark:bg-primary text-white rounded hover:bg-gray-800 dark:hover:bg-primary-dark transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Products grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.images[0]}
                    />
                  ))}
                </div>
                
                {/* Pagination */}
                {(pagination?.totalPages || initialPagination?.totalPages || 0) > 1 && (
                  <div className="mt-8 flex justify-center">
                    <div className="flex space-x-1">
                      {getPaginationLinks()}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 