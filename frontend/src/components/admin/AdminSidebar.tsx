'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    BarChart,
    UserCheck,
    Stethoscope,
    FlaskConical,
    Pill,
    Wallet
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Logo from '@/components/common/Logo';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Patients', href: '/admin/patients', icon: UserCheck },
    { name: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
    { name: 'Labs', href: '/admin/labs', icon: FlaskConical },
    { name: 'Lab Revenue', href: '/admin/labs/revenue', icon: BarChart },
    { name: 'Pharmacies', href: '/admin/pharmacies', icon: Pill },
    { name: 'Reports', href: '/admin/reports', icon: BarChart },
    { name: 'Revenue', href: '/admin/revenue', icon: Wallet },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { clearAuth } = useAuthStore();
    const router = useRouter();

    const handleLogout = () => {
        clearAuth();
        router.push('/auth/login');
    };

    const isActive = (href: string) => {
        return pathname === href || pathname?.startsWith(href);
    };

    return (
        <div className="h-screen w-64 bg-white border-r border-secondary-200 flex flex-col hidden md:flex">
            {/* Logo Section */}
            <div className="p-6 border-b border-secondary-100 flex items-center justify-center">
                <Logo size="sidebar" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {navigation.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${active
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                }`}
                        >
                            <item.icon
                                className={`mr-3 h-5 w-5 ${active ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-500'
                                    }`}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Section */}
            <div className="p-4 border-t border-secondary-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-error-600 rounded-xl hover:bg-error-50 transition-colors"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
