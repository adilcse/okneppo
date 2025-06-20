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

export interface Course {
  id: number;
  name: string;
  description: string;
  duration: string;
  price: number;
  level: string;
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
