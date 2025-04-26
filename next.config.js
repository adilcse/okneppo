/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static image optimization - this helps with rendering performance
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [],
    minimumCacheTTL: 60, // 1 minute minimum cache
  },
  
  // Optimize performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable built-in compression
  compress: true,
  
  // Add HTTP/2 Server Push
  experimental: {
    // Uncomment the following when you're ready to use it
    // serverActions: true,
  },
  
  // Set output to export static files if needed
  // output: 'export',
  
  // Add Sentry browser monitoring in production for error tracking
  sentry: {
    hideSourceMaps: true,
  },
  
  // Optional: Add i18n and content security policies as needed
  // i18n: {
  //   locales: ['en'],
  //   defaultLocale: 'en',
  // },
}

module.exports = nextConfig 