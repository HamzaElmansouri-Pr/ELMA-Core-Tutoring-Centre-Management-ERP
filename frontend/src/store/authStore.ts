import { create } from 'zustand';
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

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
    initAuth: async () => {
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
            set({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Logout failed', error);
        }
    }
}));
