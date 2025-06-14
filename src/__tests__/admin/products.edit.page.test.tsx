import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditProduct from '../../app/admin/products/edit/[id]/page';
import axiosClient from '@/lib/axios';
// import { ProductFormData } from '@/components/admin/ProductForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock axios client
jest.mock('@/lib/axios', () => ({
  get: jest.fn(),
  put: jest.fn()
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('EditProduct', () => {
  const mockProduct = {
    id: '123',
    name: 'Test Product',
    price: 1000,
    category: 'Test Category',
    description: 'Test Description',
    images: ['test-image.jpg'],
    details: ['Test Detail'],
    careInstructions: 'Test Care',
    deliveryTime: '1-2 weeks',
    featured: false
  };

  const mockCategories = {
    categories: ['Test Category', 'Another Category']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.on('unhandledRejection', (reason) => {
      console.log('Unhandled rejection:', reason);
    });
    // Mock product fetch
    (axiosClient.get as jest.Mock).mockImplementation((url) => {
      if (url === '/api/products/123') {
        return Promise.resolve({ data: mockProduct });
      }
      if (url === '/api/categories') {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders the edit product page correctly', async () => {
    await act(async () => {
      renderWithClient(<EditProduct params={Promise.resolve({ id: '123' })} />);
    });

    // Wait for product data to load
    await waitFor(() => {
      expect(screen.getByText(/edit product/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/back to products/i)).toBeInTheDocument();
    expect(screen.getByText(/save changes/i)).toBeInTheDocument();
  });

  it('handles successful product update', async () => {
    const user = userEvent.setup();
    (axiosClient.put as jest.Mock).mockResolvedValueOnce({ data: { id: '123' } });

    await act(async () => {
      renderWithClient(<EditProduct params={Promise.resolve({ id: '123' })} />);
    });

    // Wait for product data to load
    await waitFor(() => {
      expect(screen.getByText(/save changes/i)).toBeInTheDocument();
    });

    // Fill in the form
    await user.type(screen.getByLabelText(/product name/i), 'Updated Product');
    await user.type(screen.getByLabelText(/price/i), '2000');
    await user.type(screen.getByLabelText(/category/i), 'Updated Category');
    await user.type(screen.getByLabelText(/description/i), 'Updated Description');

    // Submit form
    await user.click(screen.getByText(/save changes/i));

    await waitFor(() => {
      expect(axiosClient.put).toHaveBeenCalledWith('/api/products/123', expect.any(Object));
    });
  });

  it('handles product update error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to update product';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the put request to reject with an error
    (axiosClient.put as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    await act(async () => {
      renderWithClient(<EditProduct params={Promise.resolve({ id: '123' })} />);
    });

    // Wait for product data to load
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    });

    // Fill in the form
    await user.type(screen.getByLabelText(/product name/i), 'Updated Product');
    await user.type(screen.getByLabelText(/price/i), '2000');
    await user.type(screen.getByLabelText(/category/i), 'Updated Category');
    await user.type(screen.getByLabelText(/description/i), 'Updated Description');

    // Submit form
    await user.click(screen.getByTestId('submit-button'));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
    });

    consoleErrorSpy.mockRestore();
  });

  it('shows loading state while fetching product data', async () => {
    (axiosClient.get as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    await act(async () => {
      renderWithClient(<EditProduct params={Promise.resolve({ id: '123' })} />);
    });
    expect(screen.getByText(/loading product/i)).toBeInTheDocument();
  });

  it('shows error state when product is not found', async () => {
    // Mock failed product fetch
    (axiosClient.get as jest.Mock).mockReset();
    (axiosClient.get as jest.Mock).mockRejectedValueOnce(new Error('Product not found'));
    
    await act(async () => {
      renderWithClient(<EditProduct params={Promise.resolve({ id: '123' })} />);
    });

    // First wait for loading state to disappear
    await waitFor(() => {
      expect(screen.queryByText(/loading product/i)).not.toBeInTheDocument();
    });

    // Then check for error message
    await waitFor(() => {
      expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    });
  });
}); 