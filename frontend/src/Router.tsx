import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import LanguageSelectScreen from './pages/LanguageSelectScreen';

import { TeachersListPage } from './pages/TeachersListPage';
import { StudentsListPage } from './pages/StudentsListPage';
import { StudentDetailPage } from './pages/StudentDetailPage';

// Placeholder components for dashboard
const Dashboard = () => <div>Dashboard Content</div>;
const Classes = () => <div>Classes Management</div>;
const Finance = () => <div>Finance</div>;
const Settings = () => <div>Settings</div>;

const LanguageGatekeeper = ({ children }: { children: React.ReactNode }) => {
    const isLangSet = localStorage.getItem('i18nextLng_set');
    if (!isLangSet) {
        return <Navigate to="/select-language" replace />;
    }
    return <>{children}</>;
};

export const router = createBrowserRouter([
    {
        path: '/select-language',
        element: <LanguageSelectScreen />,
    },
    {
        path: '/login',
        element: (
            <LanguageGatekeeper>
                <LoginPage />
            </LanguageGatekeeper>
        ),
    },
    {
        path: '/',
        element: (
            <LanguageGatekeeper>
                <ProtectedRoute />
            </LanguageGatekeeper>
        ),
        children: [
            {
                path: '/',
                element: <AppLayout />,
                children: [
                    { index: true, element: <Navigate to="/dashboard" replace /> },
                    { path: 'dashboard', element: <Dashboard /> },
                    { path: 'teachers', element: <TeachersListPage /> },
                    { path: 'students', element: <StudentsListPage /> },
                    { path: 'students/:id', element: <StudentDetailPage /> },
                    { path: 'classes', element: <Classes /> },
                    { path: 'finance', element: <Finance /> },
                    { path: 'settings', element: <Settings /> },
                ]
            }
        ]
    }
]);
