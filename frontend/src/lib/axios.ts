import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    },
});

// Setup function to request CSRF cookie before authentication/mutations
export const fetchCsrfCookie = async () => {
    await axiosInstance.get('/sanctum/csrf-cookie');
};

export default axiosInstance;
