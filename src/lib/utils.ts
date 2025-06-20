import { Product } from "./types";

export function snakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Utility function to ensure consistent mapping of product fields
 * This helps prevent issues when database field names don't match interface names
 */
export function mapProductFields(data: Partial<Product> & { 
  care_instructions?: string; 
  delivery_time?: string; 
  created_at?: string;
}): Product {
  // Convert price to number if it's a string (for backward compatibility)
  let price = 0;
  if (typeof data.price === 'number') {
    price = data.price;
  } else if (typeof data.price === 'string' && data.price) {
    // Explicitly handle as string
    const priceStr: string = data.price;
    price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
  }

  // Handle both camelCase and snake_case field names for backward compatibility
  const careInstructions = 
    data.careInstructions || 
    data.care_instructions || 
    '';

  const deliveryTime = 
    data.deliveryTime || 
    data.delivery_time || 
    '';

  return {
    id: data.id || 0,
    name: data.name || '',
    price,
    images: Array.isArray(data.images) ? data.images : [],
    category: data.category || '',
    description: data.description || '',
    details: Array.isArray(data.details) ? data.details : [],
    careInstructions,
    deliveryTime,
    featured: !!data.featured,
    createdAt: data.created_at || '',
  };
}
