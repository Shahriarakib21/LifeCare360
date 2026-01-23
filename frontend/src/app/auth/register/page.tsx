'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import Logo from '@/components/common/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, user, initialize } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'patient',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    // Initialize auth store from localStorage
    if (typeof window !== 'undefined') {
      initialize();

      // Check authentication after a short delay to allow store to initialize
      const timer = setTimeout(() => {
        if (isAuthenticated && user) {
          const dashboardPath = `/${user.role}/dashboard`;
          router.push(dashboardPath);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, router, initialize]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await api.post('/api/auth/register', registerData);
      const { token, user } = response.data.data;

      // Use auth store to set auth (which also updates localStorage)
      const { useAuthStore } = await import('@/store/authStore');
      useAuthStore.getState().setAuth(user, token);

      toast.success('Account created successfully!');

      // Redirect to dashboard
      const dashboardPath = `/${user.role}/dashboard`;
      router.push(dashboardPath);
    } catch (error: any) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/auth-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Centered Logo */}
        <div className="flex justify-center items-center pt-8 pb-4">
          <Logo showText={true} textClassName="text-white" />
        </div>

        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20" padding="lg">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Create Account
              </h1>
              <p className="text-white/90">
                Join HealthLife to manage your health
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  error={errors.firstName}
                  leftIcon={<User className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Last Name"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  error={errors.lastName}
                  required
                />
              </div>

              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                leftIcon={<Mail className="w-5 h-5" />}
                required
              />

              <Input
                label="Phone"
                name="phone"
                type="tel"
                placeholder="+1234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                leftIcon={<Phone className="w-5 h-5" />}
                required
              />

              <Select
                label="Role"
                name="role"
                options={[
                  { value: 'patient', label: 'Patient' },
                  { value: 'doctor', label: 'Doctor' },
                  { value: 'pharmacy', label: 'Pharmacy' },
                  { value: 'lab', label: 'Laboratory' }
                ]}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                required
              />

              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/70 hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                leftIcon={<Lock className="w-5 h-5" />}
                required
              />

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  name="terms"
                  className="mt-1 w-4 h-4 text-primary-600 border-white/30 rounded focus:ring-primary-500 bg-white/20"
                  required
                  aria-required="true"
                />
                <label htmlFor="terms-checkbox" className="ml-2 text-sm text-white/90">
                  I agree to the{' '}
                  <Link href="/terms" className="text-white hover:text-white/80 underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-white hover:text-white/80 underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                isLoading={loading}
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-white/90">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-white hover:text-white/80 font-medium underline">
                  Sign in
                </Link>
              </p>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

