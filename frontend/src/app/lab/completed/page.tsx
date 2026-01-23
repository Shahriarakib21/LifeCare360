'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, Eye, Filter, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface CompletedTest {
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
            status?: string;
        };
    };
    date: string;
}

export default function CompletedTestsPage() {
    const router = useRouter();
    const { user, isAuthenticated, initialize } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [tests, setTests] = useState<CompletedTest[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('all');

    useEffect(() => {
        initialize();
        if (!isAuthenticated || user?.role !== 'lab') {
            router.push('/auth/login');
        }
    }, [isAuthenticated, user, initialize, router]);

    const fetchCompletedTests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/labs/requests?status=completed');
            setTests(response.data.data?.requests || []);
        } catch (error: any) {
            console.error('Error fetching completed tests:', error);
            toast.error(handleApiError(error));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'lab') {
            fetchCompletedTests();
        }
    }, [isAuthenticated, user, fetchCompletedTests]);

    const filteredTests = tests.filter(test => {
        const patientName = `${test.patient?.user?.profile?.firstName || ''} ${test.patient?.user?.profile?.lastName || ''}`.toLowerCase();
        const testTypes = (test.data?.labTestRequest?.tests || []).join(' ').toLowerCase();
        const matchesSearch = patientName.includes(searchQuery.toLowerCase()) || testTypes.includes(searchQuery.toLowerCase());

        if (filterDate === 'today') {
            const today = new Date().toISOString().split('T')[0];
            return matchesSearch && test.date.split('T')[0] === today;
        }
        if (filterDate === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return matchesSearch && new Date(test.date) >= weekAgo;
        }

        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                        Completed Tests
                    </h1>
                    <p className="text-gray-600 mt-1">View and manage completed test reports</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by patient name or test type..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">{filteredTests.length} Completed Tests</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Patient</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Test Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Completion Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTests.length > 0 ? (
                                filteredTests.map((test) => (
                                    <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {test.patient?.user?.profile?.firstName || ''} {test.patient?.user?.profile?.lastName || 'Unknown'}
                                                </p>
                                                <p className="text-xs text-gray-500">ID: {test._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900">{(test.data?.labTestRequest?.tests || []).join(', ') || 'N/A'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600">{new Date(test.date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => router.push(`/lab/requests`)}
                                                    className="flex items-center gap-2 px-3 py-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View
                                                </button>
                                                <button
                                                    className="flex items-center gap-2 px-3 py-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Export
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No completed tests found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
