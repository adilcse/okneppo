import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken } from './lib/auth';

// Routes that require admin authentication
const PROTECTED_API_ROUTES = [
  '/api/products',        // POST requests to create products
  '/api/upload',          // File uploads
  '/api/categories/add',  // Adding categories
];

// Middleware function
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const origin = request.headers.get('origin');
  
  // Handle CORS for API routes
  if (pathname.startsWith('/api/')) {
    // Create a response object to modify
    const response = NextResponse.next();
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }
    
    // Check if the path is a protected API route
    const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route => 
      pathname.startsWith(route)
    );
    
    // For product-specific endpoints (PUT, DELETE operations)
    const isProductEndpoint = pathname.match(/^\/api\/products\/\d+$/);
    
    // Only apply authentication for protected API routes with specific methods
    // or for product-specific endpoints with PUT/DELETE methods
    if (
      (isProtectedApiRoute && method !== 'GET') || 
      (isProductEndpoint && (method === 'PUT' || method === 'DELETE'))
    ) {
      const token = getTokenFromRequest(request);

      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { 
            status: 401,
            headers: response.headers
          }
        );
      }

      const { verified, error } = await verifyToken(token);
      
      if (!verified) {
        return NextResponse.json(
          { error: error || 'Invalid or expired token' },
          { 
            status: 401,
            headers: response.headers
          }
        );
      }
    }
    
    return response;
  }

  // Not an API route, proceed normally
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    '/api/:path*',
  ],
}; 