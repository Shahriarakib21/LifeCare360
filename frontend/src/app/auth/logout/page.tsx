'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function LogoutPage() {
    const router = useRouter();
    const { clearAuth } = useAuthStore();

    useEffect(() => {
        // Clear all auth data
        clearAuth();

        // Clear localStorage completely
        if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
        }

        // Redirect to login after a short delay
        setTimeout(() => {
            router.push('/auth/login');
        }, 500);
    }, [clearAuth, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Logging out...</p>
            </div>
        </div>
    );
}
