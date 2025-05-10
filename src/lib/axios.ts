import axios from 'axios';
import Cookies from 'js-cookie';

// Determine the base URL based on environment
const getBaseUrl = () => {
  // If running on the server during build
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://okneppo.in';
  }
  
  // If running in the browser, use the current origin
  return process.env.NEXT_PUBLIC_API_URL || window.location.origin;
};

// Create an axios instance with custom configuration
const axiosClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // Include credentials (cookies) with every request
  withCredentials: true,
  // Timeout requests after 30 seconds
  timeout: 30000,
});

// Add a request interceptor for handling tokens and other modifications
axiosClient.interceptors.request.use(
  (config) => {
    // For server-side requests that need the full URL
    if (typeof window === 'undefined' && config.url && !config.url.startsWith('http')) {
      config.url = `${getBaseUrl()}${config.url}`;
    }
    
    // Add admin token to request if it exists (for admin endpoints)
    const adminToken = Cookies.get('admin-token');
    if (adminToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    
    // Add a timestamp to prevent caching
    const separator = config.url?.includes('?') ? '&' : '?';
    config.url = `${config.url}${separator}t=${new Date().getTime()}`;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Create a more readable error
    if (error.response) {
      // Server responded with a status code outside of 2xx
      error.message = `Request failed with status ${error.response.status}: ${error.response.statusText}`;
      
      // Handle auth errors
      if (error.response.status === 401) {
        // Only handle auth errors for admin endpoints
        if (error.config.url?.includes('/api/admin/') || 
            (error.config.headers?.Authorization && 
             typeof error.config.headers.Authorization === 'string' && 
             error.config.headers.Authorization.startsWith('Bearer '))) {
          // Clear admin token if it's invalid
          Cookies.remove('admin-token', { path: '/' });
          
          // If we're in the browser, redirect to login page
          if (typeof window !== 'undefined') {
            // Use a timeout to avoid immediate redirect during render
            setTimeout(() => {
              window.location.href = '/admin/login';
            }, 100);
          }
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      error.message = 'No response received from server. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient; 