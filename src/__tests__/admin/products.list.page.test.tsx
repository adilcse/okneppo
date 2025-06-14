import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductList from '../../app/admin/products/page';
import axiosClient from '@/lib/axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
// Global push mock for router
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

// Mock axios client
jest.mock('@/lib/axios', () => ({
  get: jest.fn(),
  delete: jest.fn()
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('ProductList', () => {
  const mockProducts = {
    products: [
      {
        id: '1',
        name: 'Product 1',
        price: 1000,
        category: 'Category 1',
        description: 'Description 1',
        images: ['image1.jpg'],
        details: ['Detail 1'],
        careInstructions: 'Care 1',
        deliveryTime: '1-2 weeks',
        featured: false
      },
      {
        id: '2',
        name: 'Product 2',
        price: 2000,
        category: 'Category 2',
        description: 'Description 2',
        images: ['image2.jpg'],
        details: ['Detail 2'],
        careInstructions: 'Care 2',
        deliveryTime: '2-3 weeks',
        featured: true
      }
    ],
    pagination: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({ data: mockProducts });
    window.confirm = jest.fn(() => true);
  });

  it('renders the product list page correctly', async () => {
    await act(async () => {
      renderWithClient(<ProductList />);
    });
    // Wait for products to load
    await screen.findByText(/products/i);
    expect(screen.getByText(/add product/i)).toBeInTheDocument();
    // Use getAllByText to handle multiple matches and check the first product cell
    const product1Cells = await screen.findAllByText(/product 1/i);
    const product2Cells = await screen.findAllByText(/product 2/i);
    expect(product1Cells.length).toBeGreaterThan(0);
    expect(product2Cells.length).toBeGreaterThan(0);
  });

  it('navigates to create product page when create button is clicked', async () => {
    const user = userEvent.setup();
    await act(async () => {
      renderWithClient(<ProductList />);
    });
    await screen.findByText(/add product/i);
    await user.click(screen.getByText(/add product/i));
    expect(pushMock).toHaveBeenCalledWith('/admin/products/new');
  });

  it('handles product deletion', async () => {
    const user = userEvent.setup();
    (axiosClient.delete as jest.Mock).mockResolvedValueOnce({});
    await act(async () => {
      renderWithClient(<ProductList />);
    });
    // Wait for products to load
    await screen.findByText(/products/i);
    // Find delete button by its role and aria-label
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && button.className.includes('text-red')
    );
    expect(deleteButton).toBeTruthy();
    await user.click(deleteButton!);
    expect(axiosClient.delete).toHaveBeenCalledWith('/api/products/1');
  });

  it('shows loading state while fetching products', async () => {
    (axiosClient.get as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    await act(async () => {
      renderWithClient(<ProductList />);
    });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state when products fetch fails', async () => {
    (axiosClient.get as jest.Mock).mockReset();
    const error = new Error('Failed to fetch products');
    (axiosClient.get as jest.Mock).mockRejectedValueOnce(error);
    
    await act(async () => {
      renderWithClient(<ProductList />);
    });
    
    // First check for loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for the loading state to disappear
    await waitFor(
      () => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      },
      { timeout: 6000, interval: 100 }
    );

    // Then check for the empty state message
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });
}); 