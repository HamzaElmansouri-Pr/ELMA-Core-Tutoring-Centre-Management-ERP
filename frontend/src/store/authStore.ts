import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '../lib/axios';
import i18n from '../lib/i18n';

interface User {
    id: number;
    name: string;
    email: string;
    preferred_locale: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    initAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
            initAuth: async () => {
                if (!get().isAuthenticated) {
                    set({ isLoading: true });
                }
                try {
                    const response = await axiosInstance.get('/api/me');
                    const user = response.data;
                    set({ user, isAuthenticated: true, isLoading: false });
                    
                    if (user.preferred_locale) {
                        i18n.changeLanguage(user.preferred_locale);
                        if (user.preferred_locale === 'ar') {
                            document.documentElement.dir = 'rtl';
                        } else {
                            document.documentElement.dir = 'ltr';
                        }
                    }
                } catch (error) {
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            },
            logout: async () => {
                try {
                    await axiosInstance.post('/api/logout');
                } catch (error) {
                    console.error('Logout failed', error);
                } finally {
                    set({ user: null, isAuthenticated: false, isLoading: false });
                }
            }
        }),
        {
            name: 'elma-auth-storage',
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
