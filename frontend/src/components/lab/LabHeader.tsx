'use client';

import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function LabHeader() {
    const router = useRouter();
    const { user, clearAuth } = useAuthStore();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [labName, setLabName] = useState('');

    useEffect(() => {
        fetchNotifications();
        fetchLabProfile();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/labs/notifications');
            setNotifications(response.data.data?.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchLabProfile = async () => {
        try {
            const response = await api.get('/api/labs/profile');
            const profile = response.data.data?.user?.profile;
            if (profile?.firstName || profile?.lastName) {
                setLabName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim());
            } else {
                setLabName('Lab Portal');
            }
        } catch (error) {
            setLabName('Lab Portal');
        }
    };

    const handleLogout = () => {
        clearAuth();
        router.push('/auth/login');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="fixed top-0 right-0 left-20 h-[72px] bg-white/80 backdrop-blur-xl border-b border-gray-200 z-[55]">
            <div className="h-full px-8 flex items-center justify-between">
                {/* Lab Name */}
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{labName}</h2>
                    <p className="text-sm text-gray-500">Laboratory Management System</p>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        notifications.slice(0, 5).map((notif, idx) => (
                                            <div key={idx} className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                                <p className="text-sm font-medium text-gray-900">{notif.title || 'Notification'}</p>
                                                <p className="text-xs text-gray-500 mt-1">{notif.message || 'New update'}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 text-sm">
                                            No notifications
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-semibold text-gray-900">{user?.email?.split('@')[0] || 'Lab User'}</p>
                                <p className="text-xs text-gray-500">Laboratory</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Profile Dropdown */}
                        {showProfile && (
                            <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200">
                                    <p className="font-semibold text-gray-900">{user?.email}</p>
                                    <p className="text-xs text-gray-500 mt-1">Lab Administrator</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="text-sm font-medium">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
