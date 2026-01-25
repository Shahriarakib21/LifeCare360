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
  Wallet,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import KPICard from '@/components/lab/KPICard';
import RevenueCard from '@/components/lab/RevenueCard';
import NotificationCenter from '@/components/lab/NotificationCenter';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import ImagePlaceholder from '@/components/ui/ImagePlaceholder';
import { cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
      const [statsRes, revenueRes, testsRes] = await Promise.all([
        api.get('/api/labs/dashboard/stats'),
        api.get('/api/labs/revenue/analytics'),
        api.get('/api/labs/requests')
      ]);

      const statsData = statsRes.data.data || {};
      const tests = testsRes.data.data?.requests || [];

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

      setRevenueAnalytics(revenueRes.data.data);
      setRecentTests(tests.slice(0, 10));

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
      return <Badge className="bg-error-50 text-error-700 border-error-100 text-[10px] font-black uppercase tracking-tighter px-3">CRITICAL</Badge>;
    }

    if (status === 'completed' || status === 'REPORT_UPLOADED') {
      return <Badge className="bg-success-50 text-success-700 border-success-100 text-[10px] font-black uppercase tracking-tighter px-3">COMPLETED</Badge>;
    }

    if (status === 'PAID') {
      return <Badge className="bg-primary-50 text-primary-700 border-primary-100 text-[10px] font-black uppercase tracking-tighter px-3">PAID</Badge>;
    }

    return <Badge className="bg-secondary-50 text-secondary-700 border-secondary-100 text-[10px] font-black uppercase tracking-tighter px-3">{status.replace('_', ' ')}</Badge>;
  };

  const getPatientName = (test: RecentTest) => {
    const profile = test.patient?.user?.profile;
    if (profile?.firstName || profile?.lastName) {
      return `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
    }
    return 'Technician Sample';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-20"
    >
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-gradient-to-br from-primary-600 to-primary-700 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10 space-y-3">
          <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Diagnostic <span className="opacity-60">Intelligence</span>
          </h1>
          <p className="text-primary-100 text-lg font-medium opacity-80">Welcome back, {user?.email?.split('@')[0]}. You have {stats.pendingReports} samples awaiting processing.</p>
        </div>
        <div className="relative z-10 flex gap-4">
          <NotificationCenter />
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Daily Throughput"
          value={stats.totalTestsToday}
          icon={FlaskConical}
          color="from-primary-500 to-primary-600"
          delay={0.1}
          trend={{ value: stats.trends.tests, isPositive: stats.trends.tests > 0 }}
        />
        <KPICard
          title="In Queue"
          value={stats.pendingReports}
          icon={Clock}
          color="from-secondary-500 to-secondary-600"
          delay={0.2}
          trend={{ value: stats.trends.pending, isPositive: stats.trends.pending < 0 }}
        />
        <KPICard
          title="Dispatched"
          value={stats.completedReports}
          icon={CheckCircle}
          color="from-success-500 to-success-600"
          delay={0.3}
          trend={{ value: stats.trends.completed, isPositive: stats.trends.completed > 0 }}
        />
        <KPICard
          title="Urgent Ops"
          value={stats.criticalAlerts}
          icon={AlertTriangle}
          color="from-error-500 to-error-600"
          delay={0.4}
          trend={{ value: stats.trends.critical, isPositive: stats.trends.critical < 0 }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-soft overflow-hidden rounded-[2.5rem] bg-white p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-black text-secondary-900 tracking-tight">Accession Queue</h2>
              </div>
              <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest text-secondary-500">Live Stream</Button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-secondary-50">
                    <th className="pb-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Subject</th>
                    <th className="pb-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Inventory</th>
                    <th className="pb-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Protocol</th>
                    <th className="pb-4 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-50">
                  {recentTests.length > 0 ? (
                    recentTests.map((test, idx) => (
                      <tr key={test._id} className="group hover:bg-secondary-50/50 transition-colors">
                        <td className="py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-secondary-100 group-hover:scale-110 transition-transform">
                              <Users className="w-5 h-5 text-secondary-400" />
                            </div>
                            <div>
                              <p className="font-black text-secondary-900 uppercase text-xs tracking-tight">{getPatientName(test)}</p>
                              <p className="text-[10px] font-black text-primary-500 uppercase tracking-tighter">ID: {test._id.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5">
                          <p className="text-xs font-black text-secondary-600 uppercase tracking-tight">{test.data?.labTestRequest?.tests?.[0] || 'COMP_PANEL'}</p>
                        </td>
                        <td className="py-5">
                          {getStatusBadge(test)}
                        </td>
                        <td className="py-5">
                          <div className="flex gap-2">
                            <button onClick={() => router.push(`/lab/requests`)} className="p-2.5 rounded-xl bg-secondary-100 text-secondary-600 hover:bg-primary-500 hover:text-white transition-all shadow-sm">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => router.push(`/lab/upload-report?requestId=${test._id}`)} className="p-2.5 rounded-xl bg-primary-100 text-primary-600 hover:bg-primary-600 hover:text-white transition-all shadow-sm">
                              <Upload className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <ImagePlaceholder type="generic" className="w-16 h-16 rounded-2xl mx-auto opacity-30 mb-4" />
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Baseline Operations</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-secondary-900 border-none shadow-soft rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary-500/30 transition-colors" />

            <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/10">
                <Upload className="w-7 h-7 text-primary-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight leading-tight">Batch Results Upload</h3>
                <p className="text-secondary-400 font-medium leading-relaxed">Secure protocol for uploading clinical diagnostic datasets.</p>
              </div>
              <Button
                fullWidth
                variant="primary"
                className="rounded-2xl py-4 bg-white text-secondary-900 hover:bg-secondary-50 font-black text-xs uppercase tracking-widest shadow-xl"
                onClick={() => router.push('/lab/upload-report')}
              >
                Initiate Upload
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-soft rounded-[2.5rem] bg-white p-8">
            <h3 className="text-xl font-black text-secondary-900 tracking-tight mb-8 uppercase text-xs tracking-widest text-primary-600">Operations Feed</h3>
            <div className="space-y-6">
              {[
                { label: "Daily throughput", val: stats.totalTestsToday, color: "bg-primary-500" },
                { label: "Worklist Pending", val: stats.pendingReports, color: "bg-secondary-500" },
                { label: "Critical Priority", val: stats.criticalAlerts, color: "bg-error-500" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-secondary-400">{stat.label}</span>
                    <span className="text-secondary-900">{stat.val} samples</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '70' + '%' }}
                      className={cn("h-full rounded-full", stat.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Analytics Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-soft rounded-[2.5rem] bg-white p-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-secondary-900 tracking-tight">Diagnostic Volume</h3>
              <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">7-Day Accession Trend</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="tests" fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {revenueAnalytics && (
          <Card className="border-none shadow-soft rounded-[2.5rem] bg-white p-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-secondary-900 tracking-tight">Revenue Analytics</h3>
                <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mt-1">30-Day Operational Yield</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueAnalytics.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
