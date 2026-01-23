'use client';

import React, { useState, useEffect } from 'react';
import {
    Coins,
    TrendingUp,
    Clock,
    CheckCircle,
    ArrowLeft,
    Calendar,
    Filter,
    Download,
    AlertCircle
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

export default function DoctorFinancePage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<any>(null);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [isProfileComplete, setIsProfileComplete] = useState(true);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            router.push('/auth/login');
            return;
        }
        fetchFinanceData();
    }, [isAuthenticated, user, router]);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [reportRes, transRes] = await Promise.all([
                api.get('/api/doctors/finance/report'),
                api.get('/api/doctors/finance/transactions')
            ]);

            setReportData(reportRes.data.data);
            setTransactions(transRes.data.data.transactions || []);
            setIsProfileComplete(!!reportRes.data.data.summary.length || !!transRes.data.data.transactions.length || true); // Default to true if not clearly false

            // Check if profile exists by calling profile endpoint implicitly or check if finance returned 0s but doctor exists
            const profileRes = await api.get('/api/doctors/profile');
            setIsProfileComplete(!!profileRes.data.data.doctor);
        } catch (error) {
            console.error('Error fetching finance data:', error);
            toast.error(handleApiError(error));
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = (status?: string) => {
        if (!reportData?.summary) return 0;
        if (status) {
            const record = reportData.summary.find((s: any) => s.feeStatus === status);
            return record ? parseFloat(record.totalAmount) : 0;
        }
        return reportData.summary.reduce((acc: number, curr: any) => acc + parseFloat(curr.totalAmount), 0);
    };

    if (!isAuthenticated || !user) {
        return <LoadingSpinner fullScreen text="Loading..." />;
    }

    if (loading) {
        return <LoadingSpinner fullScreen text="Syncing Financial Ledger..." />;
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm text-secondary-500 hover:text-primary-600 transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <h1 className="text-3xl font-bold text-secondary-900 tracking-tight">Financial Terminal</h1>
                    <p className="text-secondary-500 font-medium">Earnings analytics and transaction reconciliation</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" /> EXPORT STATEMENT
                    </Button>
                    <Button size="sm" onClick={fetchFinanceData}>
                        REFRESH DATA
                    </Button>
                </div>
            </div>

            {!isProfileComplete && (
                <div className="bg-warning-50 border-2 border-warning-200 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-warning-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-warning-900">Profile Incomplete</h3>
                            <p className="text-warning-700">Earnings and transactions will appear once you complete your profile and start consultations.</p>
                        </div>
                    </div>
                    <Button variant="primary" onClick={() => router.push('/doctor/profile')}>
                        UPDATE PROFILE
                    </Button>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-primary-600 to-primary-700 text-white border-none shadow-xl shadow-primary-500/20">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Coins className="w-6 h-6" />
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-none">TOTAL REVENUE</Badge>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black">৳{calculateTotal().toLocaleString()}</h2>
                            <p className="text-white/70 text-sm font-medium flex items-center">
                                <TrendingUp className={`w-4 h-4 mr-1 ${reportData?.growth >= 0 ? 'text-emerald-300' : 'text-rose-300'}`} />
                                {reportData?.growth !== undefined ? (reportData.growth >= 0 ? '+' : '') : ''}{reportData?.growth || 0}% from last month
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-lg">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <Badge variant="success">SETTLED</Badge>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black text-secondary-900">৳{calculateTotal('paid').toLocaleString()}</h2>
                            <p className="text-secondary-500 text-sm font-medium">Successfully processed payments</p>
                        </div>
                    </div>
                </Card>

                <Card className="border-none shadow-lg">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                            <Badge variant="warning">OUTSTANDING</Badge>
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black text-secondary-900">৳{calculateTotal('pending').toLocaleString()}</h2>
                            <p className="text-secondary-500 text-sm font-medium">Awaiting patient disbursement</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Charts */}
                <Card padding="lg" title="Earnings Trajectory (Last 30 Days)">
                    <div className="h-[300px] mt-6">
                        {reportData?.history && reportData.history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={reportData.history}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 10, fontWeight: 600 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        labelStyle={{ fontWeight: 800, color: '#1E293B' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="dailyTotal"
                                        stroke="#2563EB"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-secondary-400">
                                <TrendingUp className="w-12 h-12 opacity-20 mb-2" />
                                <p className="font-medium">No history data available</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Transaction History */}
                <Card padding="lg" title="Recent Transactions">
                    <div className="mt-6 space-y-4">
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl border border-secondary-100 hover:border-primary-200 transition-colors group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-white rounded-lg border border-secondary-200 flex items-center justify-center text-sm font-bold text-primary-600 group-hover:bg-primary-50">
                                            TX
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary-900">{tx.patientName || 'Appointment Fee'}</h4>
                                            <p className="text-[10px] font-semibold text-secondary-400 uppercase tracking-widest flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" /> {formatDate(tx.date)} • {tx.time}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-black text-secondary-900">৳{tx.visitFee}</div>
                                        <Badge variant={tx.feeStatus === 'paid' ? 'success' : 'warning'} size="sm" className="text-[9px] font-black uppercase tracking-tighter">
                                            {tx.feeStatus}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-secondary-400">
                                <Coins className="w-12 h-12 mx-auto opacity-20 mb-3" />
                                <p className="font-medium">No transactions recorded yet.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
