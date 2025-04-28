"use client";

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import { Suspense } from 'react';

// Import the NProgress CSS. We will need to install this package
// npm install nprogress
// npm install @types/nprogress --save-dev

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  minimum: 0.1,
  speed: 200,
  easing: 'ease',
  trickleSpeed: 100
});

function RouterEventsClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    // Add custom styles for NProgress
    const style = document.createElement('style');
    style.textContent = `
      #nprogress {
        pointer-events: none;
      }
      
      #nprogress .bar {
        background: #E94FFF;
        position: fixed;
        z-index: 1031;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
      }
      
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px #E94FFF, 0 0 5px #E94FFF;
        opacity: 1.0;
        transform: rotate(3deg) translate(0px, -4px);
      }
    `;
    document.head.appendChild(style);
    
    // Start NProgress on page change
    const handleRouteChangeStart = () => {
      setIsChanging(true);
      NProgress.start();
    };

    window.addEventListener('beforeunload', handleRouteChangeStart);

    // Cleanup
    return () => {
      NProgress.done();
      window.removeEventListener('beforeunload', handleRouteChangeStart);
      document.head.removeChild(style);
    };
  }, []);

  // Reset progress state when URL changes
  useEffect(() => {
    if (isChanging) {
      setIsChanging(false);
      NProgress.done();
    }
  }, [pathname, searchParams, isChanging]);

  return null; // This component doesn't render anything
}

// Main export wrapped in Suspense
export default function RouterEvents() {
  return (
    <Suspense fallback={null}>
      <RouterEventsClient />
    </Suspense>
  );
} 