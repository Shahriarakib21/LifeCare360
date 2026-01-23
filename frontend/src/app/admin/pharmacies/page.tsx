'use client';

import React, { useState, useEffect } from 'react';
import { Pill, Download, Search, Shield, Trash2, UserCheck } from 'lucide-react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function PharmaciesPage() {
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [search, setSearch] = useState('');
    const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPharmacies = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', '10');
            if (search) params.append('search', search);

            const response = await api.get(`/api/admin/pharmacies?${params.toString()}`);
            setPharmacies(response.data.data.pharmacies || []);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Failed to fetch pharmacies:', error);
            toast.error('Failed to load pharmacy users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPharmacies();
    }, [pagination.page]);

    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchPharmacies();
    };

    const handleToggleStatus = async (pharmacy: any) => {
        setActionLoading(pharmacy._id);
        try {
            await api.patch(`/api/admin/users/${pharmacy._id}/status`);
            toast.success(`User ${pharmacy.isActive ? 'deactivated' : 'activated'} successfully`);
            fetchPharmacies();
        } catch (error) {
            toast.error('Failed to update user status');
        } finally {
            setActionLoading(null);
        }
    };

    const confirmDelete = async () => {
        if (!selectedPharmacy) return;
        setActionLoading(selectedPharmacy._id);
        try {
            await api.delete(`/api/admin/users/${selectedPharmacy._id}`);
            toast.success('User deleted successfully');
            fetchPharmacies();
            setIsDeleteOpen(false);
        } catch (error) {
            toast.error('Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleExportCSV = () => {
        if (pharmacies.length === 0) return;

        const headers = ['Name', 'Email', 'Phone', 'Joined'];
        const rows = pharmacies.map(pharmacy => [
            `${pharmacy.profile?.firstName} ${pharmacy.profile?.lastName}`,
            pharmacy.email,
            pharmacy.profile?.phone || 'N/A',
            new Date(pharmacy.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pharmacy_users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 flex items-center">
                        <Pill className="w-8 h-8 mr-3 text-primary-600" />
                        All Pharmacy Users
                    </h1>
                    <p className="text-secondary-600 mt-2">Manage and view all pharmacy staff</p>
                </div>
                <Button onClick={handleExportCSV} variant="primary" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card padding="lg">
                    <p className="text-sm font-medium text-secondary-500">Total Pharmacy Users</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{pagination.total}</p>
                </Card>
                <Card padding="lg" className="border-l-4 border-green-500">
                    <p className="text-sm font-medium text-secondary-500">Active Pharmacy Users</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {pharmacies.filter(p => p.isActive !== false).length}
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
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Pharmacy User</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Contact</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-secondary-700">Joined</th>
                                    <th className="text-right py-3 px-4 font-semibold text-secondary-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pharmacies.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-secondary-500">
                                            No pharmacy users found
                                        </td>
                                    </tr>
                                ) : (
                                    pharmacies.map((pharmacy: any) => (
                                        <tr key={pharmacy._id} className="border-b border-secondary-100 hover:bg-secondary-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold overflow-hidden">
                                                        {pharmacy.profile?.avatar ? (
                                                            <img src={pharmacy.profile.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span>{pharmacy.profile?.firstName?.[0]}{pharmacy.profile?.lastName?.[0]}</span>
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-secondary-900">
                                                            {pharmacy.profile?.firstName} {pharmacy.profile?.lastName}
                                                        </div>
                                                        <div className="text-sm text-secondary-500">{pharmacy.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-secondary-600">
                                                {pharmacy.profile?.phone || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={pharmacy.isActive === false ? 'error' : 'success'}>
                                                    {pharmacy.isActive === false ? 'Inactive' : 'Active'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-secondary-600">
                                                {new Date(pharmacy.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPharmacy(pharmacy);
                                                            setIsPasswordOpen(true);
                                                        }}
                                                        className="p-1.5 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="Reset Password"
                                                    >
                                                        <UserCheck className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStatus(pharmacy)}
                                                        className={`p-1.5 rounded-lg transition-colors ${pharmacy.isActive === false
                                                            ? 'text-green-600 hover:bg-green-50'
                                                            : 'text-warning-600 hover:bg-warning-50'
                                                            }`}
                                                        title={pharmacy.isActive === false ? 'Activate' : 'Deactivate'}
                                                        disabled={actionLoading === pharmacy._id}
                                                    >
                                                        <Shield className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedPharmacy(pharmacy);
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
                user={selectedPharmacy}
            />

            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete Pharmacy User"
            >
                <div className="space-y-4">
                    <p className="text-secondary-600">
                        Are you sure you want to delete <strong>{selectedPharmacy?.profile?.firstName} {selectedPharmacy?.profile?.lastName}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            className="bg-error-600 hover:bg-error-700"
                            onClick={confirmDelete}
                            disabled={actionLoading === selectedPharmacy?._id}
                        >
                            {actionLoading === selectedPharmacy?._id ? 'Deleting...' : 'Delete Pharmacy User'}
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
