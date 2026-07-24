import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Axios doesn't automatically send XSRF-TOKEN for cross-origin requests (different ports)
// We need an interceptor to manually read it from document.cookie and attach it.
axiosInstance.interceptors.request.use((config) => {
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
    };
    
    const token = getCookie('XSRF-TOKEN');
    if (token) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    }
    return config;
});

// Setup function to request CSRF cookie before authentication/mutations
export const fetchCsrfCookie = async () => {
    await axiosInstance.get('/sanctum/csrf-cookie');
};

export default axiosInstance;
