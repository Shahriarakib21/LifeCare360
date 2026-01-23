'use client';

import React, { useState, useEffect } from 'react';
import { FlaskConical, Download, Filter } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function LabTestReportsPage() {
    const [tests, setTests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: ''
    });

    const fetchTests = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.status) params.append('status', filters.status);

            const response = await api.get(`/api/reports/lab-tests?${params.toString()}`);
            setTests(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch lab tests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTests();
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        fetchTests();
    };

    const handleExportCSV = () => {
        if (tests.length === 0) return;

        const headers = ['Test Name', 'Patient', 'Lab', 'Date', 'Status', 'Cost', 'Doctor'];
        const rows = tests.map(test => [
            test.testName,
            test.patientDetails?.profile?.firstName + ' ' + test.patientDetails?.profile?.lastName || 'N/A',
            test.labDetails?.profile?.firstName + ' ' + test.labDetails?.profile?.lastName || 'N/A',
            new Date(test.date).toLocaleDateString(),
            test.status,
            test.cost || 0,
            test.doctorName || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lab_tests_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const totalCost = tests.reduce((sum, test) => sum + (test.cost || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
                        <FlaskConical className="w-8 h-8 mr-3 text-primary-600" />
                        Lab Test Reports
                    </h1>
                    <p className="text-secondary-600 mt-2">View and analyze laboratory test data</p>
                </div>
                <Button onClick={handleExportCSV} variant="primary" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Total Tests</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{tests.length}</p>
                </Card>
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Total Cost</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">${totalCost.toFixed(2)}</p>
                </Card>
            </div>

            {/* Filters */}
            <Card padding="lg">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-secondary-900">Filters</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                        type="date"
                        label="Start Date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                    <Input
                        type="date"
                        label="End Date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                    <Select
                        label="Status"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        options={[
                            { value: '', label: 'All Statuses' },
                            { value: 'pending', label: 'Pending' },
                            { value: 'in-progress', label: 'In Progress' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' }
                        ]}
                    />
                    <Button onClick={handleApplyFilters} variant="primary" className="mt-6">
                        Apply Filters
                    </Button>
                </div>
            </Card>

            {/* Data Table */}
            <Card padding="lg">
                {loading ? (
                    <LoadingSpinner />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-secondary-200">
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Test Name</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Patient</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Lab</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tests.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-secondary-500">
                                            No lab tests found
                                        </td>
                                    </tr>
                                ) : (
                                    tests.map((test, idx) => (
                                        <tr key={idx} className="border-b border-secondary-100 hover:bg-secondary-50">
                                            <td className="py-3 px-4 font-medium">{test.testName}</td>
                                            <td className="py-3 px-4">
                                                {test.patientDetails?.profile?.firstName} {test.patientDetails?.profile?.lastName}
                                            </td>
                                            <td className="py-3 px-4">
                                                {test.labDetails?.profile?.firstName} {test.labDetails?.profile?.lastName || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {new Date(test.date).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${test.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        test.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                                            test.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {test.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-green-600 font-semibold">
                                                ${test.cost || 0}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-4 text-sm text-secondary-600">
                    Total: {tests.length} lab tests
                </div>
            </Card>
        </div>
    );
}
