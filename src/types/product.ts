export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category?: string;
  description?: string;
  className?: string;
  showDescription?: boolean;
} 