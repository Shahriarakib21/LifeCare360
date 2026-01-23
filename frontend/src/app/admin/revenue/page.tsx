'use client';

import React, { useEffect, useState } from 'react';
import {
    Wallet,
    TrendingUp,
    Filter,
    Download,
    Calendar,
    Stethoscope,
    FlaskConical,
    Pill,
    ChevronLeft,
    ChevronRight,
    Search
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate } from '@/utils/date';

export default function AdminRevenuePage() {
    const [summary, setSummary] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        type: 'all',
        startDate: '',
        endDate: '',
        paymentMethod: 'all'
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                ...filters,
                page: page.toString(),
                limit: '10'
            }).toString();

            const [summaryRes, analyticsRes, breakdownRes] = await Promise.all([
                api.get('/api/admin/revenue/summary'),
                api.get(`/api/admin/revenue/analytics?${queryParams}`),
                api.get(`/api/admin/revenue/breakdown?${queryParams}`)
            ]);

            setSummary(summaryRes.data.data);
            setAnalytics(analyticsRes.data.data);
            setTransactions(breakdownRes.data.data.transactions);
            setTotalPages(breakdownRes.data.data.pagination.pages);
        } catch (error) {
            console.error('Failed to fetch revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, filters]);

    const handleExport = async () => {
        try {
            const queryParams = new URLSearchParams({
                type: filters.type,
                startDate: filters.startDate,
                endDate: filters.endDate
            }).toString();

            const response = await api.get(`/api/admin/revenue/export?${queryParams}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Failed to export report:', error);
        }
    };

    if (loading && !summary) return <LoadingSpinner fullScreen />;

    const summaryCards = [
        { label: 'Total Revenue', value: summary?.total, icon: Wallet, color: 'text-primary-600', bg: 'bg-primary-100' },
        { label: 'Doctor Revenue', value: summary?.doctor, icon: Stethoscope, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Lab Revenue', value: summary?.lab, icon: FlaskConical, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Pharmacy Revenue', value: summary?.pharmacy, icon: Pill, color: 'text-pink-600', bg: 'bg-pink-100' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Revenue Management</h1>
                    <p className="text-secondary-600 mt-1">Track and analyze healthcare service earnings.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="btn btn-primary flex items-center justify-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {summaryCards.map((card, idx) => (
                    <Card key={idx} padding="lg" hover className="border-l-4 border-l-primary-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-secondary-500">{card.label}</p>
                                <p className="text-2xl font-bold text-secondary-900 mt-1">
                                    ৳{card.value?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${card.bg}`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Analytics Chart */}
            <Card padding="lg" className="h-[450px] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-secondary-900 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                        Revenue Trends
                    </h2>
                    <div className="flex items-center gap-2">
                        <select
                            className="select select-sm max-w-xs"
                            value={filters.type}
                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        >
                            <option value="all">All Services</option>
                            <option value="doctor">Doctors</option>
                            <option value="lab">Laboratories</option>
                            <option value="pharmacy">Pharmacy</option>
                        </select>
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
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
                            <Legend />
                            <Area type="monotone" dataKey="doctor" name="Doctor" stroke="#10B981" fill="#10B981" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="lab" name="Lab" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="pharmacy" name="Pharmacy" stroke="#EC4899" fill="#EC4899" fillOpacity={0.1} />
                            <Area type="monotone" dataKey="total" name="Total Revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Transactions Table */}
            <Card padding="none" className="overflow-hidden">
                <div className="p-6 border-b border-secondary-200 bg-secondary-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-secondary-900">Transaction History</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                            <input
                                type="date"
                                className="pl-10 input input-sm text-xs"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>
                        <span className="text-secondary-400">to</span>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                            <input
                                type="date"
                                className="pl-10 input input-sm text-xs"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead>
                            <tr className="bg-secondary-50">
                                <th className="text-xs uppercase tracking-wider font-bold py-4">Date</th>
                                <th className="text-xs uppercase tracking-wider font-bold py-4">Patient</th>
                                <th className="text-xs uppercase tracking-wider font-bold py-4">Service</th>
                                <th className="text-xs uppercase tracking-wider font-bold py-4">Provider</th>
                                <th className="text-xs uppercase tracking-wider font-bold py-4">Amount</th>
                                <th className="text-xs uppercase tracking-wider font-bold py-4">Method</th>
                                <th className="text-xs uppercase tracking-wider font-bold py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-200">
                            {transactions.length > 0 ? (
                                transactions.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-secondary-50/50 transition-colors">
                                        <td className="py-4">
                                            <div className="text-sm font-medium text-secondary-900">{formatDate(tx.date)}</div>
                                            <div className="text-xs text-secondary-500">{tx.transactionId}</div>
                                        </td>
                                        <td className="py-4">
                                            <div className="text-sm font-medium text-secondary-900">
                                                {tx.patientUserId?.profile?.firstName} {tx.patientUserId?.profile?.lastName}
                                            </div>
                                            <div className="text-xs text-secondary-500">{tx.patientUserId?.email}</div>
                                        </td>
                                        <td className="py-4">
                                            <span className={`badge badge-sm ${tx.type === 'doctor' ? 'badge-primary' :
                                                    tx.type === 'lab' ? 'badge-warning' : 'badge-secondary'
                                                } capitalize`}>
                                                {tx.type}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            <div className="text-sm font-medium text-secondary-900">
                                                {tx.providerUserId?.profile?.firstName} {tx.providerUserId?.profile?.lastName}
                                            </div>
                                            <div className="text-xs text-secondary-500">{tx.providerUserId?.role}</div>
                                        </td>
                                        <td className="py-4">
                                            <div className="text-sm font-bold text-secondary-900">৳{tx.amount.toLocaleString()}</div>
                                        </td>
                                        <td className="py-4">
                                            <span className="text-sm text-secondary-600 capitalize">{tx.paymentMethod}</span>
                                        </td>
                                        <td className="py-4">
                                            <span className="badge badge-success badge-sm">Success</span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-secondary-500">
                                        No transactions found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-secondary-200 bg-secondary-50 flex items-center justify-between">
                    <p className="text-sm text-secondary-500">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
