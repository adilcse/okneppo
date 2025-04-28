import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductPage from '@/app/(pages)/products/[id]/page';
import ProductClientPage from '@/app/(pages)/products/[id]/ProductClientPage';

// Define the type for the props
type ProductClientPageProps = {
  params: { id: string };
};

// Mock the ProductClientPage component and store the last props it received
let lastReceivedProps: ProductClientPageProps | null = null;
jest.mock('@/app/(pages)/products/[id]/ProductClientPage', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((props: ProductClientPageProps) => {
    lastReceivedProps = props;
    return (
      <div data-testid="mock-product-client-page">
        <div data-testid="product-id">{props.params.id}</div>
      </div>
    );
  })
}));

// Mock the SEO metadata generator
jest.mock('@/components/utils/SEOMetaTags', () => ({
  generateSEOMetadata: jest.fn().mockReturnValue({
    title: 'Test Product | Ok Neppo',
    description: 'Test description',
  }),
}));

// Mock console.error
const originalConsoleError = console.error;

describe('Product Details Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastReceivedProps = null;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders the product details page with the correct product ID', async () => {
    const testId = '123';
    const params = Promise.resolve({ id: testId });
    const ProductPageCopy = ProductPage as React.FC<{ params: Promise<{ id: string }> }>;
    
    render(await ProductPageCopy({ params }));
    
    // Check that the product client page is rendered
    expect(screen.getByTestId('mock-product-client-page')).toBeInTheDocument();
    expect(screen.getByTestId('product-id')).toHaveTextContent(testId);
  });
  
  it('passes the correct params to ProductClientPage', async () => {
    const testId = '123';
    const params = Promise.resolve({ id: testId });
    const ProductPageCopy = ProductPage as React.FC<{ params: Promise<{ id: string }> }>;
    
    render(await ProductPageCopy({ params }));
    
    // Log the actual call for debugging
    console.log('Product client page was called with:', lastReceivedProps);
    
    // Check that the correct params were passed
    expect(ProductClientPage).toHaveBeenCalled();
    expect(lastReceivedProps).toEqual({
      params: { id: testId }
    });
  });
  
  it('handles invalid product IDs', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const invalidId = 'invalid';
    const params = Promise.resolve({ id: invalidId });
    const ProductPageCopy = ProductPage as React.FC<{ params: Promise<{ id: string }> }>;
    
    render(await ProductPageCopy({ params }));
    
    // Check that console.error was called
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid product ID'),
      invalidId
    );
    
    consoleSpy.mockRestore();
  });
}); 