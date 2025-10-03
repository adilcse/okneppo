# App Management Setup Guide

This guide explains how to set up and use the App Management feature in the Okneppo admin panel.

## Overview

The App Management section allows you to manage your mobile app content, including courses, users, and analytics. It connects to an external API to handle all app-related operations.

## Environment Setup

### Required Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
# App API Configuration
NEXT_PUBLIC_APP_URL=https://your-app-api-url.com
```

Replace `https://your-app-api-url.com` with your actual app API URL.

## Features

### 1. Course Management

- **View Courses**: Browse all courses with pagination, search, and sorting
- **Create Course**: Add new courses with title, description, price, thumbnail, duration, level, and category
- **Edit Course**: Update existing course information
- **Delete Course**: Remove courses from the system
- **Course Analytics**: View course statistics and metrics

### 2. User Management (Future)

- View app users
- Manage user profiles
- Track user activity

### 3. Analytics (Future)

- App usage statistics
- Course performance metrics
- User engagement data

## API Integration

The app management system uses the `appApi` client located at `src/lib/appApi.ts` to communicate with your external API.

### API Endpoints

The system expects the following API endpoints:

#### Courses
- `GET /courses` - List courses with pagination and filtering
- `GET /courses/:id` - Get course details
- `POST /courses` - Create new course
- `PUT /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course

#### Authentication
The API client automatically handles authentication using the admin token from cookies. No manual token setting is required - the system uses the same authentication as your main admin panel.

```typescript
import appApi from '@/lib/appApi';

// Authentication is handled automatically via cookies
// No need to set tokens manually
```

## Usage

### Accessing App Management

1. Navigate to the admin panel
2. Click on "App Management" in the sidebar
3. Select the module you want to manage (Courses, Users, Analytics, Settings)

### Managing Courses

1. **View Courses**: Go to App Management > Courses to see all courses
2. **Create Course**: Click "New Course" button and fill in the form
3. **Edit Course**: Click on a course row or use the edit button
4. **Delete Course**: Use the delete button (with confirmation)

### Course Form Fields

- **Title** (required): Course title (3-200 characters)
- **Description** (required): Course description (10-2000 characters)
- **Price** (required): Course price in rupees
- **Thumbnail**: URL to course thumbnail image
- **Duration**: Course duration in minutes
- **Level**: Difficulty level (Beginner, Intermediate, Advanced)
- **Category**: Course category
- **Total Lessons**: Number of lessons in the course
- **Published Status**: Whether the course is published or draft
- **Rating**: Course rating (0-5 stars)
- **Total Students**: Number of enrolled students

## DataGrid Features

The course list uses a powerful DataGrid component with:

- **Sorting**: Click column headers to sort
- **Search**: Real-time search across course titles and categories
- **Pagination**: Navigate through large datasets
- **Responsive Design**: Works on all screen sizes
- **Dark Mode**: Full dark mode support

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Displays user-friendly messages for connection issues
- **Validation Errors**: Shows field-specific validation messages
- **API Errors**: Displays server error messages
- **Loading States**: Shows loading indicators during API calls

## Security

- All API calls use HTTPS
- Bearer token authentication
- Input validation and sanitization
- CSRF protection through Next.js

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check if `NEXT_PUBLIC_APP_URL` is set correctly
   - Verify the API server is running
   - Check network connectivity

2. **Authentication Errors**
   - Ensure the Bearer token is valid
   - Check token expiration
   - Verify API authentication setup

3. **Data Not Loading**
   - Check browser console for errors
   - Verify API response format
   - Check network tab for failed requests

### Debug Mode

Enable debug logging by checking the browser console. The app API client logs all requests and responses.

## Future Enhancements

- User management interface
- Analytics dashboard
- Bulk operations
- Export functionality
- Advanced filtering
- Real-time updates

## Support

For issues or questions about the App Management feature, check:

1. Browser console for error messages
2. Network tab for API request/response details
3. This documentation for setup instructions
4. API documentation for endpoint specifications
