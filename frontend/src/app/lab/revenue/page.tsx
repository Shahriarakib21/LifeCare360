'use client';

import React, { useEffect, useState } from 'react';
import {
    DollarSign, TrendingUp, Calendar, ArrowUpRight,
    ArrowDownRight, Wallet, PieChart, Download,
    Filter, CreditCard, Activity, FlaskConical
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface RevenueAnalytics {
    today: { revenue: number; tests: number; payments: number };
    week: { revenue: number; tests: number; payments: number };
    month: { revenue: number; tests: number; payments: number };
    year: { revenue: number; tests: number; payments: number };
    total: { revenue: number; tests: number; payments: number };
    dailyTrend: Array<{ date: string; revenue: number; tests: number }>;
    topTests: Array<{ testName: string; revenue: number; count: number }>;
}

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function LabRevenuePage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<RevenueAnalytics | null>(null);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                const response = await api.get('/api/labs/revenue/analytics');
                setData(response.data.data);
            } catch (error: any) {
                toast.error(handleApiError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchRevenue();
    }, []);

    if (loading) return <LoadingSpinner fullScreen text="Synthesizing Financial Intelligence..." />;
    if (!data) return null;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">
                        Revenue <span className="text-cyan-500">Analytics</span>
                    </h1>
                    <p className="text-slate-500 flex items-center text-sm font-bold tracking-wide uppercase">
                        <Wallet className="w-4 h-4 mr-2 text-cyan-500" />
                        Financial Performance Monitoring System
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] h-12">
                        <Download size={16} className="mr-2" /> Export Statement
                    </Button>
                    <Button className="rounded-xl bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-slate-200">
                        <Filter size={16} className="mr-2" /> Custom Range
                    </Button>
                </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {[
                    { label: "Today", value: data.today.revenue, period: "24H Delta", icon: DollarSign, color: "cyan" },
                    { label: "Weekly", value: data.week.revenue, period: "7D Volume", icon: TrendingUp, color: "indigo" },
                    { label: "Monthly", value: data.month.revenue, period: "30D Cycle", icon: Wallet, color: "emerald" },
                    { label: "Yearly", value: data.year?.revenue || 0, period: "YTD", icon: Calendar, color: "orange" },
                    { label: "Lifetime", value: data.total.revenue, period: "All Time", icon: CreditCard, color: "violet" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-slate-100 group hover:border-cyan-200 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-cyan-50 group-hover:text-cyan-500 group-hover:scale-110 transition-all`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{stat.period}</span>
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900 text-nowrap">৳{stat.value.toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic">Cash Flow <span className="text-cyan-500">Dynamics</span></h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daily Revenue Inflow (Last 30 Days)</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <ArrowUpRight className="text-emerald-500" size={16} />
                            <span className="text-xs font-black text-emerald-600">+12.5%</span>
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.dailyTrend}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 800 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#06b6d4"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Test Distribution */}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 uppercase italic mb-10">Unit <span className="text-indigo-500">Performance</span></h3>
                    <div className="flex-1 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={data.topTests}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="revenue"
                                >
                                    {data.topTests.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 mt-8">
                        {data.topTests.slice(0, 4).map((test, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{test.testName}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">৳{test.revenue.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-slate-900 uppercase italic">Test Revenue <span className="text-violet-500">Leaderboard</span></h3>
                    <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-cyan-600">View Full Master List</Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnostic Procedure</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Operation Count</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Avg Price</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross Revenue Contribution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {data.topTests.map((test, i) => (
                                <tr key={i} className="group hover:bg-slate-50 transition-all">
                                    <td className="py-6 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-all">
                                            <FlaskConical size={18} />
                                        </div>
                                        <span className="font-black text-slate-700 uppercase italic text-sm">{test.testName}</span>
                                    </td>
                                    <td className="py-6 text-center font-bold text-slate-500 tabular-nums">{test.count}</td>
                                    <td className="py-6 text-center font-bold text-slate-500 tabular-nums">৳{(test.revenue / test.count).toFixed(0)}</td>
                                    <td className="py-6 text-right font-black text-slate-900 tabular-nums text-lg">৳{test.revenue.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
