'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Component to initialize auth state from localStorage on app mount
 * This ensures auth state persists across page navigations
 * Note: Zustand persist middleware handles initialization automatically,
 * so this is mainly for ensuring synchronous initialization
 */
export default function AuthInitializer() {
  const initialized = useRef(false);

  useEffect(() => {
    // Zustand persist middleware already handles initialization.
    // Only initialize if not already done by persist middleware.
    if (!initialized.current && typeof window !== 'undefined') {
      const state = useAuthStore.getState();
      if (!state.user && !state.token) {
        const { initialize } = useAuthStore.getState();
        initialize();
      }
      initialized.current = true;
    }
  }, []); // Empty dependency array - only run once on mount

  return null; // This component doesn't render anything
}
