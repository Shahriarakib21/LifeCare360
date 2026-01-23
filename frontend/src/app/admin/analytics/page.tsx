'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Select from '@/components/ui/Select';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [appointmentTrends, setAppointmentTrends] = useState<any[]>([]);
    const [salesTrends, setSalesTrends] = useState<any[]>([]);
    const [userActivity, setUserActivity] = useState<any[]>([]);
    const [timeRange, setTimeRange] = useState('12');

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [appointmentsRes, salesRes, activityRes] = await Promise.all([
                api.get(`/api/admin/analytics/appointment-trends?months=${timeRange}`),
                api.get(`/api/admin/analytics/sales-trends?months=${timeRange}`),
                api.get(`/api/admin/analytics/user-activity?months=${timeRange}`)
            ]);

            setAppointmentTrends(appointmentsRes.data.data || []);
            setSalesTrends(salesRes.data.data || []);
            setUserActivity(activityRes.data.data || []);
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [timeRange]);

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
                        <BarChart3 className="w-8 h-8 mr-3 text-primary-600" />
                        Advanced Analytics
                    </h1>
                    <p className="text-secondary-600 mt-2">Comprehensive data visualization and insights</p>
                </div>
                <Select
                    label=""
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    options={[
                        { value: '3', label: 'Last 3 Months' },
                        { value: '6', label: 'Last 6 Months' },
                        { value: '12', label: 'Last 12 Months' }
                    ]}
                />
            </div>

            {/* Appointment Trends */}
            <Card padding="lg" className="h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-secondary-900 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                        Appointment Trends
                    </h2>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={appointmentTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                name="Total Appointments"
                                dot={{ fill: '#3B82F6', r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="completed"
                                stroke="#10B981"
                                strokeWidth={2}
                                name="Completed"
                                dot={{ fill: '#10B981', r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="cancelled"
                                stroke="#EF4444"
                                strokeWidth={2}
                                name="Cancelled"
                                dot={{ fill: '#EF4444', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Medicine Sales Revenue */}
            <Card padding="lg" className="h-[400px] flex flex-col">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">Medicine Sales Revenue</h2>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={salesTrends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value: any) => `$${value.toFixed(2)}`}
                            />
                            <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* User Registration Activity */}
            <Card padding="lg" className="h-[400px] flex flex-col">
                <h2 className="text-xl font-bold text-secondary-900 mb-4">User Registration Activity</h2>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={userActivity}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="patient"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                name="Patients"
                            />
                            <Line
                                type="monotone"
                                dataKey="doctor"
                                stroke="#10B981"
                                strokeWidth={2}
                                name="Doctors"
                            />
                            <Line
                                type="monotone"
                                dataKey="lab"
                                stroke="#F59E0B"
                                strokeWidth={2}
                                name="Labs"
                            />
                            <Line
                                type="monotone"
                                dataKey="pharmacy"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                name="Pharmacies"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Total Appointments</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                        {appointmentTrends.reduce((sum, item) => sum + item.total, 0)}
                    </p>
                </Card>
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Completed</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {appointmentTrends.reduce((sum, item) => sum + item.completed, 0)}
                    </p>
                </Card>
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        ${salesTrends.reduce((sum, item) => sum + item.revenue, 0).toFixed(2)}
                    </p>
                </Card>
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">New Users</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                        {userActivity.reduce((sum, item) => sum + item.patient + item.doctor + item.lab + item.pharmacy, 0)}
                    </p>
                </Card>
            </div>
        </div>
    );
}
