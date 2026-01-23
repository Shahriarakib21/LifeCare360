'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FlaskConical,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Upload,
  TrendingUp,
  Activity,
  DollarSign,
  Calendar,
  Wallet
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import KPICard from '@/components/lab/KPICard';
import RevenueCard from '@/components/lab/RevenueCard';
import NotificationCenter from '@/components/lab/NotificationCenter';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalTestsToday: number;
  pendingReports: number;
  completedReports: number;
  criticalAlerts: number;
  trends: {
    tests: number;
    pending: number;
    completed: number;
    critical: number;
  };
}

interface RevenueAnalytics {
  today: { revenue: number; tests: number; payments: number };
  week: { revenue: number; tests: number; payments: number };
  month: { revenue: number; tests: number; payments: number };
  total: { revenue: number; tests: number; payments: number };
  dailyTrend: Array<{ date: string; revenue: number; tests: number }>;
  topTests: Array<{ testName: string; revenue: number }>;
}

interface RecentTest {
  _id: string;
  patient?: {
    user?: {
      profile?: {
        firstName?: string;
        lastName?: string;
      };
    };
  };
  data?: {
    labTestRequest?: {
      tests?: string[];
      urgency?: string;
      status?: string;
    };
  };
  date: string;
  status?: string;
}

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function LabDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalTestsToday: 0,
    pendingReports: 0,
    completedReports: 0,
    criticalAlerts: 0,
    trends: { tests: 0, pending: 0, completed: 0, critical: 0 }
  });
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [recentTests, setRecentTests] = useState<RecentTest[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    initialize();
    if (!isAuthenticated || user?.role !== 'lab') {
      const timer = setTimeout(() => {
        if (!isAuthenticated || user?.role !== 'lab') {
          router.push('/auth/login');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, initialize, router]);

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'lab') return;

    setLoading(true);
    try {
      // Fetch dashboard stats, revenue analytics, and recent tests in parallel
      const [statsRes, revenueRes, testsRes] = await Promise.all([
        api.get('/api/labs/dashboard/stats'),
        api.get('/api/labs/revenue/analytics'),
        api.get('/api/labs/requests')
      ]);

      const statsData = statsRes.data.data || {};
      const tests = testsRes.data.data?.requests || [];

      // Calculate stats from data
      const today = new Date().toISOString().split('T')[0];
      const todayTests = tests.filter((t: any) =>
        t.date && t.date.split('T')[0] === today
      );

      const pending = tests.filter((t: any) =>
        ['ASSIGNED', 'PAID', 'pending', 'REQUESTED', 'IN_PROGRESS'].includes(t.data?.labTestRequest?.status)
      );

      const completed = tests.filter((t: any) =>
        t.data?.labTestRequest?.status === 'completed'
      );

      const critical = tests.filter((t: any) =>
        t.data?.labTestRequest?.urgency === 'stat'
      );

      const backendStats = statsData.stats || {};
      setStats({
        totalTestsToday: backendStats.todayTests !== undefined ? backendStats.todayTests : todayTests.length,
        pendingReports: backendStats.pendingRequests !== undefined ? backendStats.pendingRequests : pending.length,
        completedReports: backendStats.completedTests !== undefined ? backendStats.completedTests : completed.length,
        criticalAlerts: backendStats.criticalAlerts !== undefined ? backendStats.criticalAlerts : critical.length,
        trends: {
          tests: 12,
          pending: -5,
          completed: 18,
          critical: -10
        }
      });

      // Set revenue analytics
      setRevenueAnalytics(revenueRes.data.data);

      setRecentTests(tests.slice(0, 10));

      // Generate chart data for last 7 days
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayTests = tests.filter((t: any) =>
          t.date && t.date.split('T')[0] === dateStr
        );

        chartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          tests: dayTests.length,
          completed: dayTests.filter((t: any) => t.data?.labTestRequest?.status === 'completed').length,
          pending: dayTests.filter((t: any) => t.data?.labTestRequest?.status !== 'completed').length
        });
      }

      setChartData(chartData);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error(handleApiError(error));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'lab') {
      fetchDashboardData();
    }
  }, [isAuthenticated, user, fetchDashboardData]);

  const getStatusBadge = (test: RecentTest) => {
    const status = test.data?.labTestRequest?.status || 'pending';
    const urgency = test.data?.labTestRequest?.urgency;

    if (urgency === 'stat') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">🔴 Critical</span>;
    }

    if (status === 'completed') {
      return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">🟢 Completed</span>;
    }

    return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">🟡 Pending</span>;
  };

  const getPatientName = (test: RecentTest) => {
    const profile = test.patient?.user?.profile;
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return 'Unknown Patient';
  };

  const getTestType = (test: RecentTest) => {
    const tests = test.data?.labTestRequest?.tests || [];
    return tests.length > 0 ? tests.join(', ') : 'N/A';
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Notification Center */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <NotificationCenter />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Tests Today"
          value={stats.totalTestsToday}
          icon={FlaskConical}
          color="blue"
          trend={{ value: stats.trends.tests, isPositive: stats.trends.tests > 0 }}
        />
        <KPICard
          title="Pending Reports"
          value={stats.pendingReports}
          icon={Clock}
          color="yellow"
          trend={{ value: stats.trends.pending, isPositive: stats.trends.pending < 0 }}
        />
        <KPICard
          title="Completed Reports"
          value={stats.completedReports}
          icon={CheckCircle}
          color="green"
          trend={{ value: stats.trends.completed, isPositive: stats.trends.completed > 0 }}
        />
        <KPICard
          title="Critical Alerts"
          value={stats.criticalAlerts}
          icon={AlertTriangle}
          color="red"
          trend={{ value: stats.trends.critical, isPositive: stats.trends.critical < 0 }}
        />
      </div>

      {/* Revenue Cards */}
      {revenueAnalytics && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Revenue Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <RevenueCard
              title="Today's Revenue"
              amount={revenueAnalytics.today.revenue}
              period="Today"
              color="green"
            />
            <RevenueCard
              title="Weekly Revenue"
              amount={revenueAnalytics.week.revenue}
              period="This Week"
              color="blue"
            />
            <RevenueCard
              title="Monthly Revenue"
              amount={revenueAnalytics.month.revenue}
              period="This Month"
              color="purple"
            />
            <RevenueCard
              title="Total Revenue"
              amount={revenueAnalytics.total.revenue}
              period="All Time"
              color="orange"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Test Uploads Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Recent Test Uploads</h2>
              <p className="text-sm text-gray-500 mt-1">Latest test requests and their status</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Test Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Upload Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTests.length > 0 ? (
                    recentTests.map((test, idx) => (
                      <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{getPatientName(test)}</p>
                            <p className="text-xs text-gray-500">ID: {test._id.slice(-8).toUpperCase()}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{getTestType(test)}</p>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(test)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{getTimeAgo(test.date)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/lab/requests`)}
                              className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/lab/upload-report?requestId=${test._id}`)}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Upload"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No recent tests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Upload Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Quick Upload</h3>
                <p className="text-sm text-cyan-50">Upload test results</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-dashed border-white/30 text-center mb-4 cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => router.push('/lab/upload-report')}>
              <Upload className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-medium mb-1">Click to upload</p>
              <p className="text-xs text-cyan-50">CSV • PDF • JPG • PNG</p>
            </div>

            <button
              onClick={() => router.push('/lab/upload-report')}
              className="w-full bg-white text-cyan-600 font-semibold py-3 px-4 rounded-xl hover:bg-cyan-50 transition-colors shadow-lg"
            >
              Go to Upload Page
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Today's Tests</span>
                <span className="font-bold text-gray-900">{stats.totalTestsToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-bold text-yellow-600">{stats.pendingReports}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-bold text-green-600">{stats.completedReports}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Critical</span>
                <span className="font-bold text-red-600">{stats.criticalAlerts}</span>
              </div>
              {revenueAnalytics && (
                <>
                  <div className="pt-3 border-t border-gray-200"></div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today's Revenue</span>
                    <span className="font-bold text-green-600">৳{revenueAnalytics.today.revenue.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Volume Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Test Volume</h3>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
            <TrendingUp className="w-5 h-5 text-cyan-600" />
          </div>

          <ResponsiveContainer width="100%" height={250}>
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
              <Bar dataKey="tests" fill="#06b6d4" name="Total Tests" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend Chart */}
        {revenueAnalytics && revenueAnalytics.dailyTrend.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueAnalytics.dailyTrend}>
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Revenue (৳)"
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status Trend Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Status Trends</h3>
              <p className="text-sm text-gray-500">Completed vs Pending</p>
            </div>
            <Activity className="w-5 h-5 text-teal-600" />
          </div>

          <ResponsiveContainer width="100%" height={250}>
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
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#10b981"
                strokeWidth={2}
                name="Completed"
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Pending"
                dot={{ fill: '#f59e0b', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Revenue Tests */}
        {revenueAnalytics && revenueAnalytics.topTests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Top Revenue Tests</h3>
                <p className="text-sm text-gray-500">By total revenue</p>
              </div>
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueAnalytics.topTests.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.testName.substring(0, 15)}...`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {revenueAnalytics.topTests.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
