'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export default function AuthGuard({ children, requireAuth = false, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (requireAuth) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [requireAuth, isAuthenticated, user, allowedRoles, router]);

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireAuth && allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

