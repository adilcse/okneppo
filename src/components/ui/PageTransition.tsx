"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { Suspense } from 'react';

function PageTransitionClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Set up NProgress
    NProgress.configure({ 
      showSpinner: false,
      minimum: 0.3,
      speed: 300,
      easing: 'ease',
      trickleSpeed: 100
    });

    // Function to start the loading indicator
    const handleStart = () => {
      NProgress.start();
    };

    // Add event listeners for page transition start
    window.addEventListener('beforeunload', handleStart);
    
    // When a link is clicked
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const linkElement = findLinkParent(target);
      
      if (linkElement && linkElement.getAttribute('href')?.startsWith('/')) {
        handleStart();
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleStart);
      document.removeEventListener('click', handleLinkClick);
      NProgress.done();
    };
  }, []);

  // Complete the progress bar when the route changes
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

// Helper function to find the closest link parent
function findLinkParent(element: HTMLElement | null): HTMLAnchorElement | null {
  if (!element) return null;
  if (element.tagName === 'A') return element as HTMLAnchorElement;
  return findLinkParent(element.parentElement);
}

// Main component that wraps the client component in a Suspense boundary
export default function PageTransition() {
  return (
    <Suspense fallback={null}>
      <PageTransitionClient />
    </Suspense>
  );
} 