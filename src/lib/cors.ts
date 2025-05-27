import { NextRequest, NextResponse } from 'next/server';

// Define allowed origins
const allowedOrigins = [
  'https://okneppo.in',
  'https://www.okneppo.in',
  'http://localhost:3000',
];

// Helper function to check if origin is allowed
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return allowedOrigins.some(allowed => {
    // Exact match
    if (allowed === origin) return true;
    // Wildcard subdomain match (*.domain.com)
    if (allowed.startsWith('*.')) {
      const allowedDomain = allowed.substring(2);
      return origin.endsWith(allowedDomain) && origin.includes('.');
    }
    return false;
  });
}

// CORS middleware wrapper for API routes
export function withCors(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async function corsHandler(req: NextRequest): Promise<NextResponse> {
    // Get the origin from the request
    const origin = req.headers.get('origin');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      
      // Set CORS headers
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      // Set Access-Control-Allow-Origin
      if (origin && (isAllowedOrigin(origin) || process.env.NODE_ENV === 'development')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      } else {
        // For security, we'll use a wildcard only if no credentials are needed
        response.headers.set('Access-Control-Allow-Origin', '*');
      }
      
      return response;
    }
    
    try {
      // Call the original handler
      const response = await handler(req);
      
      // Set CORS headers for the response
      if (origin && (isAllowedOrigin(origin) || process.env.NODE_ENV === 'development')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      } else {
        // For security, we'll use a wildcard only if no credentials are needed
        response.headers.set('Access-Control-Allow-Origin', '*');
      }
      
      // Add Vary header to tell browsers to cache based on Origin
      response.headers.set('Vary', 'Origin');
      
      return response;
    } catch (error) {
      console.error('API route error:', error);
      
      // Create error response
      const errorResponse = NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
      
      // Set CORS headers for the error response
      if (origin && (isAllowedOrigin(origin) || process.env.NODE_ENV === 'development')) {
        errorResponse.headers.set('Access-Control-Allow-Origin', origin);
        errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      } else {
        errorResponse.headers.set('Access-Control-Allow-Origin', '*');
      }
      
      // Add Vary header
      errorResponse.headers.set('Vary', 'Origin');
      
      return errorResponse;
    }
  };
}
