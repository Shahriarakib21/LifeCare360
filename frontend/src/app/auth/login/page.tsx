'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
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

  // Initialize auth store from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initialize();
    }
  }, [initialize]);

  // Handle redirect
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
      setTimeout(() => {
        router.push(dashboardPath);
      }, 100);
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
      const loginApi = axios.create({
        baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await loginApi.post('/api/auth/login', formData);
      const { token, user: userResponse } = response.data.data;

      const normalizedUser = {
        ...userResponse,
        id: userResponse.id || userResponse._id?.toString() || userResponse._id,
      };

      if (!normalizedUser || !normalizedUser.role) {
        toast.error('Invalid user data received');
        return;
      }

      setAuth(normalizedUser, token);
      toast.success('Login successful!');
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      if (errorMessage.includes('MFA')) {
        setShowMFA(true);
        toast.error('MFA code required');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/auth-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex justify-center items-center pt-8 pb-4">
          <Logo showText={true} textClassName="text-white" />
        </div>

        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20" padding="lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
              <p className="text-white/90">Sign in to your HealthLife account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                leftIcon={<Mail className="w-5 h-5 text-white/70" />}
                className="bg-white/10 text-white placeholder:text-white/50 border-white/20"
                required
              />

              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                leftIcon={<Lock className="w-5 h-5 text-white/70" />}
                className="bg-white/10 text-white placeholder:text-white/50 border-white/20"
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-white/70">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
              />

              {showMFA && (
                <Input
                  label="MFA Code"
                  name="mfaCode"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={formData.mfaCode}
                  onChange={(e) => setFormData({ ...formData, mfaCode: e.target.value })}
                  maxLength={6}
                  required
                />
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-white/30 rounded bg-white/20" />
                  <span className="ml-2 text-sm text-white/90">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" size="sm" className="text-white hover:underline text-sm font-medium">Forgot password?</Link>
              </div>

              <Button type="submit" fullWidth size="lg" isLoading={loading}>Sign In</Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-white/90">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-white font-medium underline">Sign up</Link>
              </p>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
