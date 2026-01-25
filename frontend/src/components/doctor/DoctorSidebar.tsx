'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  FlaskConical,
  Settings,
  User,
  LogOut,
  Stethoscope,
  CreditCard
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Logo from '@/components/common/Logo';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
  { name: 'Appointments', href: '/doctor/appointments', icon: Calendar },
  { name: 'Patients', href: '/doctor/patients', icon: Users },
  { name: 'Prescriptions', href: '/doctor/prescriptions', icon: FileText },
  { name: 'Lab Tests', href: '/doctor/lab-tests', icon: FlaskConical },
  { name: 'Finance', href: '/doctor/finance', icon: CreditCard },
  { name: 'Profile', href: '/doctor/profile', icon: User },
  { name: 'Settings', href: '/doctor/settings', icon: Settings },
];

export default function DoctorSidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await api.get('/api/doctors/profile');
        const doctor = response.data.data?.doctor;
        if (doctor?.profileImage) {
          setProfileImage(doctor.profileImage);
        }
      } catch (error) {
        // Silently fail - will show initial instead
        console.debug('Could not fetch doctor profile image');
      }
    };

    if (user) {
      fetchProfileImage();
    }
  }, [user]);

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const isActive = (href: string) => {
    if (href === '/doctor/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const getDoctorName = () => {
    if (user?.profile) {
      const firstName = user.profile.firstName?.trim() || '';
      const lastName = user.profile.lastName?.trim() || '';
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Doctor';
  };

  const getProfileImageUrl = () => {
    if (!profileImage) return null;
    if (profileImage.startsWith('http')) {
      return profileImage;
    }
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}${profileImage}`;
  };

  return (
    <div className="h-screen w-64 bg-white border-r border-secondary-200 flex flex-col">
      {/* Logo/Brand Section */}
      <div className="p-6 border-b border-secondary-200 flex items-center justify-center">
        <Logo size="sidebar" />
      </div>

      {/* User Info Section */}
      <div className="p-4 border-b border-secondary-200 bg-secondary-50">
        <div className="flex items-center gap-3">
          {getProfileImageUrl() ? (
            <img
              src={getProfileImageUrl()!}
              alt="Doctor Profile"
              className="w-10 h-10 rounded-full object-cover border-2 border-primary-200"
              onError={(e) => {
                // Fallback to initial if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = 'w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold';
                  fallback.textContent = getDoctorName().charAt(0).toUpperCase();
                  parent.appendChild(fallback);
                }
              }}
            />
          ) : (
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
              {getDoctorName().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-secondary-900 truncate">
              Dr. {getDoctorName()}
            </p>
            <p className="text-xs text-secondary-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                    : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-secondary-500'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-secondary-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-secondary-700 hover:bg-error-50 hover:text-error-600 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
