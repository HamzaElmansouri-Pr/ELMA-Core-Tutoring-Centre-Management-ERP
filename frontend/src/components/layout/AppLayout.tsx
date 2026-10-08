import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import LanguageSwitcher from '../LanguageSwitcher';

import { ModeToggle } from '../ModeToggle';

const PageSkeleton = () => (
  <div className="space-y-6 animate-pulse p-2">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48"></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    </div>
    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
  </div>
);

const AppLayout: React.FC = () => {
  const { t } = useTranslation('common');
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
        <div className="p-4 font-bold text-xl border-b border-gray-200 dark:border-gray-700">
          ELMA Core
        </div>
        <nav className="flex-1 p-4 space-y-1" aria-label="Primary navigation">
          {[
            ['/dashboard', t('dashboard')],
            ['/students', t('sidebar_students', 'Students')],
            ['/teachers', t('sidebar_teachers', 'Teachers')],
            ['/subjects', t('sidebar_subjects', 'Subjects')],
            ['/classes', t('sidebar_classes', 'Classes')],
            ['/timetable', t('sidebar_timetable', 'Timetable')],
            ['/finance', t('sidebar_finance', 'Finance')],
            ['/invoices', t('sidebar_invoices', 'Invoices')],
            ['/payments', t('sidebar_payments', 'Payments')],
            ['/payroll', t('sidebar_payroll', 'Payroll')],
            ['/settings', t('sidebar_settings', 'Settings')],
          ].map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `block rounded px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
             {/* Mobile menu button could go here */}
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <LanguageSwitcher />
            
            <div className="text-sm font-medium">
              {user?.name}
            </div>
            
            <button 
              onClick={logout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              {t('logout', 'Logout')}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <React.Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
