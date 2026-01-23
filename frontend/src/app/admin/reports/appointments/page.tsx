'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Search, User, Stethoscope } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AppointmentReportsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        doctorId: ''
    });

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.status) params.append('status', filters.status);
            if (filters.doctorId) params.append('doctorId', filters.doctorId);

            const response = await api.get(`/api/reports/appointments?${params.toString()}`);
            setAppointments(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        fetchAppointments();
    };

    const handleExportCSV = () => {
        if (appointments.length === 0) return;

        const headers = ['Date', 'Time', 'Patient', 'Doctor', 'Status', 'Type', 'Fee', 'Fee Status'];
        const rows = appointments.map(apt => [
            apt.date,
            apt.time,
            apt.patientIdDetails?.profile?.firstName + ' ' + apt.patientIdDetails?.profile?.lastName || 'N/A',
            apt.doctorDetails?.userDetails?.profile?.firstName + ' ' + apt.doctorDetails?.userDetails?.profile?.lastName || 'N/A',
            apt.status,
            apt.type,
            apt.visitFee || 0,
            apt.feeStatus || 'N/A'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appointments_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
                        <Calendar className="w-8 h-8 mr-3 text-primary-600" />
                        Appointment Reports
                    </h1>
                    <p className="text-secondary-600 mt-2">View and analyze all appointments</p>
                </div>
                <Button onClick={handleExportCSV} variant="primary" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
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
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'confirmed', label: 'Confirmed' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                            { value: 'no-show', label: 'No Show' }
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
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Date</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Time</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Patient</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Doctor</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Specialization</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Type</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Fee</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-8 text-secondary-500">
                                            No appointments found
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.map((apt, idx) => (
                                        <tr key={idx} className="border-b border-secondary-100 hover:bg-secondary-50">
                                            <td className="py-3 px-4">{apt.date}</td>
                                            <td className="py-3 px-4">{apt.time}</td>
                                            <td className="py-3 px-4">
                                                {apt.patientIdDetails?.profile?.firstName} {apt.patientIdDetails?.profile?.lastName}
                                            </td>
                                            <td className="py-3 px-4">
                                                {apt.doctorDetails?.userDetails?.profile?.firstName} {apt.doctorDetails?.userDetails?.profile?.lastName}
                                            </td>
                                            <td className="py-3 px-4">{apt.doctorDetails?.specialization || 'N/A'}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        apt.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                                            apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {apt.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{apt.type}</td>
                                            <td className="py-3 px-4">
                                                ${apt.visitFee || 0} ({apt.feeStatus || 'pending'})
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
                <div className="mt-4 text-sm text-secondary-600">
                    Total: {appointments.length} appointments
                </div>
            </Card>
        </div>
    );
}
