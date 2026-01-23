'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Users,
    Search,
    Filter,
    Edit2,
    Trash2,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Shield,
    UserCheck
} from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

export default function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filters, setFilters] = useState({ search: '', role: 'all' });
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500);
        return () => clearTimeout(timer);
    }, [filters.search]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                page: pagination.page,
                limit: 10,
                role: filters.role
            };
            if (debouncedSearch) params.search = debouncedSearch;

            const response = await api.get('/api/admin/users', { params });
            setUsers(response.data.data.users);
            setPagination(response.data.data.pagination);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, filters.role, debouncedSearch]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsEditOpen(true);
    };

    const handleDelete = (user: any) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    const handleResetPassword = (user: any) => {
        setSelectedUser(user);
        setIsPasswordOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;
        try {
            await api.delete(`/api/admin/users/${selectedUser._id}`);
            toast.success('User deleted successfully');
            fetchUsers();
            setIsDeleteOpen(false);
        } catch (error) {
            toast.error(handleApiError(error));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
                    <p className="text-secondary-600">Manage system users and permissions</p>
                </div>
                <Button onClick={fetchUsers} variant="secondary" size="sm">
                    Refresh
                </Button>
            </div>

            <Card padding="lg">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="md:w-1/3 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="pl-10 input w-full"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))} // Reset to page 1 on search
                        />
                    </div>
                    <div className="md:w-1/4">
                        <select
                            className="input w-full"
                            value={filters.role}
                            onChange={(e) => {
                                setFilters(prev => ({ ...prev, role: e.target.value }));
                                setPagination(prev => ({ ...prev, page: 1 }));
                            }}
                        >
                            <option value="all">All Roles</option>
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="lab">Lab Technician</option>
                            <option value="pharmacy">Pharmacist</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="py-12 flex justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-secondary-200">
                                <thead className="bg-secondary-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Joined</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-secondary-200">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-secondary-500">
                                                No users found
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user._id} className="hover:bg-secondary-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center group cursor-pointer" onClick={() => window.location.href = `/admin/users/${user._id}`}>
                                                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold group-hover:bg-primary-200 transition-colors">
                                                            {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-secondary-900 group-hover:text-primary-600 transition-colors">
                                                                {user.profile?.firstName} {user.profile?.lastName}
                                                            </div>
                                                            <div className="text-sm text-secondary-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge
                                                        variant={
                                                            user.role === 'admin' ? 'error' :
                                                                user.role === 'doctor' ? 'primary' :
                                                                    user.role === 'lab' ? 'warning' : 'success'
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isEmailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {user.isEmailVerified ? 'Verified' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleResetPassword(user)}
                                                            className="text-secondary-500 hover:text-secondary-900 p-1 hover:bg-secondary-100 rounded"
                                                            title="Change Password"
                                                        >
                                                            <UserCheck className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded"
                                                            title="Edit User"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="text-error-600 hover:text-error-900 p-1 hover:bg-error-50 rounded"
                                                            title="Delete User"
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

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-between border-t border-secondary-200 px-4 py-3 sm:px-6 mt-4">
                                <div className="flex justify-between w-full">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                    </Button>
                                    <span className="text-sm text-secondary-600 self-center">
                                        Page {pagination.page} of {pagination.pages}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.pages}
                                    >
                                        Next <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                user={selectedUser}
                onSuccess={() => {
                    fetchUsers();
                    setIsEditOpen(false);
                }}
            />

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isPasswordOpen}
                onClose={() => setIsPasswordOpen(false)}
                user={selectedUser}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                title="Delete User"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-secondary-600">
                        Are you sure you want to delete <strong>{selectedUser?.email}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete}>Delete User</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Sub-component for Edit Modal
function EditUserModal({ isOpen, onClose, user, onSuccess }: any) {
    const { register, handleSubmit, reset } = useForm();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            reset({
                firstName: user.profile?.firstName || '',
                lastName: user.profile?.lastName || '',
                role: user.role
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: any) => {
        setSaving(true);
        try {
            await api.put(`/api/admin/users/${user._id}`, {
                profile: {
                    ...user.profile,
                    firstName: data.firstName,
                    lastName: data.lastName
                },
                role: data.role
            });
            toast.success('User updated successfully');
            onSuccess();
        } catch (error) {
            toast.error(handleApiError(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit User">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">First Name</label>
                        <input {...register('firstName')} className="input w-full" />
                    </div>
                    <div>
                        <label className="label">Last Name</label>
                        <input {...register('lastName')} className="input w-full" />
                    </div>
                </div>
                <div>
                    <label className="label">Role</label>
                    <select {...register('role')} className="input w-full capitalize">
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="lab">Lab Technician</option>
                        <option value="pharmacy">Pharmacist</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" variant="primary" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </Modal >
    );
}

// Sub-component for Change Password Modal
function ChangePasswordModal({ isOpen, onClose, user }: any) {
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
            toast.error(handleApiError(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
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
