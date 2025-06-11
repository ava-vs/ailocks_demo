import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  loadToken: () => void;
  clearError: () => void;
  refreshAccessToken: () => Promise<void>;
}

interface AuthStore extends AuthState, AuthActions {}

const getApiBaseUrl = (): string => {
  // Check if we have VITE_API_URL environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Use the same protocol as the current page to avoid mixed content issues
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // For development, use the same protocol as the frontend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:3001/api`;
  }
  
  // Fallback to HTTP for localhost
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
          
          const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
            // Add credentials for CORS if needed
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Login error:', error);
          let errorMessage = 'Login failed';
          
          if (error instanceof Error) {
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
              // Check if it's a mixed content issue
              if (window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
                errorMessage = 'Mixed content error: Please access the application using HTTP (http://localhost:5173) instead of HTTPS to connect to the backend server.';
              } else {
                errorMessage = 'Unable to connect to the backend server. Please ensure the backend is running on http://localhost:3001 and try again.';
              }
            } else {
              errorMessage = error.message;
            }
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('Attempting registration to:', `${API_BASE_URL}/auth/register`);
          
          const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
            // Add credentials for CORS if needed
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Registration error:', error);
          let errorMessage = 'Registration failed';
          
          if (error instanceof Error) {
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
              // Check if it's a mixed content issue
              if (window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
                errorMessage = 'Mixed content error: Please access the application using HTTP (http://localhost:5173) instead of HTTPS to connect to the backend server.';
              } else {
                errorMessage = 'Unable to connect to the backend server. Please ensure the backend is running on http://localhost:3001 and try again.';
              }
            } else {
              errorMessage = error.message;
            }
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      loadToken: () => {
        const state = get();
        if (state.accessToken && state.user) {
          set({ isAuthenticated: true });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();
          
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
        } catch (error) {
          // If refresh fails, logout the user
          get().logout();
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);