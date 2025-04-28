"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import NProgress from 'nprogress';
import { Suspense } from 'react';

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  minimum: 0.1,
  speed: 200, 
  easing: 'ease',
  trickleSpeed: 100
});

// Create context
const NavigationContext = createContext<{ isNavigating: boolean }>({
  isNavigating: false
});

export function useNavigation() {
  return useContext(NavigationContext);
}

function NavigationProviderClient({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState<string | null>(null);
  
  // Track navigation
  useEffect(() => {
    if (prevPathname !== null && prevPathname !== pathname) {
      // If path changed, end navigation
      NProgress.done();
      setIsNavigating(false);
    }
    
    setPrevPathname(pathname);
  }, [pathname, prevPathname]);
  
  // When starting to navigate
  useEffect(() => {
    const handlePageChangeStart = () => {
      setIsNavigating(true);
      NProgress.start();
    };
    
    // Alternative ways to detect navigation start
    window.addEventListener('beforeunload', handlePageChangeStart);
    
    // If this component was mounted due to a navigation, start progress
    if (prevPathname === null && pathname && typeof window !== 'undefined') {
      // We're in a client navigation since hydration
      const storedPath = sessionStorage.getItem('lastPath');
      if (storedPath && storedPath !== pathname) {
        handlePageChangeStart();
      }
      
      // Store current path for future comparisons
      sessionStorage.setItem('lastPath', pathname);
    }
    
    return () => {
      window.removeEventListener('beforeunload', handlePageChangeStart);
    };
  }, [pathname, prevPathname]);
  
  // Clean up when unmounting
  useEffect(() => {
    return () => {
      NProgress.done();
    };
  }, []);

  return (
    <NavigationContext.Provider value={{ isNavigating }}>
      {children}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Loading...</p>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NavigationProviderClient>{children}</NavigationProviderClient>
    </Suspense>
  );
} 