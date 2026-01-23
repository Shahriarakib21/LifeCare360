'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FlaskConical,
    Upload,
    Users,
    BrainCircuit,
    BarChart3,
    Bell,
    Settings,
    Activity,
    LogOut,
    FileText,
    DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard Overview', href: '/lab/dashboard' },
    { id: 'test-requests', icon: FlaskConical, label: 'Test Requests', href: '/lab/requests' },
    { id: 'upload', icon: Upload, label: 'Upload Reports', href: '/lab/upload-report' },
    { id: 'reports', icon: FileText, label: 'Reports History', href: '/lab/reports' },
    { id: 'pricing', icon: DollarSign, label: 'Pricing Engine', href: '/lab/pricing' },
    { id: 'settings', icon: Settings, label: 'Lab Settings', href: '/lab/settings' },
];

const LabSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { clearAuth } = useAuthStore();

    const handleLogout = () => {
        clearAuth();
        router.push('/auth/login');
    };

    return (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-[#0a0f1d] border-r border-white/10 z-50 flex flex-col">
            {/* Brand */}
            <div className="h-20 flex items-center px-8">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-500 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                        <div className="w-full h-full rounded-[10px] bg-[#0a0f1d] flex items-center justify-center">
                            <Activity className="w-6 h-6 text-cyan-400" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight">HEALTHCARE</h1>
                        <p className="text-[10px] text-cyan-400 font-bold tracking-widest uppercase">Laboratory</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-thin">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.id} href={item.href}>
                            <motion.div
                                whileHover={{ x: 5 }}
                                className={cn(
                                    'group flex items-center px-4 py-3 rounded-xl transition-all duration-200 relative',
                                    isActive
                                        ? 'bg-cyan-500/10 text-cyan-400'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="active-bg"
                                        className="absolute inset-0 bg-cyan-500/10 rounded-xl border border-cyan-500/20"
                                        initial={false}
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}

                                <item.icon className={cn(
                                    'w-5 h-5 mr-3 transition-colors',
                                    isActive ? 'text-cyan-400' : 'group-hover:text-cyan-400'
                                )} />
                                <span className="text-sm font-medium tracking-wide">{item.label}</span>

                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Profile/Storage Info (Futuristic Detail) */}
            <div className="p-6 bg-[#0c1326] border-t border-white/5 space-y-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Lab Capacity</span>
                        <span className="text-xs font-bold text-cyan-400">85%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="w-[85%] h-full bg-gradient-to-r from-cyan-500 to-violet-500" />
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full group flex items-center px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-200"
                >
                    <LogOut className="w-5 h-5 mr-3 transition-colors group-hover:text-red-400" />
                    <span className="text-sm font-medium tracking-wide">Logout Session</span>
                </button>
            </div>
        </aside>
    );
};

export default LabSidebar;
