'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Logo from '@/components/common/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { handleApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialize, setAuth } = useAuthStore();
  const redirectAttemptedRef = useRef(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    mfaCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showMFA, setShowMFA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize auth store
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initialize();
    }
  }, [initialize]);

  // Role-based redirection logic
  useEffect(() => {
    if (typeof window === 'undefined' || redirectAttemptedRef.current) return;

    if (isAuthenticated && user) {
      redirectAttemptedRef.current = true;
      const roleRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        patient: '/patient/dashboard',
        doctor: '/doctor/dashboard',
        lab: '/lab/dashboard',
        pharmacy: '/pharmacy/dashboard',
        hospital: '/hospital/dashboard',
        insurance: '/insurance/dashboard',
      };

      const dashboardPath = roleRoutes[user.role] || '/';
      router.push(dashboardPath);
    }
  }, [isAuthenticated, user, router]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const loginApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginApi.post('/api/auth/login', formData);
      const { token, user: userResponse } = response.data.data;

      const normalizedUser = {
        ...userResponse,
        id: userResponse.id || userResponse._id?.toString() || userResponse._id,
      };

      if (!normalizedUser || !normalizedUser.role) {
        throw new Error('Invalid user data received');
      }

      setAuth(normalizedUser, token);
      toast.success('Welcome back to LifeCare360!');
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      if (errorMessage.includes('MFA')) {
        setShowMFA(true);
        toast.error('Multi-factor authentication required');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Visual Identity Section */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-400 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-400 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <Logo size="xl" variant="horizontal" />
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-bold text-white leading-tight">
            Universal Health Access <br />
            <span className="text-primary-300">Simplified for You.</span>
          </h2>
          <p className="text-xl text-primary-100/80 max-w-lg">
            Join the ecosystem connecting patients, doctors, labs, and pharmacies in one unified digital experience.
          </p>
          <div className="flex gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
              <span className="block text-2xl font-bold text-white">10k+</span>
              <span className="text-sm text-primary-200 uppercase tracking-wider">Patients</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
              <span className="block text-2xl font-bold text-white">500+</span>
              <span className="text-sm text-primary-200 uppercase tracking-wider">Doctors</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-primary-300 text-sm italic">
          © 2026 LifeCare360 Ecosystem. All rights reserved.
        </div>
      </div>

      {/* Authentication Section */}
      <div className="flex items-center justify-center p-6 bg-white sm:p-12 lg:bg-slate-50">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8 transform hover:scale-110 transition-transform duration-300">
              <Logo size="auth" variant="horizontal" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Login to your account</h1>
            <p className="mt-2 text-slate-500">Secure access to your medical dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                leftIcon={<Mail className="w-5 h-5" />}
                className="rounded-2xl border-slate-200 focus:border-primary-500 transition-all duration-200"
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
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-primary-500 transition-colors duration-200 focus:outline-none">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                className="rounded-2xl border-slate-200 focus:border-primary-500 transition-all duration-200"
                required
              />

              {showMFA && (
                <Input
                  label="MFA Verification Code"
                  name="mfaCode"
                  type="text"
                  placeholder="000000"
                  value={formData.mfaCode}
                  onChange={(e) => setFormData({ ...formData, mfaCode: e.target.value })}
                  maxLength={6}
                  className="rounded-2xl border-primary-300 bg-primary-50 text-center text-xl font-mono tracking-[0.5em]"
                  required
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center group cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="w-5 h-5 appearance-none border-2 border-slate-200 rounded-md checked:bg-primary-600 checked:border-primary-600 transition-all duration-200"
                  />
                  <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 pointer-events-none check-icon transition-opacity duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="ml-2 text-sm text-slate-600 group-hover:text-primary-600 transition-colors">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-primary-600 hover:text-primary-700 text-sm font-semibold transition-colors duration-200">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
              className="rounded-2xl py-4 bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all transform duration-200"
            >
              Sign In <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>

          <div className="relative flex items-center py-5">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-sm font-medium uppercase tracking-widest px-2">New here?</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <div className="text-center">
            <p className="text-slate-600">
              Create a free account to get started &mdash;{' '}
              <Link href="/auth/register" className="text-primary-600 font-bold hover:text-primary-700 decoration-2 underline-offset-4 transition-all duration-200">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
      <style jsx>{`
        .check-icon {
          opacity: 1;
        }
        input:checked ~ .check-icon {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
