// Client-safe type definitions

export interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  category: string;
  description: string;
  details: string[];
  careInstructions: string;
  deliveryTime: string;
  featured: boolean;
  createdAt: string;
}


export interface FilterData {
  categories: string[];
  priceRanges: { min: number; max: number; label: string }[];
}

export interface FeaturedProduct {
    id: number;
    name: string;
    price: number;
    images?: string[];
    image?: string;
    description: string;
  }
  
  export interface ModelData {
    showcase: string[];
    featured: FeaturedProduct[];
  }
  
  export interface Designer {
    name: string;
    title: string;
    short_bio: string;
    achievements: string;
    story: {
      intro: string;
      approach: string;
      vision: string;
    };
    philosophy: {
      main: string;
      practices: string;
      process: string;
    };
    recognition: {
      industry: string;
      influence: string;
      legacy: string;
    };
    studio: {
      description: string;
    };
    images: {
      portrait: string;
      at_work: string;
      fashion_show: string;
      studio: string;
      homepage: string;
    };
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

/**
 * Format a price number to currency string
 */
export function formatPrice(price: number): string {
  return `₹${price.toLocaleString('en-IN', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
} 