"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/common';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell
} from 'recharts';
import axiosClient from '@/lib/axios';

interface CourseStats {
  course_title: string;
  course_id: number;
  payment_count: number;
  total_amount: number;
  average_amount: number;
  [key: string]: string | number; // Add index signature for recharts compatibility
}

interface DailyStats {
  payment_date: string;
  status: string;
  payment_count: number;
  total_amount: number;
  average_amount: number;
}

interface StatusStats {
  status: string;
  payment_count: number;
  total_amount: number;
  average_amount: number;
}

interface PaymentStatsData {
  courseStats: CourseStats[];
  totalStats: {
    totalPayments: number;
    totalAmount: number;
    averageAmount: number;
  };
  period: string;
}

interface DailyPaymentStatsData {
  dailyStats: DailyStats[];
  statusStats: StatusStats[];
  totalStats: {
    totalPayments: number;
    capturedAmount: number;
    failedAmount: number;
    pendingAmount: number;
    averageCapturedAmount: number;
  };
  period: string;
}

const fetchPaymentStats = async (period: string) => {
  const response = await axiosClient.get(`/api/payments/course-stats?period=${period}`);
  return response.data && response.data?.success ? response.data.data as PaymentStatsData : null;
};

const fetchDailyPaymentStats = async (period: string) => {
  const response = await axiosClient.get(`/api/payments/daily-stats?period=${period}`);
  return response.data && response.data?.success ? response.data.data as DailyPaymentStatsData : null;
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

// Status-specific colors
const STATUS_COLORS = {
  captured: '#10B981', // Green
  failed: '#EF4444',   // Red
  pending: '#F59E0B',  // Orange
  cancelled: '#6B7280', // Gray
  created: '#3B82F6',  // Blue
  authorized: '#8B5CF6' // Purple
};

export default function PaymentChart() {
  const [period, setPeriod] = useState<'7days' | '30days' | 'all'>('30days');
  const [viewType, setViewType] = useState<'course' | 'daily' | 'status'>('daily');

  const { data, isLoading, error } = useQuery({
    queryKey: ['payment-stats', viewType, period],
    queryFn: async () => {
      if (viewType === 'course') {
        return await fetchPaymentStats(period);
      } else {
        return await fetchDailyPaymentStats(period);
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const monthShort = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${monthShort}`;
  };

  // Transform daily data for multi-line chart
  const transformDailyData = (dailyStats: DailyStats[]) => {
    const dateMap = new Map();
    
    // Group data by date
    dailyStats.forEach(stat => {
      const date = stat.payment_date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { payment_date: date });
      }
      dateMap.get(date)[stat.status] = stat.total_amount;
    });
    
    return Array.from(dateMap.values());
  };


  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'total_amount') {
      return [formatCurrency(value), 'Total Amount'];
    }
    if (name === 'payment_count') {
      return [value, 'Payments'];
    }
    return [value, name];
  };

  if (error) {
    return (
      <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
        <div className="text-center text-red-600 dark:text-red-400">
          <p>Failed to load payment statistics</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="p-6 bg-white dark:bg-gray-800">
      <div className="space-y-6">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Analytics</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Payment amounts captured by course
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Type Toggle */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              {(['course', 'daily', 'status'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewType(v)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    viewType === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {v === 'course' ? 'By Course' : v === 'daily' ? 'Daily' : 'By Status'}
                </button>
              ))}
            </div>

            {/* Period Filter */}
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              {(['7days', '30days', 'all'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    period === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : 'All Time'}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Summary Stats */}
        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {viewType === 'course' ? (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Payments</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {(data as PaymentStatsData).totalStats?.totalPayments}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Total Amount</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {formatCurrency((data as PaymentStatsData).totalStats?.totalAmount)}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">Average Amount</h3>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {formatCurrency((data as PaymentStatsData).totalStats?.averageAmount)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Captured Payments</h3>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {(data as DailyPaymentStatsData).statusStats?.find(s => s.status === 'captured')?.payment_count || 0}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-red-700 dark:text-red-300">Unsuccessful Payments</h3>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {((data as DailyPaymentStatsData).statusStats
                      ?.filter(s => s.status !== 'captured')
                      ?.reduce((sum, s) => sum + Number(s.payment_count || 0), 0)) || 0}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300">Captured Amount</h3>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency((data as DailyPaymentStatsData).totalStats?.capturedAmount)}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Chart */}
        <div className="h-96">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ) : data && (
            <ResponsiveContainer width="100%" height="100%">
              {viewType === 'course' && (data as PaymentStatsData).courseStats?.length > 0 ? (
                <BarChart data={(data as PaymentStatsData).courseStats}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="course_title" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    fontSize={12}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip 
                    formatter={formatTooltipValue}
                    labelFormatter={(label) => `Course: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: '#374151'
                    }}
                    labelStyle={{
                      color: '#374151',
                      fontWeight: '600'
                    }}
                    wrapperStyle={{
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                    }}
                  />
                  <Bar 
                    dataKey="total_amount" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : viewType === 'daily' && (data as DailyPaymentStatsData).dailyStats?.length > 0 ? (
                <LineChart data={transformDailyData((data as DailyPaymentStatsData).dailyStats)}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="payment_date" 
                    tickFormatter={formatDate}
                    fontSize={12}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    fontSize={12}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(Number(value)), name]}
                    labelFormatter={(label) => `Date: ${formatDate(label)}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: '#374151'
                    }}
                    labelStyle={{
                      color: '#374151',
                      fontWeight: '600'
                    }}
                    wrapperStyle={{
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="captured" 
                    stroke={STATUS_COLORS.captured}
                    strokeWidth={3}
                    dot={{ fill: STATUS_COLORS.captured, strokeWidth: 2, r: 4 }}
                    name="Captured"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke={STATUS_COLORS.failed}
                    strokeWidth={3}
                    dot={{ fill: STATUS_COLORS.failed, strokeWidth: 2, r: 4 }}
                    name="Failed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pending" 
                    stroke={STATUS_COLORS.pending}
                    strokeWidth={3}
                    dot={{ fill: STATUS_COLORS.pending, strokeWidth: 2, r: 4 }}
                    name="Pending"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cancelled" 
                    stroke={STATUS_COLORS.cancelled}
                    strokeWidth={3}
                    dot={{ fill: STATUS_COLORS.cancelled, strokeWidth: 2, r: 4 }}
                    name="Cancelled"
                  />
                </LineChart>
              ) : viewType === 'status' && (data as DailyPaymentStatsData).statusStats?.length > 0 ? (
                <BarChart data={(data as DailyPaymentStatsData).statusStats}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="status" 
                    fontSize={12}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    fontSize={12}
                    className="text-gray-600 dark:text-gray-400"
                  />
                  <Tooltip 
                    formatter={formatTooltipValue}
                    labelFormatter={(label) => `Status: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      color: '#374151'
                    }}
                    labelStyle={{
                      color: '#374151',
                      fontWeight: '600'
                    }}
                    wrapperStyle={{
                      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                    }}
                  />
                  <Bar 
                    dataKey="total_amount" 
                    radius={[4, 4, 0, 0]}
                  >
                    {(data as DailyPaymentStatsData).statusStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>No payment data available for the selected period</p>
                  </div>
                </div>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Data Breakdown */}
        {data && (
          <div className="space-y-2">
            {viewType === 'course' && (data as PaymentStatsData).courseStats?.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Course Breakdown</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(data as PaymentStatsData).courseStats.map((course, index) => (
                    <div key={course.course_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {course.course_title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {course.payment_count} payments
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(course.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Avg: {formatCurrency(course.average_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {viewType === 'status' && (data as DailyPaymentStatsData).statusStats?.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Status Breakdown</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(data as DailyPaymentStatsData).statusStats.map((status, index) => (
                    <div key={status.status} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ 
                            backgroundColor: STATUS_COLORS[status.status as keyof typeof STATUS_COLORS] || COLORS[index % COLORS.length] 
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {status.status}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {status.payment_count} payments
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(status.total_amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Avg: {formatCurrency(status.average_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
