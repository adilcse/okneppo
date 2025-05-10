"use client";

import Link from 'next/link';
import Logo from '../ui/Logo';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axiosClient from '@/lib/axios';
import Image from 'next/image';

interface SearchResult {
  id: number;
  name: string;
  price: number;
  images: string[];
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Handle clicks outside the search dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      
      // Also handle clicks outside mobile search
      if (
        mobileSearchVisible && 
        mobileSearchRef.current && 
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setMobileSearchVisible(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileSearchVisible]);

  // Search function
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await axiosClient.get('/api/products', {
        params: { 
          search: query,
          limit: 10
        }
      });
      
      setSearchResults(response.data.products);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search implementation
  const debouncedSearch = useCallback((query: string) => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 2000);
  }, []);

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle search input changes
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Submit search to product page
  const submitSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
      setSearchQuery(''); // Clear search after navigation
    }
  };

  // Handle pressing Enter in search input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitSearch();
    }
  };

  // Handle clicking a search result
  const handleResultClick = (productId: number) => {
    setShowResults(false);
    setSearchQuery(''); // Clear search after navigation
    router.push(`/products/${productId}`);
  };

  // Toggle mobile search visibility
  const toggleMobileSearch = () => {
    setMobileSearchVisible(!mobileSearchVisible);
    
    // Focus the input when showing search
    if (!mobileSearchVisible) {
      setTimeout(() => {
        const input = document.querySelector('.mobile-search-input') as HTMLInputElement;
        if (input) input.focus();
      }, 100);
    }
  };

  console.log({mobileSearchVisible});

  return (
    <header className="bg-black dark:bg-gray-900 shadow-sm text-white">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center z-10">
          <Logo width={60} height={60} className="mr-3" />
        </Link>

        {/* Search box */}
        <div className="hidden md:block relative" ref={searchRef}>
          <div className="flex">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={handleKeyDown}
              className="px-4 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-l-md focus:ring-1 focus:ring-[#E94FFF] focus:border-[#E94FFF] focus:outline-none w-64"
            />
            <button
              onClick={submitSearch}
              className="bg-[#E94FFF] text-white px-4 py-2 rounded-r-md hover:bg-[#D13FE8] focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          
          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-md shadow-lg z-20 mt-1 max-h-72 overflow-y-auto">
              {searchResults.map((result) => (
                <Link 
                  href={`/products/${result.id}`} 
                  key={result.id}
                  className="flex items-center p-3 hover:bg-gray-100 border-b border-gray-100"
                  onClick={() => handleResultClick(result.id)}
                >
                  <div className="w-12 h-12 relative flex-shrink-0 mr-3">
                    <Image
                      src={result.images[0] || '/images/placeholder.jpg'}
                      alt={result.name}
                      fill
                      sizes="48px"
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-gray-900 text-sm font-medium">{result.name}</h4>
                    <p className="text-[#E94FFF] text-sm">₹{result.price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              <div className="p-2 text-center">
                <button 
                  onClick={submitSearch}
                  className="text-sm text-gray-600 hover:text-[#E94FFF]"
                >
                  See all results for &ldquo;{searchQuery}&rdquo;
                </button>
              </div>
            </div>
          )}
          
          {isSearching && (
            <div className="absolute top-full left-0 right-0 bg-white rounded-md shadow-lg z-20 mt-1 p-4 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#E94FFF] border-r-transparent"></div>
            </div>
          )}
        </div>

        {/* Desktop menu */}
        <nav className="hidden md:flex items-center">
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="hover:text-[#E94FFF] font-medium">
                Home
              </Link>
            </li>
            <li>
              <Link href="/products" className="hover:text-[#E94FFF] font-medium">
                Collections
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-[#E94FFF] font-medium">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[#E94FFF] font-medium">
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile menu button and search */}
        <div className="flex items-center md:hidden z-10 gap-3">
          <button 
            type="button"
            onClick={toggleMobileSearch}
            aria-label="Search"
            className="text-white"
          >
            {!mobileSearchVisible ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
          
          <button 
            type="button"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {!mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile search overlay */}
        {mobileSearchVisible && (
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-start justify-center pt-16 px-4"
            onClick={() => setMobileSearchVisible(false)}
          >
            <div 
              ref={mobileSearchRef} 
              className="w-full max-w-md bg-white rounded-md shadow-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="flex items-center border-b border-gray-300 pb-2">
                  <input
                    type="text"
                    className="mobile-search-input w-full text-black text-base placeholder-gray-500 outline-none"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (searchQuery.trim()) {
                          // Store the query before clearing state
                          const query = searchQuery;
                          // Clear state first
                          setMobileSearchVisible(false);
                          setSearchQuery('');
                          setShowResults(false);
                          // Then navigate
                          setTimeout(() => {
                            router.push(`/products?search=${encodeURIComponent(query)}`);
                          }, 0);
                        }
                      } else if (e.key === 'Escape') {
                        setMobileSearchVisible(false);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (searchQuery.trim()) {
                        // Store the query before clearing state
                        const query = searchQuery;
                        // Clear state first
                        setMobileSearchVisible(false);
                        setSearchQuery('');
                        setShowResults(false);
                        // Then navigate
                        setTimeout(() => {
                          router.push(`/products?search=${encodeURIComponent(query)}`);
                        }, 0);
                      }
                    }}
                    className="ml-2 p-1 text-gray-500 hover:text-[#E94FFF]"
                    disabled={!searchQuery.trim()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => setMobileSearchVisible(false)}
                    className="ml-2 p-1 text-gray-500 hover:text-[#E94FFF]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Mobile search results */}
                {isSearching ? (
                  <div className="p-4 text-center text-gray-700">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-[#E94FFF] border-r-transparent"></div>
                  </div>
                ) : showResults && searchResults.length > 0 ? (
                  <div className="mt-2 max-h-80 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div 
                        key={result.id}
                        className="flex items-center p-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          // Store the ID before clearing state
                          const productId = result.id;
                          // Clear state first
                          setMobileSearchVisible(false);
                          setSearchQuery('');
                          setShowResults(false);
                          // Then navigate
                          setTimeout(() => {
                            router.push(`/products/${productId}`);
                          }, 0);
                        }}
                      >
                        <div className="w-12 h-12 relative flex-shrink-0 mr-3">
                          <Image
                            src={result.images[0] || '/images/placeholder.jpg'}
                            alt={result.name}
                            fill
                            sizes="48px"
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="text-gray-900 text-sm font-medium">{result.name}</h4>
                          <p className="text-[#E94FFF] text-sm">₹{result.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    <div className="p-2 text-center">
                      <button 
                        onClick={() => {
                          if (searchQuery.trim()) {
                            // Store the query before clearing state
                            const query = searchQuery;
                            // Clear state first
                            setMobileSearchVisible(false);
                            setSearchQuery('');
                            setShowResults(false);
                            // Then navigate
                            setTimeout(() => {
                              router.push(`/products?search=${encodeURIComponent(query)}`);
                            }, 0);
                          }
                        }}
                        className="text-sm text-gray-600 hover:text-[#E94FFF]"
                      >
                        See all results for &ldquo;{searchQuery}&rdquo;
                      </button>
                    </div>
                  </div>
                ) : searchQuery && !isSearching ? (
                  <div className="p-3 text-gray-500 text-center text-sm">
                    No results found for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Mobile menu */}
        <div className={`fixed inset-0 bg-black bg-opacity-90 dark:bg-gray-900 dark:bg-opacity-95 z-30 transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col items-center justify-center h-full">
            <ul className="flex flex-col space-y-8 text-center">
              <li>
                <Link 
                  href="/" 
                  className="text-2xl font-medium hover:text-[#E94FFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  href="/products" 
                  className="text-2xl font-medium hover:text-[#E94FFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Collections
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-2xl font-medium hover:text-[#E94FFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-2xl font-medium hover:text-[#E94FFF]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
} 