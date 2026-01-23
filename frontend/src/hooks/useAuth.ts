import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export const useAuth = () => {
  const router = useRouter();
  const { user, token, isAuthenticated, setAuth, clearAuth, initialize } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Initialize auth state from localStorage only once
    if (!initialized.current) {
      initialize();
      initialized.current = true;
    }
  }, [initialize]);

  const login = async (email: string, password: string, mfaCode?: string) => {
    try {
      const response = await api.post('/api/auth/login', { email, password, mfaCode });
      const { token, user } = response.data.data;
      setAuth(user, token);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const requireAuth = (redirectTo = '/auth/login') => {
    if (!isAuthenticated) {
      router.push(redirectTo);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    requireAuth,
  };
};

