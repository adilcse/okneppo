import React, { useState } from 'react';
import DataGrid, { ColumnDef } from './DataGrid';

// Example interface for demonstration
interface ExampleItem {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Example data
const exampleData: ExampleItem[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', createdAt: '2024-01-01' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', createdAt: '2024-01-02' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active', createdAt: '2024-01-03' },
];

// Example pagination info
const examplePagination = {
  page: 1,
  limit: 10,
  totalCount: 3,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export default function DataGridExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
  };

  const handleRowClick = (item: ExampleItem) => {
    console.log('Clicked item:', item);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  // Define columns
  const columns: ColumnDef<ExampleItem>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (item: ExampleItem) => (
        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (item: ExampleItem) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          item.status === 'active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Created At',
      sortable: true,
    }
  ];

  return (
    <DataGrid
      data={exampleData}
      columns={columns}
      pagination={examplePagination}
      
      // Sorting
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSort={handleSort}
      
      // Row interactions
      onRowClick={handleRowClick}
      
      // Search
      searchTerm={searchTerm}
      onSearchChange={handleSearch}
      searchPlaceholder="Search by name or email..."
      showSearch={true}
      
      // Title
      title="Example Data Grid"
      showTitle={true}
    />
  );
}
