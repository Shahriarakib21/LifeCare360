'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api, { handleApiError } from '@/lib/api';
import Header from '@/components/layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Bell, Check, Trash2, Calendar, FileText, Activity, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const { user, isAuthenticated, initialize } = useAuthStore();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const router = useRouter();

    useEffect(() => {
        initialize();
    }, [initialize]);

    const fetchNotifications = async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            // Fetch all notifications (limit can be increased or pagination handled)
            const response = await api.get('/api/notifications?limit=100');
            setNotifications(response.data?.data?.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [isAuthenticated]);

    const handleMarkAsRead = async (id: string) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
            toast.success('Marked as read');
        } catch (error) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            // Ideally backend endpoint for this
            const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
            if (unreadIds.length === 0) return;

            // Since we don't have a bulk endpoint confirmed, valid approach is loop or dedicated
            // Assuming loop is acceptable for prototype or if backend supports it.
            // Better: assume backend has a 'mark all' or do it optimistically.
            // Let's rely on individual for certainty or just assume there's no bulk endpoint yet.
            // Actually, Header does a loop.

            await Promise.all(unreadIds.map(id => api.put(`/api/notifications/${id}/read`)));

            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success('All marked as read');
        } catch (error) {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/api/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success('Notification deleted');
        } catch (error) {
            toast.error('Failed to delete notification');
        }
    };

    const notifyTypeConfig = (type: string) => {
        switch (type) {
            case 'lab_order':
            case 'lab_request':
                return { icon: FlaskConical, color: 'text-purple-600', bg: 'bg-purple-100', label: 'Lab' };
            case 'payment_received':
                return { icon: FileText, color: 'text-green-600', bg: 'bg-green-100', label: 'Payment' };
            case 'test_completed':
            case 'result_uploaded':
                return { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Results' };
            case 'appointment_booked':
            case 'appointment_cancelled':
                return { icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Appointment' };
            case 'low_stock':
            case 'refill_request':
                return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Alert' };
            default:
                return { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Notification' };
        }
    };

    // Helper icon component wrapper
    const FlaskConical = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg>;

    const filteredNotifications = filter === 'all'
        ? notifications
        : notifications.filter(n => !n.read);

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <div className="min-h-screen bg-gray-50/50">
            <Header />
            <main className="container-custom py-12 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 tracking-tight">Notifications</h1>
                        <p className="text-secondary-500 font-medium">Manage your alerts and updates</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleMarkAllAsRead}
                            disabled={notifications.every(n => n.read)}
                            className="rounded-xl border border-secondary-200"
                        >
                            Mark all read
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] border border-secondary-200 shadow-soft overflow-hidden p-6 min-h-[60vh]">
                    <div className="flex gap-4 border-b border-secondary-100 pb-4 mb-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`pb-2 text-sm font-bold tracking-wide transition-all ${filter === 'all' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-secondary-400 hover:text-secondary-600'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`pb-2 text-sm font-bold tracking-wide transition-all ${filter === 'unread' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-secondary-400 hover:text-secondary-600'}`}
                        >
                            Unread
                        </button>
                    </div>

                    {filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-secondary-50 rounded-full flex items-center justify-center mb-4">
                                <Bell className="w-8 h-8 text-secondary-300" />
                            </div>
                            <h3 className="text-lg font-bold text-secondary-900">All caught up!</h3>
                            <p className="text-secondary-500">You have no {filter === 'unread' ? 'unread' : ''} notifications.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {filteredNotifications.map((notif) => {
                                    const config = notifyTypeConfig(notif.type);
                                    const Icon = config.icon;

                                    return (
                                        <motion.div
                                            key={notif._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                            className={`p-5 rounded-2xl border transition-all duration-200 ${notif.read
                                                ? 'bg-white border-secondary-100'
                                                : 'bg-primary-50/30 border-primary-100 shadow-sm'
                                                }`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className={`text-[10px] uppercase font-black tracking-wider bg-white ${config.color.replace('text-', 'border-').replace('600', '200')}`}>
                                                                {config.label}
                                                            </Badge>
                                                            <span className="text-xs font-bold text-secondary-400">
                                                                {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            {!notif.read && (
                                                                <button
                                                                    onClick={() => handleMarkAsRead(notif._id)}
                                                                    className="p-2 rounded-lg hover:bg-secondary-100 text-secondary-400 hover:text-primary-600 transition-colors"
                                                                    title="Mark as read"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(notif._id)}
                                                                className="p-2 rounded-lg hover:bg-error-50 text-secondary-400 hover:text-error-600 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <h3 className={`text-base font-bold mb-1 ${notif.read ? 'text-secondary-800' : 'text-secondary-900'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <p className={`text-sm leading-relaxed ${notif.read ? 'text-secondary-500' : 'text-secondary-700'}`}>
                                                        {notif.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
