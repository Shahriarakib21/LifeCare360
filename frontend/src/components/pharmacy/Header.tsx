'use client';

import { Bell, Search, User, Clock, CheckCircle, LogOut, Settings, BarChart } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const notifications = [
    {
        id: 1,
        title: 'Low Stock Alert',
        message: 'Amoxicillin stock is below 20 units.',
        time: '5 mins ago',
        type: 'warning',
        read: false,
    },
    {
        id: 2,
        title: 'New Prescription',
        message: 'Dr. Wilson sent a new prescription for John Doe.',
        time: '1 hour ago',
        type: 'info',
        read: false,
    },
    {
        id: 3,
        title: 'Order Completed',
        message: 'Order #ORD-2451 has been delivered.',
        time: '2 hours ago',
        type: 'success',
        read: true,
    },
];

export function Header() {
    const [searchValue, setSearchValue] = useState('');
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const { user, clearAuth } = useAuthStore();
    const router = useRouter();

    const notificationRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    // Get display name with fallback
    const displayName = user?.profile?.firstName
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user?.name || user?.email?.split('@')[0] || 'Pharmacy User';

    const role = user?.role || 'Pharmacy Staff';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (userRef.current && !userRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        clearAuth();
        router.push('/auth/login');
    };

    return (
        <header className="h-16 bg-white border-b border-secondary-100 px-6 flex items-center justify-between sticky top-0 z-20 w-full">
            <div className="w-full max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                        type="text"
                        placeholder="Search medicine / prescription..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-secondary-50 border-none rounded-lg focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all duration-200 placeholder:text-secondary-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <button
                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                        className={cn(
                            "relative p-2 text-secondary-400 hover:text-secondary-600 transition-colors rounded-full hover:bg-secondary-50",
                            isNotificationsOpen && "bg-secondary-50 text-secondary-600"
                        )}
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-error-500 rounded-full border-2 border-white"></span>
                    </button>

                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-secondary-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-secondary-100 flex items-center justify-between">
                                <h3 className="font-semibold text-secondary-900">Notifications</h3>
                                <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Mark all as read</button>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-secondary-50">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={cn(
                                                    "p-4 hover:bg-secondary-50 transition-colors cursor-pointer",
                                                    !notification.read && "bg-primary-50/30"
                                                )}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full mt-2 shrink-0",
                                                        notification.type === 'warning' && "bg-warning-500",
                                                        notification.type === 'info' && "bg-primary-500",
                                                        notification.type === 'success' && "bg-success-500"
                                                    )} />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-secondary-900 leading-tight">{notification.title}</p>
                                                        <p className="text-xs text-secondary-600 mt-1 line-clamp-2">{notification.message}</p>
                                                        <div className="flex items-center gap-1 mt-2 text-[10px] text-secondary-400 font-medium uppercase tracking-wider">
                                                            <Clock className="w-3 h-3" />
                                                            {notification.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <Bell className="w-8 h-8 text-secondary-200 mx-auto mb-3" />
                                        <p className="text-sm text-secondary-500">No new notifications</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-3 bg-secondary-50 border-t border-secondary-100 text-center">
                                <button className="text-xs text-secondary-600 hover:text-secondary-900 font-medium">View all notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userRef}>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-3 pl-4 border-l border-secondary-100 outline-none hover:bg-secondary-50 p-2 rounded-lg transition-colors"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-secondary-900">{displayName}</p>
                            <p className="text-xs text-secondary-500 capitalize">{role}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center border border-primary-200">
                            <User className="w-5 h-5 text-primary-600" />
                        </div>
                    </button>

                    {isUserMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white border border-secondary-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-secondary-100 block sm:hidden">
                                <p className="font-medium text-secondary-900">{displayName}</p>
                                <p className="text-xs text-secondary-500">{role}</p>
                            </div>
                            <div className="p-2 space-y-1">
                                <button
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        router.push('/pharmacy/settings');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 rounded-lg transition-colors"
                                >
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </button>
                                <button
                                    onClick={() => {
                                        setIsUserMenuOpen(false);
                                        router.push('/pharmacy/reports');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 rounded-lg transition-colors"
                                >
                                    <span className="w-4 h-4 flex items-center justify-center">
                                        <BarChart className="w-4 h-4" />
                                    </span>
                                    Reports
                                </button>
                            </div>
                            <div className="p-2 border-t border-secondary-100">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error-600 hover:bg-error-50 hover:text-error-700 rounded-lg transition-colors"
                                >
                                    {/* LogOut icon usually, but I'll trust import or just use text if icon missing */}
                                    <span className="w-4 h-4">🚪</span>
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
