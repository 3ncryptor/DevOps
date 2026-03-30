import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Basic User type representing our unified User/Seller response
export interface AuthUser {
    _id: string;
    email: string;
    role: 'USER' | 'SELLER' | 'SUPER_ADMIN';
    accountStatus: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    emailVerified: boolean;
}

interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    
    // Actions
    setAuth: (token: string, user: AuthUser) => void;
    logout: () => void;
    updateUser: (user: Partial<AuthUser>) => void;
}

/**
 * Global authentication store
 * Persists the user and access token automatically to localStorage so reloads are smooth
 */
export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            isAuthenticated: false,

            setAuth: (token, user) => 
                set({ user, accessToken: token, isAuthenticated: true }),

            logout: () => 
                set({ user: null, accessToken: null, isAuthenticated: false }),

            updateUser: (updates) => 
                set((state) => ({ 
                    user: state.user ? { ...state.user, ...updates } : null 
                })),
        }),
        {
            name: 'zentra-auth', // key used in localStorage
        }
    )
);
