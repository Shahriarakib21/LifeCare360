'use client';

import React, { useState, useEffect } from 'react';
import { Users, Download, Search, UserCheck, Edit2, Trash2, Calendar, Shield } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function PatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', '10');
            if (search) params.append('search', search);

            const response = await api.get(`/api/admin/patients?${params.toString()}`);
            setPatients(response.data.data.patients || []);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Failed to fetch patients:', error);
            toast.error('Failed to load patients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [pagination.page]);

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPatients();
    };

    const handleToggleStatus = async (patient: any) => {
        setActionLoading(patient._id);
        try {
            await api.patch(`/api/admin/users/${patient._id}/status`);
            toast.success(`User ${patient.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchPatients();
        } catch (error) {
            toast.error('Failed to update user status');
        } finally {
            setActionLoading(null);
        }
    };

    const confirmDelete = async () => {
        if (!selectedPatient) return;
        setActionLoading(selectedPatient._id);
        try {
            await api.delete(`/api/admin/users/${selectedPatient._id}`);
            toast.success('User deleted successfully');
            fetchPatients();
            setIsDeleteOpen(false);
        } catch (error) {
            toast.error('Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExportCSV = () => {
        if (patients.length === 0) return;

        const headers = ['Name', 'Email', 'Phone', 'Date of Birth', 'Location', 'Appointments', 'Joined'];
        const rows = patients.map(patient => [
            `${patient.profile?.firstName} ${patient.profile?.lastName}`,
            patient.email,
            patient.profile?.phone || 'N/A',
            patient.profile?.dateOfBirth ? new Date(patient.profile.dateOfBirth).toLocaleDateString() : 'N/A',
            patient.profile?.location?.city || 'N/A',
            patient.stats?.appointments || 0,
            new Date(patient.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
                        <Users className="w-8 h-8 mr-3 text-primary-600" />
                        All Patients
                    </h1>
                    <p className="text-secondary-600 mt-2">Manage and view all registered patients</p>
                </div>
                <Button onClick={handleExportCSV} variant="primary" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Total Patients</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{pagination.total}</p>
                </Card>
                <Card padding="lg" className="border-l-4 border-green-500">
                    <p className="text-sm font-medium text-secondary-500">Active Patients</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {patients.filter(p => p.isActive !== false).length}
                    </p>
                </Card>
                <Card padding="lg" className="border-l-4 border-purple-500">
                    <p className="text-sm font-medium text-secondary-500">New This Month</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">
                        {patients.filter(p => {
                            const monthAgo = new Date();
                            monthAgo.setMonth(monthAgo.getMonth() - 1);
                            return new Date(p.createdAt) > monthAgo;
                        }).length}
                    </p>
                </Card>
            </div>

            {/* Search */}
            <Card padding="lg">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="pl-10 input w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                    <Button onClick={handleSearch} variant="primary">
                        Search
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
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Patient</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Contact</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Location</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Appts</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Joined</th>
                                    <th className="text-right py-3 px-4 font-semibold text-secondary-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-secondary-500">
                                            No patients found
                                        </td>
                                    </tr>
                                ) : (
                                    patients.map((patient: any) => (
                                        <tr key={patient._id} className="border-b border-secondary-100 hover:bg-secondary-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold overflow-hidden">
                                                        {patient.profile?.avatar ? (
                                                            <img src={patient.profile.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{patient.profile?.firstName?.[0]}{patient.profile?.lastName?.[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-secondary-900">
                                                            {patient.profile?.firstName} {patient.profile?.lastName}
                                                        </div>
                                                        <div className="text-sm text-secondary-500">{patient.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-secondary-600">
                                                {patient.profile?.phone || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-secondary-600">
                                                {patient.profile?.location?.city || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-secondary-600">
                                                {patient.stats?.appointments || 0}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={patient.isActive === false ? 'error' : 'success'}>
                                                    {patient.isActive === false ? 'Inactive' : 'Active'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-secondary-600">
                                                {new Date(patient.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setIsPasswordOpen(true);
                                                        }}
                                                        className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Reset Password"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(patient)}
                                                        className={`p-1.5 rounded-lg transition-colors ${patient.isActive === false
                                                            ? 'text-green-600 hover:bg-green-50'
                                                            : 'text-warning-600 hover:bg-warning-50'
                                                            }`}
                                                        title={patient.isActive === false ? 'Activate' : 'Deactivate'}
                                                        disabled={actionLoading === patient._id}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPatient(patient);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                        className="p-1.5 text-secondary-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-secondary-200">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-secondary-600">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === pagination.pages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </Card>

            <ResetPasswordModal
                isOpen={isPasswordOpen}
                onClose={() => setIsPasswordOpen(false)}
                user={selectedPatient}
            />

            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Patient"
            >
                <div className="space-y-4">
                    <p className="text-secondary-600">
                        Are you sure you want to delete <strong>{selectedPatient?.profile?.firstName} {selectedPatient?.profile?.lastName}</strong>? This action cannot be undone and will remove all associated medical history.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            className="bg-error-600 hover:bg-error-700"
                            onClick={confirmDelete}
                            disabled={actionLoading === selectedPatient?._id}
                        >
                            {actionLoading === selectedPatient?._id ? 'Deleting...' : 'Delete Patient'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

function ResetPasswordModal({ isOpen, onClose, user }: any) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) reset();
    }, [isOpen, reset]);

    const onSubmit = async (data: any) => {
        if (data.password !== data.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setSaving(true);
        try {
            await api.post(`/api/admin/users/${user._id}/reset-password`, {
                password: data.password
            });
            toast.success('Password updated successfully');
            onClose();
        } catch (error) {
            toast.error('Failed to reset password');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reset Password">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm text-secondary-600 mb-4">
                    Set a new password for <strong>{user?.email}</strong>.
                </p>
                <div>
                    <label className="label">New Password</label>
                    <input
                        type="password"
                        {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 chars' } })}
                        className="input w-full"
                    />
                    {errors.password && <span className="text-xs text-error-500">{errors.password.message as string}</span>}
                </div>
                <div>
                    <label className="label">Confirm Password</label>
                    <input
                        type="password"
                        {...register('confirmPassword', { required: true })}
                        className="input w-full"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
