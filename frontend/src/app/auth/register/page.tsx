'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, Eye, EyeOff, CheckCircle2, ShieldCheck, Stethoscope, Landmark, FlaskConical } from 'lucide-react';
import Logo from '@/components/common/Logo';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api, { handleApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const roles = [
  { id: 'patient', label: 'Patient', icon: User, description: 'Access medical history and book appointments' },
  { id: 'doctor', label: 'Doctor', icon: Stethoscope, description: 'Manage patients and prescriptions' },
  { id: 'pharmacy', label: 'Pharmacy', icon: Landmark, description: 'Process orders and refills' },
  { id: 'lab', label: 'Laboratory', icon: FlaskConical, description: 'Manage test requests and reports' }
];

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initialize();
      if (isAuthenticated && user) {
        router.push(`/${user.role}/dashboard`);
      }
    }
  }, [isAuthenticated, user, router, initialize]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'Required';
    if (!formData.lastName) newErrors.lastName = 'Required';
    if (!formData.email) newErrors.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.password) newErrors.password = 'Required';
    else if (formData.password.length < 8) newErrors.password = 'Min 8 chars';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mismatch';
    if (!formData.phone) newErrors.phone = 'Required';

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
      const { token, user: newUser } = response.data.data;

      useAuthStore.getState().setAuth(newUser, token);
      toast.success('Account created successfully!');
      router.push(`/${newUser.role}/dashboard`);
    } catch (error: any) {
      toast.error(handleApiError(error));
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

        <div className="relative z-10 space-y-12">
          <h2 className="text-5xl font-bold text-white leading-tight">
            Empowering <span className="text-primary-300">Healthcare</span> <br />
            Through Connectivity.
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-500/20 p-2 rounded-lg"><ShieldCheck className="text-primary-300 w-6 h-6" /></div>
              <div>
                <h4 className="text-white font-semibold">Secure Data Storage</h4>
                <p className="text-primary-100/60 text-sm">Your medical records are encrypted and compliant.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary-500/20 p-2 rounded-lg"><CheckCircle2 className="text-primary-300 w-6 h-6" /></div>
              <div>
                <h4 className="text-white font-semibold">Instant Connectivity</h4>
                <p className="text-primary-100/60 text-sm">Real-time collaboration between all health stakeholders.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-primary-300 text-sm italic">
          © 2026 LifeCare360 Ecosystem. Trusted by millions.
        </div>
      </div>

      {/* Form Section */}
      <div className="flex flex-col items-center justify-center p-6 bg-white sm:p-12 lg:bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8 animate-fade-in py-8">
          <div className="text-center space-y-2">
            <div className="mb-6 flex justify-center transform hover:scale-110 transition-transform duration-300">
              <Logo size="auth" variant="horizontal" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900">Create your account</h1>
            <p className="text-slate-500">Join the universal health ecosystem today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Role Selection */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">I am a...</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isSelected = formData.role === role.id;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role.id })}
                      className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 gap-2 ${isSelected
                        ? 'border-primary-600 bg-primary-50 shadow-md ring-1 ring-primary-600'
                        : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-primary-900' : 'text-slate-600'}`}>{role.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="First Name"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                error={errors.firstName}
                leftIcon={<User className="w-5 h-5" />}
                className="rounded-2xl border-slate-200 focus:border-primary-500 transition-all duration-200"
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                error={errors.lastName}
                className="rounded-2xl border-slate-200 focus:border-primary-500 transition-all duration-200"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                leftIcon={<Mail className="w-5 h-5" />}
                className="rounded-2xl border-slate-200 focus:border-primary-500 transition-all duration-200"
                required
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                placeholder="+123..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={errors.phone}
                leftIcon={<Phone className="w-5 h-5" />}
                className="rounded-2xl border-slate-200 focus:border-primary-500 transition-all duration-200"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                leftIcon={<Lock className="w-5 h-5" />}
                className="rounded-2xl border-slate-200 focus:border-primary-500 transition-all duration-200"
                required
              />
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
                leftIcon={<ShieldCheck className="w-5 h-5" />}
                rightIcon={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-primary-500 focus:outline-none">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                }
                className="rounded-2xl border-slate-200 focus:border-primary-500 transition-all duration-200"
                required
              />
            </div>

            <div className="flex items-start bg-slate-100/50 p-4 rounded-2xl border border-slate-200/50">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 w-5 h-5 appearance-none border-2 border-slate-200 rounded checked:bg-primary-600 checked:border-primary-600 transition-all cursor-pointer"
                required
              />
              <label htmlFor="terms" className="ml-3 text-sm text-slate-500 leading-relaxed">
                I agree to the <Link href="/terms" className="text-primary-600 font-semibold hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary-600 font-semibold hover:underline">Privacy Policy</Link>. I understand my data will be handled securely.
              </label>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
              className="rounded-2xl py-4 bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all transform duration-200 font-bold"
            >
              Initialize My Account
            </Button>
          </form>

          <p className="text-center text-slate-600">
            Already a member?{' '}
            <Link href="/auth/login" className="text-primary-600 font-bold hover:text-primary-700 decoration-2 underline-offset-4 transition-all duration-200">
              Sign in to LifeCare360
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

