import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseForm, { CourseFormData } from '../../components/admin/CourseForm';
import axiosClient from '@/lib/axios';
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

describe('CourseForm', () => {
  const mockInitialData: CourseFormData = {
    title: '',
    description: '',
    max_price: 0,
    discounted_price: 0,
    discount_percentage: 0,
    images: [],
    subjects: []
  };

  const mockSubjects = [
    { 
      id: '1', 
      title: 'Subject 1',
      description: 'Description for Subject 1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      images: []
    },
    { 
      id: '2', 
      title: 'Subject 2',
      description: 'Description for Subject 2',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      images: []
    }
  ];

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (axiosClient.get as jest.Mock).mockResolvedValue({ data: mockSubjects });
  });

  const renderCourseForm = (props = {}) => {
    return render(
      <CourseForm
        initialData={mockInitialData}
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        submitButtonText="Submit"
        error={null}
        subjects={mockSubjects}
        isLoadingSubjects={false}
        {...props}
      />
    );
  };

  it('renders all form fields correctly', () => {
    renderCourseForm();

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/maximum price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/discounted price/i)).toBeInTheDocument();
    expect(screen.getByText(/click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/available subjects/i)).toBeInTheDocument();
  });

  it('handles form submission with valid data', async () => {
    const user = userEvent.setup();
    renderCourseForm();

    // Fill in required fields
    await user.type(screen.getByLabelText(/title/i), 'Test Course');
    await user.type(screen.getByLabelText(/maximum price/i), '1000');
    await user.type(screen.getByLabelText(/discounted price/i), '800');

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Form should not submit without an image and at least one subject
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles image upload', async () => {
    const user = userEvent.setup();
    renderCourseForm();

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/click to upload/i, { selector: 'input[type="file"]' });
    await user.upload(input, file);
    expect(handleMultipleImageUpload).toHaveBeenCalled();
  });

  it('handles subject selection and reordering', async () => {
    const user = userEvent.setup();
    renderCourseForm();

    // Wait for subjects to load
    await waitFor(() => {
      expect(screen.getByText('Subject 1')).toBeInTheDocument();
    });

    // Add a subject
    await user.click(screen.getByText('Subject 1'));
    expect(screen.getByText('Selected Subjects')).toBeInTheDocument();

    // Remove a subject (find the red remove button in the selected subjects area)
    const selectedSubjects = screen.getByText('Selected Subjects').parentElement;
    if (!selectedSubjects) throw new Error('Selected Subjects container not found');
    const removeButtons = selectedSubjects.querySelectorAll('button');
    // The last button in the flex is the remove (red) button
    await user.click(removeButtons[removeButtons.length - 1]);
    // Instead of checking for heading removal, check that the subject is removed from the list
    const selectedSubjectsAfter = screen.getByText('Selected Subjects').parentElement;
    if (!selectedSubjectsAfter) throw new Error('Selected Subjects container not found after removal');
    expect(selectedSubjectsAfter.textContent).not.toContain('Subject 1');
  });

  it('calculates discount percentage correctly', async () => {
    const user = userEvent.setup();
    renderCourseForm();

    await user.type(screen.getByLabelText(/maximum price/i), '1000');
    await user.type(screen.getByLabelText(/discounted price/i), '800');

    // Discount percentage should be calculated automatically
    expect(screen.getByLabelText(/discount percentage/i)).toHaveValue(20);
  });

  it('shows create new button when showCreateNewButton is true', () => {
    renderCourseForm({ showCreateNewButton: true });
    expect(screen.getByText(/save & create new/i)).toBeInTheDocument();
  });

  it('disables submit button when isSubmitting is true', () => {
    renderCourseForm({ isSubmitting: true });
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Test error message';
    renderCourseForm({ error: errorMessage });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles image removal', async () => {
    const user = userEvent.setup();
    const initialDataWithImage: CourseFormData = {
      ...mockInitialData,
      images: ['test-image.jpg']
    };

    renderCourseForm({ initialData: initialDataWithImage });

    // Find and click the remove image button (red button in image container)
    const imageContainer = screen.getByAltText(/course image/i).parentElement;
    if (!imageContainer) throw new Error('Image container not found');
    const removeButton = imageContainer.querySelector('button');
    if (!removeButton) throw new Error('Remove button not found');
    await user.click(removeButton);

    // Image should be removed
    expect(screen.queryByAltText(/course image/i)).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderCourseForm();

    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Form should not submit
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
}); 