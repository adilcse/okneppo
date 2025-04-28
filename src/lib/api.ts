// Use explicit server-only import pattern to prevent client-side usage
import 'server-only';
import { db } from './db';
import { Designer, FeaturedProduct, mapProductFields, ModelData, Product } from './types';

/**
 * Pagination info interface
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Filter data interface for product filtering
 */
export interface FilterData {
  categories: string[];
  priceRanges: { min: number; max: number; label: string }[];
}

/**
 * Get products with optional pagination
 */
export const getAllProducts = async (page: number = 1, limit: number = 9): Promise<{
  products: Product[];
  pagination: PaginationInfo;
}> => {
  try {
    // Fetch from the API endpoint to get pagination info
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/products?page=${page}&limit=${limit}`, {
      // Use cache: no-store to always get fresh data on server
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching products: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      products: data.products.map(mapProductFields),
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    // Return empty data with pagination info
    return {
      products: [],
      pagination: {
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
};

// Get a single product by ID
export const getProduct = async (id: number | string): Promise<{
  product: Product; 
  relatedProducts: Product[] 
}> => {
  // Get product by ID
const product = await db.findById('products', id) as unknown as Product;
  
  if (!product) {
      throw new Error(`Product with ID ${id} not found and no fallback available`);
  }
  // Get related products (same category, excluding current product)
  const relatedProducts = await db.find('products', {
    category: product.category,
    id: { $ne: product.id }
  }, { limit: 3 }) as unknown as Product[];

  return { product, relatedProducts };
};
// Get model data
export const getModelData = async (): Promise<ModelData> => {
  try {
    const modelData = await import('../data/models.json');
    return modelData.default as ModelData;
  } catch (error) {
    console.error('Error loading model data:', error);
    throw new Error('Model data not found');
  }
};

// Get designer data
export const getDesignerData = async (): Promise<Designer> => {
  try {
    const designerData = await import('../data/designer.json');
    return designerData.default;
  } catch (error) {
    console.error('Error loading designer data:', error);
    throw new Error('Designer data not found');
  }
};

// Get all available filters for products
export const getProductFilters = async (): Promise<{
  categories: string[];
  priceRanges: { min: number; max: number; label: string }[];
}> => {
  try {
    // Get unique categories directly from database
    const categoriesResult = await db.query(
      'SELECT DISTINCT category FROM products ORDER BY category ASC'
    );
    const categories: string[] = categoriesResult.map(row => row.category) as string[];

    const priceRanges = [
      { min: 0, max: 5000, label: 'Under ₹5,000' },
      { min: 5000, max: 10000, label: '₹5,000 - ₹10,000' },
      { min: 10000, max: 15000, label: '₹10,000 - ₹15,000' },
      { min: 15000, max: 20000, label: '₹15,000 - ₹20,000' },
      { min: 20000, max: Infinity, label: 'Over ₹20,000' }
    ];

    return { categories, priceRanges };
  } catch (error) {
    console.error('Error getting product filters:', error);
    return { categories: [], priceRanges: [] };
  }
};

export const  getFeaturedProducts = async (): Promise<FeaturedProduct[]> => {
    try {
      // Query products collection for featured items
      console.log('Querying featured products directly from database');
      const featuredProducts = await db.find(
        'products', 
        { featured: true },
        { orderBy: 'id', order: 'DESC', limit: 4 }
      );
  
      // Map and format products
      const mappedProducts = featuredProducts.map(product => {
        const mappedProduct = mapProductFields(product);
        
        // Truncate description if too long
        if (mappedProduct.description && mappedProduct.description.length > 120) {
          mappedProduct.description = mappedProduct.description.substring(0, 120) + '...';
        }
        
        return {
          id: mappedProduct.id,
          name: mappedProduct.name,
          price: mappedProduct.price,
          images: mappedProduct.images,
          description: mappedProduct.description
        };
      });
  
      return mappedProducts;
    } catch (error) {
      console.error('Error fetching featured products from database:', error);
      return [];
    }
  }