/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static image optimization - this helps with rendering performance
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/okneppo/**',
      },
    ],
    minimumCacheTTL: 60, // 1 minute minimum cache
  },
  
  // Optimize performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Enable built-in compression
  compress: true,
  
  // Improve SEO by redirecting common path variants
  redirects: async () => {
    return [
      // Redirect trailing slashes for better SEO
      {
        source: '/:path+/',
        destination: '/:path+',
        permanent: true,
      },
      // Redirect lowercase variants to canonical URLs
      {
        source: '/Products/:path*',
        destination: '/products/:path*',
        permanent: true,
      },
      {
        source: '/About',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/Contact',
        destination: '/contact',
        permanent: true,
      },
    ];
  },
  
  // Add HTTP/2 Server Push
  experimental: {
    // Uncomment the following when you're ready to use it
    // serverActions: true,
  },
  
  // Set output to export static files if needed
  // output: 'export',
  

  // Optional: Add i18n and content security policies as needed
  // i18n: {
  //   locales: ['en'],
  //   defaultLocale: 'en',
  // },
}

module.exports = nextConfig 