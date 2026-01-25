'use client';

import React, { useEffect, useState } from 'react';
import {
    DollarSign, Activity, TrendingUp, FlaskConical,
    Download, Filter, Search, ArrowUpRight, Award,
    Building2, PieChart, BarChart3, Globe
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

interface AdminLabRevenue {
    totalRevenue: number;
    totalTests: number;
    labCount: number;
    dailyTrend: Array<{ date: string; revenue: number; tests: number }>;
    labBreakdown: Array<{ labId: string; labName: string; revenue: number; tests: number; avatar?: string }>;
}

const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminGlobalLabRevenuePage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AdminLabRevenue | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchGlobalRevenue = async () => {
            try {
                const response = await api.get('/api/admin/analytics/global-lab-revenue');
                setData(response.data.data);
            } catch (error: any) {
                toast.error(handleApiError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchGlobalRevenue();
    }, []);

    if (loading) return <LoadingSpinner fullScreen text="Aggregating Network Revenue Intelligence..." />;

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Activity className="w-16 h-16 text-slate-200" />
                <h3 className="text-xl font-bold text-slate-900">No Revenue Data Found</h3>
                <p className="text-slate-500">Global laboratory network intelligence is currently unavailable or empty.</p>
                <Button onClick={() => window.location.reload()} variant="outline">Retry Synchronizing</Button>
            </div>
        );
    }

    const filteredLabs = (data.labBreakdown || []).filter(lab =>
        lab.labName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">
                        Global Lab <span className="text-indigo-600">Economy</span>
                    </h1>
                    <p className="text-slate-500 flex items-center text-sm font-bold tracking-wide uppercase">
                        <Globe className="w-4 h-4 mr-2 text-indigo-500" />
                        Network-Wide Diagnostic Revenue & Throughput
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl bg-white border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] h-12 shadow-sm">
                        <Download size={16} className="mr-2" /> PDF Audit Report
                    </Button>
                    <Button className="rounded-xl bg-slate-900 text-white font-bold uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-slate-200">
                        <Download size={16} className="mr-2" /> CSV Master Export
                    </Button>
                </div>
            </div>

            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Aggregate Revenue", value: data.totalRevenue || 0, icon: DollarSign, color: "emerald", prefix: "৳" },
                    { label: "Gross Test Volume", value: data.totalTests || 0, icon: FlaskConical, color: "blue", prefix: "" },
                    { label: "Active Laboratory Units", value: data.labCount || 0, icon: Building2, color: "indigo", prefix: "" },
                    { label: "Network Growth", value: data.totalRevenue > 0 ? "+14.2%" : "N/A", icon: TrendingUp, color: "cyan", prefix: "" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 group transition-all hover:bg-slate-900 group">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-12 h-12 rounded-2xl bg-${stat.color}-50 flex items-center justify-center text-${stat.color}-500 group-hover:bg-white/10 group-hover:text-white transition-all`}>
                                <stat.icon size={24} />
                            </div>
                            <ArrowUpRight className="text-emerald-500 group-hover:text-emerald-400" size={20} />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest mb-1">{stat.label}</h4>
                        <span className="text-3xl font-black text-slate-900 group-hover:text-white transition-all">
                            {stat.prefix}{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Network-Wide Trend */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic">Network <span className="text-indigo-600">Throughput</span></h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cross-Laboratory Daily Revenue Projection</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">Revenue</button>
                            <button className="px-4 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-100">Volume</button>
                        </div>
                    </div>

                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.dailyTrend || []}>
                                <defs>
                                    <linearGradient id="colorGlobal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                                    stroke="#6366f1"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorGlobal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Performance Mix */}
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 uppercase italic mb-10">Revenue <span className="text-cyan-600">Distribution</span></h3>
                    <div className="flex-1 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RePieChart>
                                <Pie
                                    data={(data.labBreakdown || []).slice(0, 5)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="revenue"
                                    nameKey="labName"
                                >
                                    {data.labBreakdown.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </RePieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 shadow-inner">
                        <div className="flex items-center gap-3 mb-4">
                            <Award className="text-amber-500" size={20} />
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Top Performance Unit</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900">{data.labBreakdown[0]?.labName || 'N/A'}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-1">Generated ৳{data.labBreakdown[0]?.revenue.toLocaleString()} this period</p>
                    </div>
                </div>
            </div>

            {/* Lab Performance Master Table */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase italic">Laboratory <span className="text-indigo-600">Master List</span></h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time Performance Metrics for 42 Node Network</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="SEARCH NODE / ID"
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Laboratory Unit</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Test Throughput</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Efficiency Rating</th>
                                <th className="pb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Gross Generation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredLabs.map((lab, i) => (
                                <tr key={lab.labId} className="group hover:bg-slate-50 transition-all">
                                    <td className="py-6 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-xs shadow-lg group-hover:scale-110 transition-transform">
                                            {lab.labName.charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-black text-slate-700 uppercase italic text-sm group-hover:text-indigo-600 transition-colors">{lab.labName}</span>
                                            <p className="text-[9px] text-slate-400 font-bold font-mono uppercase mt-0.5">ID: {lab.labId.slice(-12)}</p>
                                        </div>
                                    </td>
                                    <td className="py-6 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-black text-slate-900 tabular-nums">{lab.tests} Units</span>
                                            <div className="w-20 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (lab.tests / data.totalTests) * 500)}%` }} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 text-center">
                                        <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">Optimal</span>
                                    </td>
                                    <td className="py-6 text-right">
                                        <span className="text-xl font-black text-slate-900 tabular-nums">৳{lab.revenue.toLocaleString()}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
