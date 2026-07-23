import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import LanguageSelectScreen from './pages/LanguageSelectScreen';

import { TeachersListPage } from './pages/TeachersListPage';
import { StudentsListPage } from './pages/StudentsListPage';
import { StudentDetailPage } from './pages/StudentDetailPage';

import { SubjectsListPage } from './pages/SubjectsListPage';
import { ClassesListPage } from './pages/ClassesListPage';

import { BillingCenterPage } from './pages/BillingCenterPage';
import { InvoicesListPage } from './pages/InvoicesListPage';
import { InvoiceDetailPage } from './pages/InvoiceDetailPage';
import { PayrollPage } from './pages/PayrollPage';
import { TimetablePage } from './pages/TimetablePage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardPage } from './pages/DashboardPage';

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
                    { index: true, element: <DashboardPage /> },
                    { path: 'dashboard', element: <DashboardPage /> },
                    { path: 'teachers', element: <TeachersListPage /> },
                    { path: 'subjects', element: <SubjectsListPage /> },
                    { path: 'students', element: <StudentsListPage /> },
                    { path: 'students/:id', element: <StudentDetailPage /> },
                    { path: 'classes', element: <ClassesListPage /> },
                    { path: 'timetable', element: <TimetablePage /> },
                    { path: 'finance', element: <BillingCenterPage /> },
                    { path: 'invoices', element: <InvoicesListPage /> },
                    { path: 'invoices/:id', element: <InvoiceDetailPage /> },
                    { path: 'payroll', element: <PayrollPage /> },
                    { path: 'settings', element: <SettingsPage /> },
                ]
            }
        ]
    }
]);
