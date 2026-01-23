'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Bell, User as UserIcon, LogOut, FlaskConical, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

const LabHeader = () => {
    const { user, clearAuth, isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        clearAuth();
        router.push('/auth/login');
    };

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const response = await api.get('/api/notifications?limit=10');
            const { notifications: rawNotifications, unreadCount: count } = response.data?.data || {};

            const formatted = (rawNotifications || []).map((n: any) => ({
                id: n._id,
                title: n.title,
                message: n.message,
                time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                urgency: n.data?.urgency || 'routine',
                type: n.type,
                read: n.read
            }));

            setNotifications(formatted);
            setUnreadCount(count || 0);
        } catch (error) {
            console.error('Failed to fetch lab notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();

            // Connect to Socket.io
            const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const newSocket = io(socketUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected (LabHeader)');
            });

            newSocket.on('notification', (notification: any) => {
                const formatted = {
                    id: notification._id,
                    title: notification.title,
                    message: notification.message,
                    time: 'Just now',
                    urgency: notification.data?.urgency || 'routine',
                    type: notification.type,
                    read: false
                };

                setNotifications(prev => [formatted, ...prev].slice(0, 10));
                setUnreadCount(prev => prev + 1);
                toast.success(notification.title);
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [isAuthenticated, fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 right-0 left-64 h-20 z-40 bg-[#0a0f1d]/50 backdrop-blur-md border-b border-white/10 px-8 flex items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
                <input
                    type="text"
                    placeholder="Search patient ID / test name..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                />
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-6">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                    >
                        <Bell className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#0a0f1d] shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-4 w-80 bg-[#0d1326] border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                            >
                                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                    <h3 className="text-xs font-black tracking-widest text-white uppercase italic">Neural Feed</h3>
                                    <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">{unreadCount} NEW</span>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {loading && notifications.length === 0 ? (
                                        <div className="p-8 text-center"><div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                                    ) : notifications.length > 0 ? (
                                        notifications.map((notif) => (
                                            <div key={notif.id} className={`p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group ${!notif.read ? 'bg-white/[0.05]' : ''}`} onClick={async () => {
                                                if (!notif.read) {
                                                    try {
                                                        await api.put(`/api/notifications/${notif.id}/read`);
                                                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                                                        setUnreadCount(prev => Math.max(0, prev - 1));
                                                    } catch (e) { console.error(e); }
                                                }
                                            }}>
                                                <div className="flex items-start gap-3">
                                                    <div className={`mt-1 p-1.5 rounded-lg bg-white/5 ${notif.urgency === 'stat' ? 'text-red-400' : 'text-cyan-400'}`}>
                                                        <FlaskConical className="w-3.5 h-3.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors uppercase">{notif.title}</p>
                                                            <span className="text-[9px] text-gray-500 font-bold flex items-center"><Clock className="w-2.5 h-2.5 mr-1" />{notif.time}</span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">{notif.message}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center">
                                            <Bell className="w-8 h-8 text-white/5 mx-auto mb-3" />
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">No anomalies detected</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => router.push('/lab/requests')}
                                    className="w-full py-3 text-[10px] font-black tracking-[0.2em] text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all uppercase border-t border-white/5"
                                >
                                    Access Request Stream
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Profile */}
                <div className="flex items-center space-x-3 pl-6 border-l border-white/10">
                    <div className="text-right">
                        <p className="text-sm font-bold text-white leading-none mb-1">
                            {user?.profile?.firstName || 'Lab'} {user?.profile?.lastName || 'User'}
                        </p>
                        <p className="text-xs text-cyan-400 font-medium tracking-wider uppercase">LAB TECHNICIAN</p>
                    </div>
                    <div className="relative group cursor-pointer" onClick={() => router.push('/lab/settings')}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-500 p-0.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all">
                            <div className="w-full h-full rounded-full bg-[#0a0f1d] flex items-center justify-center overflow-hidden">
                                {user?.profile?.avatar ? (
                                    <img src={user.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-5 h-5 text-white" />
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 transition-colors group"
                        title="Logout Session"
                    >
                        <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default LabHeader;
