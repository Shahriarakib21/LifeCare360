import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

/**
 * Create axios instance with default configuration
 */
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Reduced from 30s to 10s for faster failure detection
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token to requests
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (most reliable)
    // The Zustand store might not be rehydrated yet during initial requests
    let token: string | null = null;

    if (typeof window !== 'undefined') {
      // Always check localStorage first as it's the source of truth
      token = localStorage.getItem('token');

      // If not in localStorage, try Zustand store (for cases where it's set but not persisted yet)
      if (!token) {
        try {
          // Dynamic import to avoid circular dependencies
          const { useAuthStore } = require('@/store/authStore');
          const storeState = useAuthStore.getState();
          token = storeState.token || null;

          // If we found token in store but not in localStorage, sync it
          if (token && !localStorage.getItem('token')) {
            localStorage.setItem('token', token);
          }
        } catch (e) {
          // Store not available, token remains null
        }
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers) {
      // Log when token is missing for debugging, but skip for public routes
      const isPublicRoute = config.url?.startsWith('/api/auth/') || config.url?.startsWith('/api/public/');
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && !isPublicRoute) {
        console.warn('API request without token:', config.url);
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors globally
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      // Only clear if we're not already on the login/register page
      // Skip auto-logout for delete account endpoint (we want to show password error)
      // Skip auto-logout if we're on the lab dashboard (might be auth check in progress)
      const requestUrl = error.config?.url || '';
      const isDeleteAccount = requestUrl.includes('/api/patients/account') && error.config?.method === 'delete';
      const isLabDashboard = typeof window !== 'undefined' && window.location.pathname.startsWith('/lab/dashboard');

      if (typeof window !== 'undefined' && !isDeleteAccount && !isLabDashboard) {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/auth/')) {
          // Use auth store to clear auth state
          import('@/store/authStore').then(({ useAuthStore }) => {
            useAuthStore.getState().clearAuth();
            window.location.href = '/auth/login';
          });
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * API Error handler
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as any)?.message || error.message;
    return message || 'An unexpected error occurred';
  }
  return 'An unexpected error occurred';
}
