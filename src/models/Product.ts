// Interface for Product attributes
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
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface for Product creation (without id since it's auto-generated)
export interface ProductCreationAttributes {
  name: string;
  price: string;
  images: string[];
  category: string;
  description?: string;
  details?: string[];
  careInstructions?: string;
  deliveryTime?: string;
}

export default Product;