import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  initialize: () => void;
}

const computeIsAuthenticated = (user: User | null, token: string | null): boolean => !!(user && token);

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitialized: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        set({ user, token, isAuthenticated: computeIsAuthenticated(user, token), isInitialized: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        set({ user: null, token: null, isAuthenticated: false, isInitialized: true });
      },
      updateUser: (updates) => set((state) => {
        if (!state.user) return state;
        const updatedUser = {
          ...state.user,
          ...updates,
          profile: updates.profile ? { ...state.user.profile, ...updates.profile } : state.user.profile,
        };
        if (typeof window !== 'undefined') localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser, isAuthenticated: computeIsAuthenticated(updatedUser, state.token) };
      }),
      initialize: () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: computeIsAuthenticated(user, token), isInitialized: true });
          } catch {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({ isInitialized: true });
          }
        } else {
          set({ isInitialized: true });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
