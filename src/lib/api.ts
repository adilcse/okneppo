// Use explicit server-only import pattern to prevent client-side usage
import 'server-only';
import { db } from './db';
import { Product } from './types';


export interface FeaturedProduct {
  id: number;
  name: string;
  price: string;
  image: string;
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
 * Filter data interface for product filtering
 */
export interface FilterData {
  categories: string[];
  priceRanges: { min: number; max: number; label: string }[];
}

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  const result = await db.find('products');
  return result as unknown as Product[];
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
    return modelData.default;
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