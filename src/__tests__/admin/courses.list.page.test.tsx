import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CoursesList from '../../app/admin/courses/page';
import axiosClient from '@/lib/axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Course } from '@/types/course';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock axios client
jest.mock('@/lib/axios', () => ({
  get: jest.fn()
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

describe('CoursesList', () => {
  const mockCourses: Course[] = [
    {
      id: '1',
      title: 'Course 1',
      description: 'Description 1',
      max_price: 1000,
      discounted_price: 800,
      discount_percentage: 20,
      images: ['image1.jpg'],
      created_at: '2021-01-01',
      updated_at: '2021-01-01',
      subjects: [{ id: '1', title: 'Subject 1', description: 'Description 1', created_at: '2021-01-01', updated_at: '2021-01-01' }]
    },
    {
      id: '2',
      title: 'Course 2',
      description: 'Description 2',
      max_price: 2000,
      discounted_price: 1500,
      discount_percentage: 25,
      images: ['image2.jpg'],
      created_at: '2021-01-01',
      updated_at: '2021-01-01',
      subjects: [{ id: '2', title: 'Subject 2', description: 'Description 2', created_at: '2021-01-01', updated_at: '2021-01-01' }]
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({ data: { courses: mockCourses, pagination: { page: 1, limit: 10, totalCount: 2, hasNextPage: false, hasPrevPage: false } } });
  });

  it('renders the page title correctly', () => {
    renderWithClient(<CoursesList />);
    expect(screen.getByText(/courses/i)).toBeInTheDocument();
  });

  it('loads and displays courses', async () => {
    renderWithClient(<CoursesList />);

    // First check for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Then wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Course 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Course 2')).toBeInTheDocument();
  });

  it('displays course details correctly', async () => {
    renderWithClient(<CoursesList />);

    // First check for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Then wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Course 1')).toBeInTheDocument();
    });

    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('₹800')).toBeInTheDocument();
    expect(screen.getByText('₹1000')).toBeInTheDocument();
  });

  it('handles loading state', async () => {
    (axiosClient.get as jest.Mock).mockReset();
    (axiosClient.get as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    
    renderWithClient(<CoursesList />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (axiosClient.get as jest.Mock).mockReset();
    const errorMessage = 'Failed to load courses';
    (axiosClient.get as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

    renderWithClient(<CoursesList />);

    // First check for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Then wait for error state
    await waitFor(() => {
      expect(screen.getByText('No courses found')).toBeInTheDocument();
    });
  });

  it('displays empty state when no courses are available', async () => {
    (axiosClient.get as jest.Mock).mockReset();
    (axiosClient.get as jest.Mock).mockResolvedValueOnce({ data: { courses: [], pagination: { page: 1, limit: 10, totalCount: 0, hasNextPage: false, hasPrevPage: false } } });

    renderWithClient(<CoursesList />);

    // First check for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Then wait for empty state
    await waitFor(() => {
      expect(screen.getByText('No courses found')).toBeInTheDocument();
    });
  });

  it('navigates to new course page when add button is clicked', async () => {
    const user = userEvent.setup();
    renderWithClient(<CoursesList />);

    // First check for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Then wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Course 1')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Add Course'));
    expect(mockPush).toHaveBeenCalledWith('/admin/courses/new');
  });

  it('navigates to edit course page when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderWithClient(<CoursesList />);

    // First check for loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Then wait for courses to load
    await waitFor(() => {
      expect(screen.getByText('Course 1')).toBeInTheDocument();
    });

    // Find the edit button by its icon
    const editButton = screen.getByTestId('edit-button-1');
    await user.click(editButton);
    expect(mockPush).toHaveBeenCalledWith('/admin/courses/edit/1');
  });
}); 