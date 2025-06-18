import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewProduct from '@/app/admin/products/new/page';
import axiosClient from '@/lib/axios';

// Mock the TinyMCE editor
jest.mock('@tinymce/tinymce-react', () => ({
  Editor: ({ value, onEditorChange, id }: { value: string; onEditorChange: (content: string) => void; id: string }) => (
    <textarea
      id={id}
      data-testid={`tinymce-${id}`}
      value={value}
      onChange={(e) => onEditorChange(e.target.value)}
      style={{ visibility: 'hidden' }}
    />
  )
}));

// Mock axios
jest.mock('@/lib/axios');

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock image upload
jest.mock('@/lib/imageUpload', () => ({
  handleMultipleImageUpload: jest.fn((files, { onSuccess }) => {
    if (onSuccess) {
      Array.from(files).forEach((_, i) => onSuccess(`test-image-${i}.jpg`));
    }
    return Promise.resolve();
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('NewProduct', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    // Mock categories API response
    (axiosClient.get as jest.Mock).mockResolvedValue({
      data: { categories: ['Test Category', 'Another Category'] }
    });
  });

  it('renders the new product page correctly', async () => {
    renderWithClient(<NewProduct />);
    expect(screen.getByText(/new product/i)).toBeInTheDocument();
    expect(screen.getByText(/back to products/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
    });
  });

  it('handles successful product creation', async () => {
    const user = userEvent.setup();
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: '123' } });

    renderWithClient(<NewProduct />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    // Fill in the form
    await user.type(screen.getByLabelText(/name/i), 'Test Product');
    await user.type(screen.getByLabelText(/price/i), '1000');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Test Category');
    
    // Handle TinyMCE editors
    const descriptionEditor = screen.getByTestId('tinymce-description');
    await user.type(descriptionEditor, 'Test Description');
    
    const careInstructionsEditor = screen.getByTestId('tinymce-careInstructions');
    await user.type(careInstructionsEditor, 'Test Care');
    
    await user.type(screen.getByLabelText(/delivery time/i), '1-2 weeks');

    // Upload image
    const fileInput = screen.getByLabelText(/click to upload/i);
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    // Submit form
    await user.click(screen.getByRole('button', { name: /create product/i }));

    // Check if the API was called with correct data
    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith('/api/products', expect.objectContaining({
        name: 'Test Product',
        price: '1000',
        category: 'Test Category',
        description: 'Test Description',
        careInstructions: 'Test Care',
        deliveryTime: '1-2 weeks',
        images: ['test-image-0.jpg']
      }));
    });

    // Check if redirected to products list
    expect(mockPush).toHaveBeenCalledWith('/admin/products');
  });

  it('handles product creation error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to create product';
    (axiosClient.post as jest.Mock).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          message: errorMessage
        },
        status: 500
      }
    });

    renderWithClient(<NewProduct />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    // Fill in the form
    await user.type(screen.getByLabelText(/name/i), 'Test Product');
    await user.type(screen.getByLabelText(/price/i), '1000');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Test Category');
    
    // Handle TinyMCE editors
    const descriptionEditor = screen.getByTestId('tinymce-description');
    await user.type(descriptionEditor, 'Test Description');
    
    const careInstructionsEditor = screen.getByTestId('tinymce-careInstructions');
    await user.type(careInstructionsEditor, 'Test Care');
    
    await user.type(screen.getByLabelText(/delivery time/i), '1-2 weeks');

    // Upload image
    const fileInput = screen.getByLabelText(/click to upload/i);
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create product/i });
    await user.click(submitButton);

    // Wait for the error message to be displayed
    try {
      await waitFor(() => {
        const errorElement = screen.getByTestId('error-message');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent(errorMessage);
      }, { timeout: 1000 });
    } catch (error: unknown) {
      console.error(error);
      // If the error message is not displayed, fail the test
      throw new Error('Error message not displayed');
    }

    // Check that we're not redirected
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles save and create new functionality', async () => {
    const user = userEvent.setup();
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: '123' } });

    renderWithClient(<NewProduct />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    // Fill in the form
    await user.type(screen.getByLabelText(/name/i), 'Test Product');
    await user.type(screen.getByLabelText(/price/i), '1000');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Test Category');
    
    // Handle TinyMCE editors
    const descriptionEditor = screen.getByTestId('tinymce-description');
    await user.type(descriptionEditor, 'Test Description');
    
    const careInstructionsEditor = screen.getByTestId('tinymce-careInstructions');
    await user.type(careInstructionsEditor, 'Test Care');
    
    await user.type(screen.getByLabelText(/delivery time/i), '1-2 weeks');

    // Upload image
    const fileInput = screen.getByLabelText(/click to upload/i);
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    // Click Save & Create New button
    await user.click(screen.getByRole('button', { name: /save & create new/i }));

    // Check if the API was called with createNew flag and correct data
    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith('/api/products', expect.objectContaining({
        name: 'Test Product',
        price: '1000',
        category: 'Test Category',
        description: 'Test Description',
        careInstructions: 'Test Care',
        deliveryTime: '1-2 weeks',
        createNew: true,
        images: ['test-image-0.jpg']
      }));
    });

    // Check that we're not redirected
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    (axiosClient.post as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    renderWithClient(<NewProduct />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    // Fill in the form
    await user.type(screen.getByLabelText(/name/i), 'Test Product');
    await user.type(screen.getByLabelText(/price/i), '1000');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Test Category');
    
    // Handle TinyMCE editors
    const descriptionEditor = screen.getByTestId('tinymce-description');
    await user.type(descriptionEditor, 'Test Description');
    
    const careInstructionsEditor = screen.getByTestId('tinymce-careInstructions');
    await user.type(careInstructionsEditor, 'Test Care');
    
    await user.type(screen.getByLabelText(/delivery time/i), '1-2 weeks');

    // Upload image
    const fileInput = screen.getByLabelText(/click to upload/i);
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await user.upload(fileInput, file);

    // Submit form
    await user.click(screen.getByRole('button', { name: /create product/i }));

    // Check for loading state
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeDisabled();
      expect(screen.getByTestId('submit-button')).toHaveTextContent(/saving/i);
    });
  });
}); 