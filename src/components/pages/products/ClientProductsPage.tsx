"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, FilterData } from '@/lib/types';

interface ClientProductsPageProps {
  initialProducts: Product[];
  initialFilterData?: FilterData;
}

export default function ClientProductsPage({ initialProducts, initialFilterData }: ClientProductsPageProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [sortOption, setSortOption] = useState<string>("default");
  
  const filterData: FilterData = initialFilterData 
    ? { categories: ["All", ...initialFilterData.categories], priceRanges: initialFilterData.priceRanges } 
    : { categories: ["All"], priceRanges: [] };
  
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;
    
    if (selectedCategory !== "All") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    return [...filtered].sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^\d.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^\d.]/g, ''));
      
      switch (sortOption) {
        case "price-low-high": return priceA - priceB;
        case "price-high-low": return priceB - priceA;
        case "name-a-z": return a.name.localeCompare(b.name);
        case "name-z-a": return b.name.localeCompare(a.name);
        default: return 0;
      }
    });
  }, [products, selectedCategory, sortOption]);
  
  const resetFilters = () => {
    setSelectedCategory("All");
    setSortOption("default");
  };

  return (
    <main className="flex-grow py-6 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-medium mb-4">Filters</h2>
          
          <div className="flex flex-col sm:flex-row sm:justify-between gap-6 mb-6">
            <div>
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
                    aria-pressed={selectedCategory === category}
                    aria-label={`Filter by ${category}`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:ml-auto sm:w-48">
              <h3 className="text-sm font-medium mb-2">Sort By</h3>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full border border-gray-300 rounded py-2 px-3 text-sm"
                aria-label="Sort products by"
              >
                <option value="default">Featured</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
                <option value="name-a-z">Name: A to Z</option>
                <option value="name-z-a">Name: Z to A</option>
              </select>
            </div>
          </div>
          
          {(selectedCategory !== "All" || sortOption !== "default") && (
            <div className="flex justify-between items-center border-t pt-4">
              <div className="text-sm flex flex-wrap gap-2">
                <span className="text-gray-500">Applied Filters: </span>
                {selectedCategory !== "All" && (
                  <button 
                    onClick={() => setSelectedCategory("All")}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs inline-flex items-center hover:bg-gray-200"
                  >
                    {selectedCategory}
                    <span className="ml-1 font-medium hover:text-red-500" aria-label={`Remove ${selectedCategory} filter`}>×</span>
                  </button>
                )}
                {sortOption !== "default" && (
                  <button 
                    onClick={() => setSortOption("default")}
                    className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs inline-flex items-center hover:bg-gray-200"
                  >
                    Sort: {sortOption.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <span className="ml-1 font-medium hover:text-red-500" aria-label="Remove sort filter">×</span>
                  </button>
                )}
              </div>
              <button 
                onClick={resetFilters}
                className="text-sm text-gray-600 hover:text-black"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredAndSortedProducts.map((product) => (
              <Link href={`/products/${product.id}`} key={product.id} className="group">
                <div className="bg-gray-100 rounded-lg overflow-hidden h-52 sm:h-64 mb-3 relative">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-medium mb-1">{product.name}</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-2">{product.category}</p>
                <p className="font-bold text-lg sm:text-xl">{product.price}</p>
              </Link>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </main>
  );
} 