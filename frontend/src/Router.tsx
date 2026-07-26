import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import LanguageSelectScreen from './pages/LanguageSelectScreen';

const TeachersListPage = React.lazy(() => import('./pages/TeachersListPage').then(m => ({ default: m.TeachersListPage })));
const StudentsListPage = React.lazy(() => import('./pages/StudentsListPage').then(m => ({ default: m.StudentsListPage })));
const StudentDetailPage = React.lazy(() => import('./pages/StudentDetailPage').then(m => ({ default: m.StudentDetailPage })));
const SubjectsListPage = React.lazy(() => import('./pages/SubjectsListPage').then(m => ({ default: m.SubjectsListPage })));
const ClassesListPage = React.lazy(() => import('./pages/ClassesListPage').then(m => ({ default: m.ClassesListPage })));
const BillingCenterPage = React.lazy(() => import('./pages/BillingCenterPage').then(m => ({ default: m.BillingCenterPage })));
const InvoicesListPage = React.lazy(() => import('./pages/InvoicesListPage').then(m => ({ default: m.InvoicesListPage })));
const InvoiceDetailPage = React.lazy(() => import('./pages/InvoiceDetailPage').then(m => ({ default: m.InvoiceDetailPage })));
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage').then(m => ({ default: m.PaymentsPage })));
const PayrollPage = React.lazy(() => import('./pages/PayrollPage').then(m => ({ default: m.PayrollPage })));
const TimetablePage = React.lazy(() => import('./pages/TimetablePage').then(m => ({ default: m.TimetablePage })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));

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
                    { path: 'payments', element: <PaymentsPage /> },
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
