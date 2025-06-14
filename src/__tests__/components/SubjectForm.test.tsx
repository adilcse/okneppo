import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubjectForm, { SubjectFormData } from '../../components/admin/SubjectForm';
import { handleMultipleImageUpload } from '@/lib/imageUpload';

// Mock axios client
jest.mock('@/lib/axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn()
}));

// Mock image upload utility
jest.mock('@/lib/imageUpload', () => ({
  handleMultipleImageUpload: jest.fn()
}));

// Mock removeImageFromUrl utility
jest.mock('@/lib/clientUtils', () => ({
  removeImageFromUrl: jest.fn().mockResolvedValue(true)
}));

describe('SubjectForm', () => {
  const mockInitialData: SubjectFormData = {
    title: '',
    description: '',
    images: []
  };

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSubjectForm = (props = {}) => {
    return render(
      <SubjectForm
        initialData={mockInitialData}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        submitButtonText="Submit"
        error={null}
        {...props}
      />
    );
  };

  it('renders all form fields correctly', () => {
    renderSubjectForm();

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    // Instead of label for images, check for upload button text
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    const user = userEvent.setup();
    renderSubjectForm();

    // Fill in required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Subject');
    await user.type(screen.getByLabelText(/description/i), 'Test Description');

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Form should not submit without an image
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles image upload', async () => {
    const user = userEvent.setup();
    renderSubjectForm();

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/click to upload/i, { selector: 'input[type="file"]' });
    await user.upload(input, file);
    // Check that the upload handler was called
    expect(handleMultipleImageUpload).toHaveBeenCalled();
  });

  it('shows create new button when showCreateNewButton is true', () => {
    renderSubjectForm({ showCreateNewButton: true });
    expect(screen.getByText(/save & create new/i)).toBeInTheDocument();
  });

  it('disables submit button when isSubmitting is true', () => {
    renderSubjectForm({ isSubmitting: true });
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Test error message';
    renderSubjectForm({ error: errorMessage });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles image removal', async () => {
    const user = userEvent.setup();
    const initialDataWithImage: SubjectFormData = {
      ...mockInitialData,
      images: ['test-image.jpg']
    };

    renderSubjectForm({ initialData: initialDataWithImage });

    // Find and click the remove image button (red button in image container)
    const imageContainer = screen.getByAltText(/subject image/i).parentElement;
    if (!imageContainer) throw new Error('Image container not found');
    const removeButton = imageContainer.querySelector('button');
    if (!removeButton) throw new Error('Remove button not found');
    await user.click(removeButton);

    // Image should be removed
    expect(screen.queryByAltText(/subject image/i)).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderSubjectForm();

    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Form should not submit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 