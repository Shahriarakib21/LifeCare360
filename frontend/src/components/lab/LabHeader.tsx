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
                setLabName('Clinical Lab');
            }
        } catch (error) {
            setLabName('Clinical Lab');
        }
    };

    const handleLogout = () => {
        clearAuth();
        router.push('/auth/login');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="fixed top-0 right-0 left-20 h-[80px] bg-white border-b border-secondary-100 z-[55]">
            <div className="h-full px-10 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-secondary-900 tracking-tight leading-none mb-1">{labName}</h2>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest leading-none">Diagnostic Center Management</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-3 rounded-2xl bg-secondary-50 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-[10px] font-black rounded-lg border-2 border-white flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 top-14 w-96 bg-white rounded-[2rem] shadow-2xl border border-secondary-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="p-6 border-b border-secondary-50 flex items-center justify-between">
                                    <h3 className="font-black text-secondary-900 uppercase text-xs tracking-widest">Notifications</h3>
                                    <span className="text-[10px] font-black text-primary-500">{unreadCount} New</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.slice(0, 5).map((notif, idx) => (
                                            <div key={idx} className="p-6 border-b border-secondary-50 hover:bg-secondary-50/50 cursor-pointer transition-colors group">
                                                <p className="text-sm font-black text-secondary-900 group-hover:text-primary-600 transition-colors uppercase leading-tight mb-2">{notif.title || 'System Alert'}</p>
                                                <p className="text-[10px] text-secondary-500 font-bold leading-relaxed">{notif.message || 'Processing laboratory data update.'}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center space-y-3">
                                            <Bell className="w-10 h-10 text-secondary-200 mx-auto" />
                                            <p className="text-xs font-black text-secondary-400 uppercase tracking-widest">Queue Clear</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-4 pl-2 pr-4 py-2 rounded-2xl bg-secondary-50 hover:bg-secondary-100 transition-all group"
                        >
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left hidden lg:block">
                                <p className="text-xs font-black text-secondary-900 uppercase tracking-tight">{user?.email?.split('@')[0] || 'Technician'}</p>
                                <p className="text-[10px] font-black text-primary-500 uppercase tracking-tighter">Lab Specialist</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-secondary-400" />
                        </button>

                        {showProfile && (
                            <div className="absolute right-0 top-14 w-64 bg-white rounded-[2rem] shadow-2xl border border-secondary-100 overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="p-6 border-b border-secondary-50">
                                    <p className="text-xs font-black text-secondary-400 uppercase tracking-widest mb-1">Authenticated as</p>
                                    <p className="font-black text-secondary-900 truncate text-sm">{user?.email}</p>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-6 py-4 flex items-center gap-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all group"
                                    >
                                        <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform text-red-600" />
                                        <span className="text-xs font-black uppercase tracking-widest">Safety Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
