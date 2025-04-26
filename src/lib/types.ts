// Client-safe type definitions

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

export interface FilterData {
  categories: string[];
  priceRanges: { min: number; max: number; label: string }[];
} 