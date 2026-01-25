'use client';

import React, { useEffect, useState } from 'react';
import {
    Users,
    Stethoscope,
    User,
    FlaskConical,
    FileText,
    Calendar,
    Activity,
    ArrowUp,
    ArrowDown,
    DollarSign
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    BarChart,
    Bar,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [appointmentTrends, setAppointmentTrends] = useState<any[]>([]);
    const [salesTrends, setSalesTrends] = useState<any[]>([]);
    const [labTrends, setLabTrends] = useState<any[]>([]);
    const [scatterData, setScatterData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, analyticsRes, appointmentRes, salesRes, labRes, scatterRes] = await Promise.all([
                    api.get('/api/admin/stats'),
                    api.get('/api/admin/analytics'),
                    api.get('/api/admin/analytics/appointment-trends'),
                    api.get('/api/admin/analytics/sales-trends'),
                    api.get('/api/admin/analytics/lab-trends'),
                    api.get('/api/admin/analytics/activity-scatter')
                ]);
                setStats(statsRes.data.data);
                setAnalytics(analyticsRes.data.data);
                setAppointmentTrends(appointmentRes.data.data);
                setSalesTrends(salesRes.data.data);
                setLabTrends(labRes.data.data);
                setScatterData(scatterRes.data.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <LoadingSpinner fullScreen />;

    const statCards = [
        { label: 'Total Revenue', value: stats?.totalRevenue, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100', isCurrency: true },
        { label: 'Total Users', value: stats?.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Doctors', value: stats?.totalDoctors, icon: Stethoscope, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Patients', value: stats?.totalPatients, icon: User, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Lab Tests', value: stats?.totalLabTests, icon: FlaskConical, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Appointments', value: stats?.totalAppointments, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100' },
        { label: 'Prescriptions', value: stats?.totalPrescriptions, icon: FileText, color: 'text-pink-600', bg: 'bg-pink-100' },
    ];

    const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#6366F1', '#EC4899'];

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-secondary-900">Dashboard Overview</h1>
                <p className="text-secondary-600 mt-2">Welcome to the admin control panel.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, idx) => (
                    <Card key={idx} padding="lg" hover className="border-l-4 border-l-primary-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-secondary-500">{card.label}</p>
                                <p className="text-3xl font-bold text-secondary-900 mt-1">
                                    {card.isCurrency ? '৳' : ''}{card.value?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts - Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* User Growth Chart */}
                <Card padding="lg" className="h-[400px] flex flex-col w-full">
                    <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-primary-600" />
                        User Registration Growth
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.userGrowth || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="_id"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3B82F6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* User Distribution Chart */}
                <Card padding="lg" className="h-[400px] flex flex-col w-full">
                    <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-primary-600" />
                        User Distribution
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics?.userDistribution || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="count"
                                    nameKey="_id"
                                    label
                                >
                                    {analytics?.userDistribution?.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Charts - Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Appointment Trends */}
                <Card padding="lg" className="h-[400px] flex flex-col w-full">
                    <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                        Appointment Trends
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={appointmentTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend />
                                <Bar dataKey="total" name="Total" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="cancelled" name="Cancelled" fill="#EF4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Sales Trends */}
                <Card padding="lg" className="h-[400px] flex flex-col w-full">
                    <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center">
                        <DollarSign className="w-5 h-5 mr-2 text-primary-600" />
                        Medicine Sales Trends (৳)
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesTrends}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Charts - Row 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lab Test Trends */}
                <Card padding="lg" className="h-[400px] flex flex-col w-full">
                    <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center">
                        <FlaskConical className="w-5 h-5 mr-2 text-primary-600" />
                        Lab Test Trends
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={labTrends}>
                                <defs>
                                    <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Area type="monotone" dataKey="tests" name="Tests" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorTests)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Engagement Scatter Plot */}
                <Card padding="lg" className="h-[400px] flex flex-col w-full">
                    <h2 className="text-xl font-bold text-secondary-900 mb-6 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-primary-600" />
                        User Engagement (Logins vs Appts)
                    </h2>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="logins" name="Logins" allowDecimals={false} label={{ value: 'Logins', position: 'bottom', offset: 0 }} />
                                <YAxis type="number" dataKey="actions" name="Appts" allowDecimals={false} label={{ value: 'Appointments', angle: -90, position: 'insideLeft' }} />
                                <ZAxis type="number" dataKey="size" range={[60, 400]} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Scatter name="Engagement" data={scatterData} fill="#3B82F6" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
