"use client";

import React from 'react';
import { Card, Button } from '@/components/common';
import { FiPlus, FiSearch, FiFilter, FiChevronDown } from 'react-icons/fi';

interface ListingPageProps {
  title: string;
  description: string;
  addButtonText: string;
  onAddClick: () => void;
  searchPlaceholder: string;
  onSearch: (query: string) => void;
  filters?: React.ReactNode;
  children: React.ReactNode;
}

export default function ListingPage({
  title,
  description,
  addButtonText,
  onAddClick,
  searchPlaceholder,
  onSearch,
  filters,
  children
}: ListingPageProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <Button
          variant="primary"
          onClick={onAddClick}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          {addButtonText}
        </Button>
      </div>

      {/* Search and Filters Section */}
      <Card variant="elevated" className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          {filters && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="flex items-center gap-2"
              >
                <FiFilter className="w-4 h-4" />
                Filters
                <FiChevronDown className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Content Section */}
      <Card variant="elevated" className="overflow-hidden">
        {children}
      </Card>
    </div>
  );
} 