import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditCourse from '../../app/admin/courses/edit/[id]/page';
import axiosClient from '@/lib/axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Course } from '@/types/course';
import { CourseFormData } from '@/components/admin/CourseForm';
import { act } from 'react';

// Mock axios client
jest.mock('@/lib/axios', () => ({
  get: jest.fn(),
  put: jest.fn()
}));

// Mock CourseForm component
jest.mock('@/components/admin/CourseForm', () => {
  return function MockCourseForm({ onSubmit, error, initialData }: { 
    onSubmit: (data: CourseFormData) => void; 
    error: string | null;
    initialData: CourseFormData;
  }) {
    if (!initialData) return null;
    return (
      <div>
        <div>Initial Title: {initialData.title}</div>
        <button onClick={() => onSubmit({ 
          title: 'Updated Course', 
          description: 'Updated Description',
          max_price: 1000,
          discounted_price: 800,
          discount_percentage: 20,
          images: ['image1.jpg'],
          subjects: [{ id: '1', order: 1 }]
        })}>Submit</button>
        {error && <div>{error}</div>}
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

describe('EditCourse', () => {
  const mockCourse: Course = {
    id: '1',
    title: 'Test Course',
    description: 'Test Description',
    max_price: 1000,
    discounted_price: 800,
    discount_percentage: 20,
    images: ['image1.jpg'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    subjects: [{ 
      id: '1', 
      title: 'Subject 1',
      description: 'Subject Description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]
  };

  const mockSubjects = {
    subjects: [
      {
        id: '1',
        title: 'Subject 1',
        description: 'Subject Description',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    pagination: {
      page: 1,
      limit: 100,
      totalCount: 1,
      hasNextPage: false,
      hasPrevPage: false
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (axiosClient.get as jest.Mock)
      .mockResolvedValueOnce({ data: mockCourse }) // First call for course
      .mockResolvedValueOnce({ data: mockSubjects }); // Second call for subjects
  });

  it('renders the page title correctly', async () => {
    await act(async () => {
      renderWithClient(<EditCourse params={Promise.resolve({ id: '1' })} />);
    });
    await waitFor(() => {
      expect(screen.getByText(/edit course/i)).toBeInTheDocument();
    });
  });

  it('loads course data on mount', async () => {
    await act(async () => {
      renderWithClient(<EditCourse params={Promise.resolve({ id: '1' })} />);
    });

    await waitFor(() => {
      expect(axiosClient.get).toHaveBeenCalledWith('/api/courses/1');
    });

    expect(screen.getByText(/initial title: test course/i)).toBeInTheDocument();
  });

  it('handles successful course update', async () => {
    const user = userEvent.setup();
    (axiosClient.put as jest.Mock).mockResolvedValueOnce({ data: { id: '1' } });

    await act(async () => {
      renderWithClient(<EditCourse params={Promise.resolve({ id: '1' })} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/initial title: test course/i)).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByText(/submit/i));
    });

    await waitFor(() => {
      expect(axiosClient.put).toHaveBeenCalledWith('/api/courses/1', expect.any(Object));
    });
  });

  it('handles course update error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to update course';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (axiosClient.put as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    await act(async () => {
      renderWithClient(<EditCourse params={Promise.resolve({ id: '1' })} />);
    });

    await screen.findByText(/initial title: test course/i);

    await act(async () => {
      try {
        await user.click(screen.getByText(/submit/i)).catch(() => {});
      } catch {
        // Suppress error
      }
    });

    await screen.findByText(errorMessage);
    consoleErrorSpy.mockRestore();
  });

  it('handles course not found', async () => {
    // Override the default mock after beforeEach
    (axiosClient.get as jest.Mock).mockReset();
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 404,
        data: { message: 'Course not found' }
      }
    };
    (axiosClient.get as jest.Mock)
      .mockRejectedValueOnce(axiosError) // course fetch
      .mockResolvedValueOnce({ data: mockSubjects }); // subjects fetch

    await act(async () => {
      renderWithClient(<EditCourse params={Promise.resolve({ id: '1' })} />);
    });

    // Wait for the loading spinner to disappear
    await waitFor(() => {
      expect(screen.queryByText('Loading course...')).not.toBeInTheDocument();
    });

    // Now check for the error UI
    expect(screen.getByText('Course not found')).toBeInTheDocument();
    expect(screen.queryByText(/initial title:/i)).not.toBeInTheDocument();
  });

  it('shows loading state while fetching course data', async () => {
    (axiosClient.get as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));

    await act(async () => {
      renderWithClient(<EditCourse params={Promise.resolve({ id: '1' })} />);
    });

    // Check for the loading spinner and text
    expect(screen.getByText('Loading course...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
}); 