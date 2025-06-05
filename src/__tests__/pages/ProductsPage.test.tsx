import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductsPage from '@/app/(pages)/products/page';
import ClientProductsPage from '@/components/pages/products/ClientProductsPage';
import { getAllProducts } from '@/lib/api';
import { Product } from '@/lib/types';

// Mock the API functions
jest.mock('@/lib/api', () => ({
  getAllProducts: jest.fn().mockResolvedValue({
    products: [
      { 
        id: 1, 
        name: 'Test Product 1', 
        price: 1000,
        description: 'Test description 1',
        images: ['/images/test1.jpg'],
        category: 'Test Category',
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { 
        id: 2, 
        name: 'Test Product 2', 
        price: 2000,
        description: 'Test description 2',
        images: ['/images/test2.jpg'],
        category: 'Another Category',
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 9,
      totalCount: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  }),
  getProductFilters: jest.fn().mockResolvedValue({
    categories: ['Test Category', 'Another Category'],
    priceRanges: [
      { label: 'Under ₹1,000', min: 0, max: 1000 },
      { label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
      { label: 'Over ₹2,000', min: 2000, max: Infinity }
    ]
  })
}));



interface ClientProductsPageProps {
  initialProducts: Product[];
  initialFilterData: {
    categories: string[];
    priceRanges: Array<{ label: string; min: number; max: number }>;
  };
  initialPagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Use the defined type for lastReceivedProps
let lastReceivedProps: ClientProductsPageProps | null = null;

// Mock the Header and Footer components
jest.mock('@/components/layout/Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('@/components/layout/Footer', () => {
  return function MockFooter() {
    return <div data-testid="mock-footer">Footer</div>;
  };
});

// Mock the ClientProductsPage component
jest.mock('@/components/pages/products/ClientProductsPage', () => {
  return jest.fn().mockImplementation((props) => {
    lastReceivedProps = props;
    return (
      <div data-testid="mock-products-page">
        <div data-testid="products-count">{props.initialProducts.length}</div>
        <ul>
          {props.initialProducts.map((product: Product) => (
            <li key={product.id} data-testid={`product-${product.id}`}>
              {product.name} - {product.price}
            </li>
          ))}
        </ul>
      </div>
    );
  });
});

describe('Products Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastReceivedProps = null;
  });

  it('renders the products page with header, product list, and footer', async () => {
    const searchParams = Promise.resolve({});
    const ProductsPageCopy = ProductsPage as React.FC<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;
    
    render(await ProductsPageCopy({ searchParams }));
    
    // Check that products section is rendered
    expect(screen.getByTestId('mock-products-page')).toBeInTheDocument();
    expect(screen.getByTestId('products-count')).toHaveTextContent('2');
    expect(screen.getByTestId('product-1')).toHaveTextContent('Test Product 1 - 1000');
    expect(screen.getByTestId('product-2')).toHaveTextContent('Test Product 2 - 2000');
  });
  
  it('passes the correct props to ClientProductsPage', async () => {
    const searchParams = Promise.resolve({});
    const ProductsPageCopy = ProductsPage as React.FC<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;
    
    render(await ProductsPageCopy({ searchParams }));
    
    // Log the actual props for debugging
    console.log('ClientProductsPage was called with:', lastReceivedProps);
    
    // Check that ClientProductsPage was called
    expect(ClientProductsPage).toHaveBeenCalled();
    
    // Verify the initialProducts prop
    expect(lastReceivedProps?.initialProducts).toHaveLength(2);
    expect(lastReceivedProps?.initialProducts[0].name).toBe('Test Product 1');
    expect(lastReceivedProps?.initialProducts[1].name).toBe('Test Product 2');
    
    // Verify the initialFilterData prop
    expect(lastReceivedProps?.initialFilterData).toEqual({
      categories: ['Test Category', 'Another Category'],
      priceRanges: [
        { label: 'Under ₹1,000', min: 0, max: 1000 },
        { label: '₹1,000 - ₹2,000', min: 1000, max: 2000 },
        { label: 'Over ₹2,000', min: 2000, max: Infinity }
      ]
    });
    
    // Verify the initialPagination prop
    expect(lastReceivedProps?.initialPagination).toEqual({
      page: 1,
      limit: 9,
      totalCount: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    });
  });
  
  it('handles search parameters correctly', async () => {
    // Test with page 2 in search params
    const searchParams = Promise.resolve({ page: '2', limit: '6' });
    const ProductsPageCopy = ProductsPage as React.FC<{ searchParams: Promise<Record<string, string | string[] | undefined>> }>;
    
    render(await ProductsPageCopy({ searchParams }));
    
    // Check that ClientProductsPage was called with the correct search params value
    expect(ClientProductsPage).toHaveBeenCalled();
    
    // The getAllProducts function should have been called with page 2 and limit 6
    expect(getAllProducts).toHaveBeenCalledWith(2, 6);
  });
}); 