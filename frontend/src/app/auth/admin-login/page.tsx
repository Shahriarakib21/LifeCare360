'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import Logo from '@/components/common/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { handleApiError } from '@/lib/api';

export default function AdminLoginPage() {
    const router = useRouter();
    const { isAuthenticated, user, initialize, setAuth } = useAuthStore();
    const redirectAttemptedRef = useRef(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize auth store
    useEffect(() => {
        if (typeof window !== 'undefined') {
            initialize();
        }
    }, [initialize]);

    // Handle redirect if already logged in as admin
    useEffect(() => {
        if (typeof window === 'undefined' || redirectAttemptedRef.current) return;

        if (isAuthenticated && user) {
            if (user.role === 'admin') {
                redirectAttemptedRef.current = true;
                router.push('/admin/dashboard');
            } else {
                // If logged in but not admin, maybe redirect to their dashboard or just stay here?
                // For security/UX, probably better to stay and let them know or let them logout.
                // But existing auth store might conflict. Let's assume they can login as admin essentially switching accounts or start fresh.
                // Actually, if they are logged in as patient, they shouldn't be here.
                // Let's strictly check on submit.
            }
        }
    }, [isAuthenticated, user, router]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);

        try {
            // Use standard auth Login
            const loginApi = axios.create({
                baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
                timeout: 5000,
                headers: { 'Content-Type': 'application/json' },
            });

            const response = await loginApi.post('/api/auth/login', { ...formData });
            const { token, user: userResponse } = response.data.data;

            const normalizedUser = {
                ...userResponse,
                id: userResponse.id || userResponse._id?.toString() || userResponse._id,
            };

            // Strict Admin Check
            if (normalizedUser.role !== 'admin') {
                toast.error('Access Denied: Administrators only.');
                // Don't set auth if not admin
                return;
            }

            setAuth(normalizedUser, token);
            toast.success('Admin access granted.');
            router.push('/admin/dashboard');

        } catch (error: any) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-secondary-50">
            {/* Left Section - Medical Graphic (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 to-primary-700 relative overflow-hidden items-center justify-center">
                <div className="absolute inset-0 opacity-20">
                    {/* Abstract circular patterns or similar could go here via CSS or SVG */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" fillOpacity="0.1" />
                    </svg>
                </div>
                <div className="relative z-10 text-center px-12">
                    <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm inline-block mb-6">
                        <Logo showText={false} className="w-20 h-20 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">HealthLife Admin</h1>
                    <p className="text-primary-100 text-lg max-w-md mx-auto leading-relaxed">
                        Secure administration usage only. Manage users, monitor stats, and oversee platform operations.
                    </p>
                </div>
            </div>

            {/* Right/Center Section - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Header */}
                    <div className="lg:hidden text-center mb-8">
                        <Logo showText={true} />
                    </div>

                    <Card padding="lg" className="shadow-xl border-secondary-100">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-error-50 text-error-600 mb-4">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-secondary-900">Admin Login</h2>
                            <p className="text-sm text-secondary-500 mt-2">Authorized personnel only</p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start">
                            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="ml-3 text-sm text-amber-700">
                                This portal is restricted to system administrators. All access attempts are logged.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                placeholder="admin@healthlife.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                error={errors.email}
                                leftIcon={<Mail className="w-5 h-5 text-secondary-400" />}
                                required
                            />

                            <Input
                                label="Password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                error={errors.password}
                                leftIcon={<Lock className="w-5 h-5 text-secondary-400" />}
                                rightIcon={
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-secondary-400 hover:text-secondary-600">
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                }
                                required
                            />

                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input type="checkbox" className="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500" />
                                    <span className="ml-2 text-sm text-secondary-600">Remember me</span>
                                </label>
                                {/* Optional Forgot Password */}
                                <Link href="/auth/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700">
                                    Forgot password?
                                </Link>
                            </div>

                            <Button type="submit" fullWidth size="lg" isLoading={loading} variant="primary" className="shadow-lg shadow-primary-500/30">
                                Access Dashboard
                            </Button>
                        </form>
                    </Card>

                    <div className="text-center mt-6">
                        <p className="text-sm text-secondary-600">
                            Don't have an account?{' '}
                            <Link href="/auth/register" className="text-primary-600 font-medium hover:underline">
                                Sign up
                            </Link>
                        </p>
                    </div>

                    <div className="text-center">
                        <p className="text-xs text-secondary-400">
                            &copy; {new Date().getFullYear()} HealthLife System. Secure Admin Portal.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
