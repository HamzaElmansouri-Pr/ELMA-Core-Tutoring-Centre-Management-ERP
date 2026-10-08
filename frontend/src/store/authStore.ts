import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '../lib/axios';
import { setAuthToken } from '../lib/authToken';
import i18n from '../lib/i18n';

interface User {
    id: number;
    name: string;
    email: string;
    preferred_locale: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setUser: (user: User | null, token?: string | null) => void;
    initAuth: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            setUser: (user, token) => {
                const newToken = token !== undefined ? token : get().token;
                setAuthToken(newToken);          // ← sync in-memory
                set({ 
                    user, 
                    token: newToken,
                    isAuthenticated: !!user, 
                    isLoading: false 
                });
            },
            initAuth: async () => {
                if (!get().isAuthenticated) {
                    set({ isLoading: true });
                }
                
                const storedToken = get().token;
                if (!storedToken) {
                    setAuthToken(null);
                    set({ user: null, isAuthenticated: false, isLoading: false });
                    return;
                }

                // Ensure in-memory token is set for axios interceptor
                setAuthToken(storedToken);

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
                    setAuthToken(null);
                    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                }
            },
            logout: async () => {
                try {
                    await axiosInstance.post('/api/logout');
                } catch (error) {
                    console.error('Logout failed', error);
                } finally {
                    setAuthToken(null);
                    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                }
            }
        }),
        {
            name: 'elma-auth-storage',
            partialize: (state) => ({ 
                user: state.user, 
                token: state.token,
                isAuthenticated: state.isAuthenticated 
            }),
        }
    )
);
