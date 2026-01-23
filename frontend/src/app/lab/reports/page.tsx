'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Activity, Download, Calendar } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ReportsAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week');
  const [chartData, setChartData] = useState<any[]>([]);
  const [testTypeData, setTestTypeData] = useState<any[]>([]);

  useEffect(() => {
    initialize();
    if (!isAuthenticated || user?.role !== 'lab') {
      router.push('/auth/login');
    } else {
      fetchAnalytics();
    }
  }, [isAuthenticated, user, initialize, router, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/labs/requests');
      const tests = response.data.data?.requests || [];

      // Generate time series data
      const days = dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 90;
      const timeData = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayTests = tests.filter((t: any) =>
          t.date && t.date.split('T')[0] === dateStr
        );

        timeData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          total: dayTests.length,
          completed: dayTests.filter((t: any) => t.data?.labTestRequest?.status === 'completed').length,
          pending: dayTests.filter((t: any) => t.data?.labTestRequest?.status !== 'completed').length,
          critical: dayTests.filter((t: any) => t.data?.labTestRequest?.urgency === 'stat').length
        });
      }

      setChartData(timeData);

      // Test type distribution
      const testTypes: any = {};
      tests.forEach((t: any) => {
        const types = t.data?.labTestRequest?.tests || [];
        types.forEach((type: string) => {
          testTypes[type] = (testTypes[type] || 0) + 1;
        });
      });

      const typeData = Object.entries(testTypes).map(([name, value]) => ({
        name,
        value
      })).slice(0, 6);

      setTestTypeData(typeData);

    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#06b6d4', '#14b8a6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-cyan-600" />
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Volume Trend */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Test Volume Trend</h3>
              <p className="text-sm text-gray-500">Daily test counts over time</p>
            </div>
            <TrendingUp className="w-5 h-5 text-cyan-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#06b6d4" strokeWidth={3} name="Total Tests" dot={{ fill: '#06b6d4', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Test Type Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Test Type Distribution</h3>
              <p className="text-sm text-gray-500">Most common test types</p>
            </div>
            <Activity className="w-5 h-5 text-teal-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={testTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {testTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Status Breakdown</h3>
              <p className="text-sm text-gray-500">Completed vs Pending over time</p>
            </div>
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" name="Pending" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Critical Tests Trend */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Critical Tests Trend</h3>
              <p className="text-sm text-gray-500">STAT/urgent test requests</p>
            </div>
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={3} name="Critical Tests" dot={{ fill: '#ef4444', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
