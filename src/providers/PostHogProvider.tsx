"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current route is an admin route
  const isAdminRoute = pathname?.startsWith('/admin');
  
  useEffect(() => {
    // Only initialize PostHog on the client side after hydration and for non-admin routes
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && !isAdminRoute) {
      console.log('Initializing PostHog');
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ingest",
        ui_host: "https://us.posthog.com",
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
        loaded: () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('PostHog loaded successfully');
          }
        }
      });
    } else if (isAdminRoute) {
      console.log('PostHog disabled for admin routes');
    }
  }, [isAdminRoute]);

  // If on admin route, disable PostHog if it's already initialized
  useEffect(() => {
    if (isAdminRoute && typeof window !== 'undefined' && window.posthog) {
      console.log('Disabling PostHog for admin route');
      posthog.opt_out_capturing();
    } else if (!isAdminRoute && typeof window !== 'undefined' && window.posthog) {
      console.log('Re-enabling PostHog for non-admin route');
      posthog.opt_in_capturing();
    }
  }, [isAdminRoute]);

  return <>{children}</>;
}
