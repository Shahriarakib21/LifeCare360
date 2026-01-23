'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import Breadcrumbs from '@/components/admin/Breadcrumbs';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isAuthenticated, loading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
            router.push('/auth/login');
        }
    }, [isAuthenticated, user, router, loading]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated || user?.role !== 'admin') {
        return null;
    }

    return (
        <div className="flex h-screen bg-secondary-50">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="container-custom py-8">
                    <Breadcrumbs />
                    {children}
                </div>
            </main>
        </div>
    );
}
