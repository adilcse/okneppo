import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewCourse from '../../app/admin/courses/new/page';
import axiosClient from '@/lib/axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Subject } from '@/types/course';
import { CourseFormData } from '@/components/admin/CourseForm';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock axios client
jest.mock('@/lib/axios', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

// Mock CourseForm component
jest.mock('@/components/admin/CourseForm', () => {
  return function MockCourseForm({ 
    onSubmit, 
    error, 
    isSubmitting, 
    submitButtonText,
    showCreateNewButton,
    subjects,
    isLoadingSubjects 
  }: { 
    onSubmit: (data: CourseFormData, createNew?: boolean) => void; 
    error: string | null;
    isSubmitting: boolean;
    submitButtonText: string;
    showCreateNewButton: boolean;
    subjects: Subject[];
    isLoadingSubjects: boolean;
  }) {
    return (
      <div>
        <button onClick={() => onSubmit({
          title: 'Test Course',
          description: 'Test Description',
          max_price: 1000,
          discounted_price: 800,
          discount_percentage: 20,
          images: ['test.jpg'],
          subjects: []
        })}>
          {submitButtonText}
        </button>
        {showCreateNewButton && (
          <button onClick={() => onSubmit({
            title: 'Test Course',
            description: 'Test Description',
            max_price: 1000,
            discounted_price: 800,
            discount_percentage: 20,
            images: ['test.jpg'],
            subjects: []
          }, true)}>
            Create & Add Another
          </button>
        )}
        {error && <div>{error}</div>}
        {isSubmitting && <div>Submitting...</div>}
        {isLoadingSubjects && <div>Loading subjects...</div>}
        {subjects.map(subject => (
          <div key={subject.id}>{subject.title}</div>
        ))}
      </div>
    );
  };
});

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

describe('NewCourse', () => {
  const mockSubjects: Subject[] = [
    {
      id: '1',
      title: 'Subject 1',
      description: 'Description 1',
      created_at: '2021-01-01',
      updated_at: '2021-01-01'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({ 
      data: { 
        subjects: mockSubjects,
        pagination: {
          page: 1,
          limit: 100,
          totalCount: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false
        }
      } 
    });
  });

  it('renders the page title correctly', () => {
    renderWithClient(<NewCourse />);
    expect(screen.getByText(/new course/i)).toBeInTheDocument();
  });

  it('handles successful course creation', async () => {
    const user = userEvent.setup();
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: '1' } });

    renderWithClient(<NewCourse />);

    // Wait for subjects to load
    await waitFor(() => {
      expect(screen.getByText('Subject 1')).toBeInTheDocument();
    });

    // Submit the form
    await user.click(screen.getByText('Create Course'));

    // Check if the API was called
    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith('/api/courses', expect.any(Object));
    });

    // Check if redirected to courses list
    expect(mockPush).toHaveBeenCalledWith('/admin/courses');
  });


  it('handles save and create new functionality', async () => {
    const user = userEvent.setup();
    (axiosClient.post as jest.Mock).mockResolvedValueOnce({ data: { id: '1' } });

    renderWithClient(<NewCourse />);

    // Wait for subjects to load
    await waitFor(() => {
      expect(screen.getByText('Subject 1')).toBeInTheDocument();
    });

    // Submit the form with createNew flag
    await user.click(screen.getByText('Create & Add Another'));

    // Check if the API was called with createNew flag
    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith('/api/courses', expect.objectContaining({
        createNew: true
      }));
    });

    // Check that we're not redirected
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows loading state for subjects', async () => {
    (axiosClient.get as jest.Mock).mockReset();
    (axiosClient.get as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    renderWithClient(<NewCourse />);

    expect(screen.getByText('Loading subjects...')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    (axiosClient.post as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    renderWithClient(<NewCourse />);

    // Wait for subjects to load
    await waitFor(() => {
      expect(screen.getByText('Subject 1')).toBeInTheDocument();
    });

    // Submit the form
    await user.click(screen.getByText('Create Course'));

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });
}); 