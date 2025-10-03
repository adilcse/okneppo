"use client";

import React from 'react';
import Link from 'next/link';
import { FiBook, FiUsers, FiSettings, FiBarChart2 } from 'react-icons/fi';

export default function AppManagementPage() {
  const appModules = [
    {
      title: 'Courses',
      description: 'Manage app courses, create new courses, edit existing ones',
      icon: FiBook,
      href: '/admin/app/courses',
      color: 'bg-blue-500'
    },
    {
      title: 'Users',
      description: 'Manage app users, view user profiles and activity',
      icon: FiUsers,
      href: '/admin/app/users',
      color: 'bg-green-500'
    },
    {
      title: 'Analytics',
      description: 'View app analytics, user engagement metrics',
      icon: FiBarChart2,
      href: '/admin/app/analytics',
      color: 'bg-purple-500'
    },
    {
      title: 'Settings',
      description: 'Configure app settings and preferences',
      icon: FiSettings,
      href: '/admin/app/settings',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">App Management</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage your mobile app content, users, and settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {appModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Link
              key={module.title}
              href={module.href}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 group"
            >
              <div className="flex items-center space-x-4">
                <div className={`${module.color} p-3 rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Courses</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Active Users</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Enrollments</div>
          </div>
        </div>
      </div>
    </div>
  );
}
