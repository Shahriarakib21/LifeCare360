'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Calendar,
    Pill,
    FlaskConical,
    BrainCircuit,
    ShieldCheck,
    Settings,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'framer-motion';
import Logo from '@/components/common/Logo';

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/patient/dashboard' },
    { icon: FileText, label: 'My Health Records', href: '/patient/ehr' },
    { icon: Calendar, label: 'Appointments', href: '/patient/appointments' },
    { icon: Pill, label: 'My Prescriptions', href: '/patient/medications' },
    { icon: Pill, label: 'Pharmacy Shop', href: '/medicines' },
    { icon: FlaskConical, label: 'Lab Tests & Booking', href: '/patient/lab/booking' },
    { icon: FlaskConical, label: 'Lab Orders', href: '/patient/lab/orders' },
    { icon: FlaskConical, label: 'Lab Reports', href: '/patient/reports' },
    { icon: BrainCircuit, label: 'AI Insights', href: '/patient/insights' },
    { icon: ShieldCheck, label: 'Insurance', href: '/patient/insurance' },
    { icon: Settings, label: 'Settings', href: '/patient/settings' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { clearAuth } = useAuthStore();

    const handleLogout = () => {
        clearAuth();
        window.location.href = '/auth/login';
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-100 hidden md:flex flex-col h-full font-sans shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
            <div className="p-6 border-b border-slate-50 flex items-center justify-center">
                <Logo size="lg" />
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
                <div className="mb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Menu
                </div>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="block"
                        >
                            <div
                                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                                        ? 'bg-teal-50 text-teal-700 font-medium shadow-sm border-l-4 border-teal-500'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                                    }
                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                <span>{item.label}</span>
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-teal-400" />}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-50">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors duration-200 group"
                >
                    <LogOut className="w-5 h-5 group-hover:text-red-500" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}
