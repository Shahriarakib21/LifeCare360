'use client';

import React from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Image from 'next/image';

export default function PatientHeader() {
    const { user, clearAuth } = useAuthStore();
    const userName = user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : 'Patient';

    // Dropdown states
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [showProfileMenu, setShowProfileMenu] = React.useState(false);

    const handleLogout = () => {
        clearAuth();
        window.location.href = '/auth/login';
    };

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-20 px-8 flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl hidden md:block">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search reports, doctors, medicines..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 text-sm"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-auto">
                {/* Notifications Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                        className={`relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-500 hover:text-teal-600 transition-colors border ${showNotifications ? 'bg-slate-50 text-teal-600 border-slate-100' : 'border-transparent hover:border-slate-100'}`}
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-900">Notifications</h3>
                                <span className="text-xs text-teal-600 cursor-pointer font-medium hover:underline">Mark all read</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex gap-3">
                                        <div className="w-2 h-2 mt-2 rounded-full bg-teal-500 flex-shrink-0"></div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">New test result available</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Your Complete Blood Count report is ready.</p>
                                            <p className="text-[10px] text-slate-400 mt-1">2 hours ago</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

                {/* User Profile Dropdown */}
                <div className="relative">
                    <div
                        onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group select-none"
                    >
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-semibold text-slate-700 group-hover:text-teal-700 transition-colors">{userName}</p>
                            <p className="text-xs text-slate-500">Patient</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-teal-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                            <span className="font-bold text-teal-600">{userName.charAt(0)}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-teal-500 transition-transform hidden md:block ${showProfileMenu ? 'rotate-180' : ''}`} />
                    </div>

                    {showProfileMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-3 border-b border-slate-50 mb-1">
                                <p className="font-semibold text-slate-900">{userName}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <div className="space-y-1">
                                <button onClick={() => window.location.href = '/patient/profile'} className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors flex items-center gap-2">
                                    Profile Settings
                                </button>
                                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors flex items-center gap-2 font-medium">
                                    Log Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
