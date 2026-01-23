'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, FileText, Calendar, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';

interface Patient {
    _id: string;
    user?: {
        email?: string;
        profile?: {
            firstName?: string;
            lastName?: string;
            dateOfBirth?: string;
            gender?: string;
        };
    };
    testCount?: number;
    lastTest?: string;
}

export default function PatientSearchPage() {
    const router = useRouter();
    const { user, isAuthenticated, initialize } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientHistory, setPatientHistory] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        initialize();
        if (!isAuthenticated || user?.role !== 'lab') {
            router.push('/auth/login');
        }
    }, [isAuthenticated, user, initialize, router]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error('Please enter a search query');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/api/labs/patients/search?q=${searchQuery}`);
            setPatients(response.data.data?.patients || []);
        } catch (error: any) {
            console.error('Error searching patients:', error);
            toast.error(handleApiError(error));
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const fetchHistory = async (patientId: string) => {
        setHistoryLoading(true);
        try {
            const response = await api.get(`/api/labs/patients/${patientId}/tests`);
            setPatientHistory(response.data.data?.tests || []);
        } catch (error: any) {
            console.error('Error fetching patient history:', error);
            toast.error(handleApiError(error));
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleViewHistory = (patient: Patient) => {
        setSelectedPatient(patient);
        fetchHistory(patient._id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <Search className="w-8 h-8 text-cyan-600" />
                    Patient Search
                </h1>
                <p className="text-gray-600 mt-1">Search for patients and view their test history</p>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or patient ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-lg"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {patients.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">{patients.length} Patients Found</h2>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {patients.map((patient) => (
                            <div key={patient._id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <User className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {patient.user?.profile?.firstName || ''} {patient.user?.profile?.lastName || 'Unknown'}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">{patient.user?.email || 'No email'}</p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {patient.user?.profile?.dateOfBirth
                                                        ? new Date(patient.user.profile.dateOfBirth).toLocaleDateString()
                                                        : 'N/A'}
                                                </span>
                                                <span>•</span>
                                                <span>{patient.user?.profile?.gender || 'N/A'}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    {patient.testCount || 0} tests
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleViewHistory(patient)}
                                        className="flex items-center gap-2 px-4 py-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors font-medium"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View History
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {!loading && patients.length === 0 && searchQuery && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
                    <p className="text-gray-600">Try searching with a different name, email, or ID</p>
                </div>
            )}

            {/* Empty State */}
            {!searchQuery && patients.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for patients</h3>
                    <p className="text-gray-600">Enter a patient name, email, or ID to get started</p>
                </div>
            )}

            {/* Patient Details Modal */}
            {selectedPatient && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Patient Test History</h2>
                            <button
                                onClick={() => setSelectedPatient(null)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {selectedPatient.user?.profile?.firstName} {selectedPatient.user?.profile?.lastName}
                                    </h3>
                                    <p className="text-sm text-gray-600">{selectedPatient.user?.email}</p>
                                </div>
                            </div>
                            {historyLoading ? (
                                <div className="py-12 flex justify-center">
                                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : patientHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {patientHistory.map((test, idx) => (
                                        <div key={idx} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-gray-900">
                                                    {(test.data?.labResults || []).map((r: any) => r.testName).join(', ') || 'General Lab Test'}
                                                </h4>
                                                <span className="text-xs text-gray-500">{new Date(test.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="space-y-1">
                                                {(test.data?.labResults || []).map((result: any, rIdx: number) => (
                                                    <div key={rIdx} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">{result.testName}</span>
                                                        <span className={`font-medium ${result.status === 'critical' ? 'text-red-600' :
                                                                result.status === 'high' || result.status === 'low' ? 'text-orange-500' :
                                                                    'text-green-600'
                                                            }`}>
                                                            {result.value} {result.unit}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            {test.data?.attachments?.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                                                    {test.data.attachments.map((att: any, aIdx: number) => (
                                                        <a
                                                            key={aIdx}
                                                            href={att.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-cyan-600 hover:underline flex items-center gap-1"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            {att.name || 'Report'}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>No test history found for this patient</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
