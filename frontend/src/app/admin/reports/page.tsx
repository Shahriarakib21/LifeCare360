'use client';

import React, { useState, useEffect } from 'react';
import {
    Calendar,
    FileText,
    Filter,
    Download,
    Beaker,
    DollarSign,
    Users
} from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminReports() {
    const [activeTab, setActiveTab] = useState<'appointments' | 'sales' | 'lab-tests' | 'users'>('appointments');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            // Remove empty params
            Object.keys(params).forEach(key => key === '' && delete (params as any)[key]);

            const response = await api.get(`/api/admin/reports/${activeTab}`, { params });
            setData(response.data.data);
        } catch (error) {
            console.error('Failed to fetch report:', error);
            toast.error('Failed to load report data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setData([]); // Clear data to avoid render mismatches during tab switch
        fetchData();
    }, [activeTab]);

    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const handleExport = () => {
        if (!data || data.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            let headers: string[] = [];
            let csvData: string[][] = [];
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `${activeTab}_report_${timestamp}.csv`;

            if (activeTab === 'appointments') {
                headers = ['Date', 'Time', 'Patient', 'Doctor', 'Type', 'Status'];
                csvData = data.map((item: any) => [
                    new Date(item.date).toLocaleDateString(),
                    item.time || '',
                    item.patientId || '',
                    item.doctorId || '',
                    item.type || '',
                    item.status || ''
                ]);
            } else if (activeTab === 'sales') {
                headers = ['Date', 'Order ID', 'Patient', 'Amount', 'Payment Status'];
                csvData = data.map((item: any) => [
                    new Date(item.createdAt).toLocaleDateString(),
                    item.id || item._id || '',
                    item.patientId || '',
                    item.totalAmount?.toString() || '0',
                    item.paymentStatus || ''
                ]);
            } else if (activeTab === 'lab-tests') {
                headers = ['Date', 'Patient Name', 'Patient Email', 'Lab Name', 'Tests Count', 'Status'];
                csvData = data.map((item: any) => [
                    new Date(item.date).toLocaleDateString(),
                    `${item.patientDetails?.profile?.firstName || ''} ${item.patientDetails?.profile?.lastName || ''}`.trim(),
                    item.patientDetails?.email || '',
                    item.labDetails?.profile?.firstName || 'Unassigned',
                    (item.testsCount || 0).toString(),
                    item.status || 'Pending'
                ]);
            }

            const csvContent = [
                headers.join(','),
                ...csvData.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            toast.success(`Exported ${activeTab} report`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export data');
        }
    };

    const handleMainExport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/admin/reports/consolidated', { params: filters });
            const d = response.data.data;

            const rows = [
                ['Category', 'Metric', 'Value'],
                ['Appointments', 'CompletedCount', d.appointments.completed],
                ['Appointments', 'Revenue', `৳${d.appointments.revenue}`],
                ['Pharmacy', 'TotalOrders', d.pharmacy.orders],
                ['Pharmacy', 'Revenue', `৳${d.pharmacy.revenue}`],
                ['Lab Tests', 'TotalTests', d.lab.tests],
                ['Lab Tests', 'Revenue', `৳${d.lab.revenue}`],
                ['Users', 'PatientCount', d.users.patient || 0],
                ['Users', 'DoctorCount', d.users.doctor || 0],
                ['Users', 'LabCount', d.users.lab || 0],
                ['Users', 'PharmacyCount', d.users.pharmacy || 0],
                ['Summary', 'TotalSystemRevenue', `৳${d.totalRevenue}`]
            ];

            const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `consolidated_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.click();
            toast.success('Main CSV exported');
        } catch (error) {
            console.error('Consolidated export failed:', error);
            toast.error('Failed to export consolidated data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">Reports & Analytics</h1>
                    <p className="text-secondary-600">View and export system-wide data</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleMainExport} variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
                        Main CSV (Consolidated)
                    </Button>
                    <Button onClick={handleExport} variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
                        Export Tab CSV
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-secondary-200 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('appointments')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'appointments'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Appointments
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('sales')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'sales'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Medicine Sales
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('lab-tests')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'lab-tests'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Beaker className="w-4 h-4" />
                        Lab Tests
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'users'
                        ? 'border-primary-600 text-primary-600'
                        : 'border-transparent text-secondary-500 hover:text-secondary-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Users
                    </div>
                </button>
            </div>

            {/* Filters */}
            <Card padding="md">
                <form onSubmit={handleFilterSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                    <Input
                        label="Start Date"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full md:w-auto"
                    />
                    <Input
                        label="End Date"
                        type="date"
                        value={filters.startDate ? (filters.endDate || filters.startDate) : filters.endDate}
                        min={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full md:w-auto"
                    />
                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-secondary-700 mb-2">Status</label>
                        <select
                            className="input w-full"
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="">All Statuses</option>
                            {activeTab === 'appointments' && (
                                <>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </>
                            )}
                            {activeTab === 'sales' && (
                                <>
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                    <option value="failed">Failed</option>
                                </>
                            )}
                            {activeTab === 'lab-tests' && (
                                <>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="REQUESTED">Requested</option>
                                </>
                            )}
                            {activeTab === 'users' && (
                                <>
                                    <option value="patient">Patient</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="lab">Lab Technician</option>
                                    <option value="pharmacy">Pharmacist</option>
                                    <option value="admin">Admin</option>
                                </>
                            )}
                        </select>
                    </div>
                    {activeTab === 'users' && (
                        <Input
                            label="Search"
                            placeholder="Name or email..."
                            value={filters.status} // Reusing status field for search string in users tab to avoid adding more complex state handling
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full md:w-auto"
                        />
                    )}
                    <Button type="submit" variant="secondary" leftIcon={<Filter className="w-4 h-4" />}>
                        Apply Filters
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                            setFilters({ startDate: '', endDate: '', status: '' });
                            fetchData();
                        }}
                    >
                        Clear
                    </Button>
                </form>
            </Card>

            {/* Data Table */}
            <Card padding="none">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-secondary-200">
                            <thead className="bg-secondary-50">
                                <tr>
                                    {activeTab === 'appointments' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Patient ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Doctor ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Type</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                                        </>
                                    )}
                                    {activeTab === 'sales' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Order ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Patient ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Payment</th>
                                        </>
                                    )}
                                    {activeTab === 'lab-tests' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Patient</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Lab</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Tests</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                                        </>
                                    )}
                                    {activeTab === 'users' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Joined</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase">Status</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-secondary-200">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-secondary-500">
                                            No records found for the selected criteria
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item: any) => (
                                        <tr key={item.id || item._id} className="hover:bg-secondary-50">
                                            {activeTab === 'appointments' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                                        {new Date(item.date).toLocaleDateString()} {item.time}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{item.patientId}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{item.doctorId}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500 capitalize">{item.type}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={item.status === 'confirmed' || item.status === 'completed' ? 'success' : item.status === 'cancelled' ? 'error' : 'warning'}>
                                                            {item.status}
                                                        </Badge>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'sales' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-secondary-500">#{item.id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">{item.patientId}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">৳{item.totalAmount}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={item.paymentStatus === 'paid' ? 'success' : item.paymentStatus === 'failed' ? 'error' : 'warning'}>
                                                            {item.paymentStatus}
                                                        </Badge>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'lab-tests' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                                        {new Date(item.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                                        {item.patientDetails?.profile?.firstName} {item.patientDetails?.profile?.lastName}
                                                        <div className="text-xs text-secondary-500">{item.patientDetails?.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                                        {item.labDetails?.profile?.firstName || 'Unassigned'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                                        {item.testsCount || 0} Tests
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={item.status === 'completed' ? 'success' : 'warning'}>
                                                            {item.status || 'Pending'}
                                                        </Badge>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'users' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                                                        {new Date(item.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                                                        {item.profile?.firstName} {item.profile?.lastName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                                        {item.email}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={item.role === 'admin' ? 'error' : item.role === 'doctor' ? 'primary' : 'success'}>
                                                            {item.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={item.isEmailVerified ? 'success' : 'warning'}>
                                                            {item.isEmailVerified ? 'Verified' : 'Pending'}
                                                        </Badge>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div >
    );
}
