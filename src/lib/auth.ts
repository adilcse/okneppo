import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Secret key for JWT signing and verification
const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Generate a JWT token for admin authentication
 */
export async function generateAdminToken(adminData: { username: string }) {
  const secretKey = getSecretKey();
  
  const token = await new SignJWT({ ...adminData })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Expires in 1 day
    .sign(secretKey);
  
  return token;
}

/**
 * Verify a JWT token from request
 */
export async function verifyToken(token: string) {
  try {
    const secretKey = getSecretKey();
    const verified = await jwtVerify(token, secretKey);
    return {
      verified: true,
      payload: verified.payload
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      verified: false,
      error: 'Invalid or expired token'
    };
  }
}

/**
 * Extract token from request (headers or cookies)
 */
export function getTokenFromRequest(request: NextRequest) {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  
  // Otherwise get from cookies
  const token = request.cookies.get('admin-token');
  return token?.value;
}

/**
 * Set admin token cookie
 */
export async function setAdminTokenCookie(response: NextResponse, token: string) {
  // Set cookie directly on the response object
  response.cookies.set('admin-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 60 * 60 * 24, // 1 day
    path: '/',
    sameSite: 'strict',
  });
}

/**
 * Clear admin token cookie
 */
export async function clearAdminTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('admin-token');
} 