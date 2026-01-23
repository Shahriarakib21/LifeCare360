'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Shield,
    Activity,
    Pill,
    FileText,
    ArrowLeft
} from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function UserDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, historyRes] = await Promise.all([
                    api.get(`/api/admin/users/${id}`),
                    api.get(`/api/admin/users/${id}/activity`)
                ]);
                setUser(userRes.data.data);
                setHistory(historyRes.data.data || []);
            } catch (error) {
                toast.error(handleApiError(error));
                router.push('/admin/users');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                    Back to Users
                </Button>
                <div className="flex gap-2">
                    <Button
                        variant={activeTab === 'overview' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('overview')}
                        size="sm"
                    >
                        Overview
                    </Button>
                    <Button
                        variant={activeTab === 'history' ? 'primary' : 'ghost'}
                        onClick={() => setActiveTab('history')}
                        size="sm"
                    >
                        Activity History
                    </Button>
                </div>
            </div>

            {/* Header / Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-50 to-white px-6 py-8 border-b border-primary-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 text-3xl font-bold border-4 border-white shadow-md overflow-hidden">
                        {user.profile?.avatar ? (
                            <img src={user.profile.avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span>{user.profile?.firstName?.[0] || user.email?.[0]?.toUpperCase()}</span>
                        )}
                    </div>
                    <div className="text-center md:text-left flex-1">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-1">
                            <h1 className="text-2xl font-bold text-secondary-900">
                                {user.profile?.firstName} {user.profile?.lastName}
                            </h1>
                            <Badge variant={user.isActive !== false ? 'success' : 'error'}>
                                {user.isActive !== false ? 'Active Account' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-secondary-500 flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" /> {user.email}
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                            <Badge variant="info" className="capitalize">
                                <Shield className="w-3 h-3 mr-1" />
                                {user.role}
                            </Badge>
                            <Badge variant={user.isEmailVerified ? 'success' : 'warning'}>
                                {user.isEmailVerified ? 'Verified' : 'Unverified'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Contact Info */}
                    <Card title="Contact Information" icon={<User className="w-5 h-5 text-primary-600" />}>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-secondary-400 mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-secondary-900">Phone</p>
                                    <p className="text-sm text-secondary-600">{user.profile?.phone || 'Not provided'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-secondary-400 mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-secondary-900">Address</p>
                                    <p className="text-sm text-secondary-600">
                                        {user.profile?.location?.address ? (
                                            <>
                                                {user.profile.location.address}<br />
                                                {user.profile.location.city}, {user.profile.location.state}
                                            </>
                                        ) : 'Not provided'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="w-4 h-4 text-secondary-400 mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-secondary-900">Joined</p>
                                    <p className="text-sm text-secondary-600">
                                        {new Date(user.createdAt).toLocaleDateString(undefined, {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Stats */}
                    <div className="md:col-span-2 space-y-6">
                        <Card title="Platform Engagement">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 text-center">
                                    <Activity className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-primary-900">{user.stats?.appointments || 0}</p>
                                    <p className="text-xs text-primary-600 font-medium uppercase tracking-wider">Appointments</p>
                                </div>
                                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                    <Pill className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-orange-900">{user.stats?.orders || 0}</p>
                                    <p className="text-xs text-orange-600 font-medium uppercase tracking-wider">Orders</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                    <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-blue-900">{user.stats?.labTests || 0}</p>
                                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Lab Tests</p>
                                </div>
                            </div>
                        </Card>

                        {/* Recent Activity Mini-List */}
                        <Card title="Recent Activity" headerAction={
                            <Button variant="ghost" size="sm" onClick={() => setActiveTab('history')}>View All</Button>
                        }>
                            <div className="space-y-4">
                                {history.length === 0 ? (
                                    <p className="text-center py-4 text-secondary-500 italic">No recent activity found</p>
                                ) : (
                                    history.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-4 py-2 border-b border-secondary-50 last:border-0">
                                            <div className={`p-2 rounded-lg ${item.type === 'LOGIN' ? 'bg-green-100 text-green-600' : 'bg-primary-100 text-primary-600'}`}>
                                                {item.type === 'LOGIN' ? <Activity className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-secondary-900">{item.details}</p>
                                                <p className="text-xs text-secondary-500">{new Date(item.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            ) : (
                <Card title="Comprehensive Activity History">
                    <div className="space-y-6">
                        {history.length === 0 ? (
                            <div className="text-center py-12">
                                <Activity className="w-12 h-12 text-secondary-200 mx-auto mb-4" />
                                <p className="text-secondary-500">No activity logs found for this user.</p>
                            </div>
                        ) : (
                            <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-secondary-100">
                                {history.map((item, idx) => (
                                    <div key={idx} className="relative">
                                        <div className={`absolute -left-8 w-7 h-7 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${item.type === 'LOGIN' ? 'bg-green-500' : 'bg-primary-500'
                                            }`}>
                                            {item.type === 'LOGIN' ? <Activity className="w-3 h-3 text-white" /> : <Shield className="w-3 h-3 text-white" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-bold text-secondary-900">{item.type === 'LOGIN' ? 'Successful Login' : item.type}</p>
                                                <span className="text-xs text-secondary-400 bg-secondary-50 px-2 py-1 rounded-md">{new Date(item.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-sm text-secondary-600">{item.details}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
    );
}
