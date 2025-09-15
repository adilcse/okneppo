"use client";

import React, { ReactNode } from 'react';
import { Card, Button } from '@/components/common';
import { FiPlus, FiSearch, FiFilter, FiChevronDown } from 'react-icons/fi';
import Input from '@/components/common/Input';

interface ListingPageProps {
  title: string;
  description: string;
  addButtonText: string;
  onAddClick: () => void;
  searchPlaceholder: string;
  onSearch: (value: string) => void;
  filters?: ReactNode;
  children: ReactNode;
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
    <div className="space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{title}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <Button
          variant="primary"
          onClick={onAddClick}
          className="flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <FiPlus className="w-4 h-4" />
          <span className="hidden sm:inline">{addButtonText}</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Search and Filters Section */}
      <Card variant="elevated" className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <Input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              leftIcon={<FiSearch className="w-4 h-4 md:w-5 md:h-5" />}
              className="w-full"
            />
          </div>
          {filters && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <FiFilter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filter</span>
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