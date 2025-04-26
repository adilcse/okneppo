// Use explicit server-only import pattern to prevent client-side usage
import 'server-only';
import fs from 'fs';
import path from 'path';

// Types
export interface Product {
  id: number;
  name: string;
  price: string;
  images: string[];
  category: string;
  description: string;
  details: string[];
  careInstructions: string;
  deliveryTime: string;
}

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

// Helper function to read data from JSON files
const readJsonFile = <T>(filePath: string): T => {
  try {
    const fullPath = path.join(process.cwd(), 'src/data', filePath);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContents) as T;
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}:`, error);
    throw new Error(`Failed to read data from ${filePath}`);
  }
};

// Get all products
export const getAllProducts = async (): Promise<Product[]> => {
  return readJsonFile<Product[]>('products.json');
};

// Get a single product by ID
export const getProduct = async (id: number | string): Promise<{ 
  product: Product; 
  relatedProducts: Product[] 
}> => {
  // Get all products from JSON
  const allProducts = await getAllProducts();
  
  // Ensure ID is handled properly
  const productId = String(id).replace(/[^0-9]/g, ''); // Remove any non-numeric characters
  
  console.log(`Looking for product with clean ID: ${productId}`);
  
  // First try to find the product with exact ID match
  let product = allProducts.find(p => String(p.id) === productId);
  
  // If not found, try finding by numeric ID
  if (!product) {
    const numericId = parseInt(productId, 10);
    product = allProducts.find(p => p.id === numericId);
    console.log(`Trying numeric ID: ${numericId}, found: ${!!product}`);
  }
  
  // If still not found, return the first product (fallback)
  if (!product && allProducts.length > 0) {
    console.log('Using fallback product (first in list)');
    product = allProducts[0];
  }
  
  if (!product) {
    throw new Error(`Product with ID ${id} not found and no fallback available`);
  }
  
  console.log('Found product:', product.name);
  
  // Get related products (same category, excluding the current product)
  const relatedProducts = allProducts
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3); // Limit to 3 related products
  
  return { product, relatedProducts };
};

// Get model data
export const getModelData = async (): Promise<ModelData> => {
  return readJsonFile<ModelData>('models.json');
};

// Get designer data
export const getDesignerData = async (): Promise<Designer> => {
  return readJsonFile<Designer>('designer.json');
};

// Get all available filters for products
export const getProductFilters = async (): Promise<{
  categories: string[];
  priceRanges: { min: number; max: number; label: string }[];
}> => {
  try {
    // Get all products
    const products = await getAllProducts();
    
    // Extract unique categories
    const categories = Array.from(new Set(products.map(product => product.category)));
    
    // Sort categories alphabetically
    categories.sort();
    
    // Create price ranges based on the product data
    const prices = products.map(product => {
      // Remove currency symbol and commas from price
      const priceStr = product.price.replace(/[^\d.]/g, '');
      return parseFloat(priceStr);
    }).filter(price => !isNaN(price));
    
    // Get min and max prices
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Create price range brackets
    const priceRanges = [
      { min: 0, max: 5000, label: 'Under ₹5,000' },
      { min: 5000, max: 10000, label: '₹5,000 - ₹10,000' },
      { min: 10000, max: 15000, label: '₹10,000 - ₹15,000' },
      { min: 15000, max: 20000, label: '₹15,000 - ₹20,000' },
      { min: 20000, max: Infinity, label: 'Over ₹20,000' }
    ].filter(range => {
      // Keep only price ranges that have products in them
      return (range.min <= maxPrice) && (range.max >= minPrice);
    });
    
    return { categories, priceRanges };
  } catch (error) {
    console.error('Error getting product filters:', error);
    return { categories: [], priceRanges: [] };
  }
}; 