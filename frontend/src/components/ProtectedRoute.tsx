import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading, initAuth } = useAuthStore();

    useEffect(() => {
        initAuth();
    }, [initAuth]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
