import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axiosInstance, { fetchCsrfCookie } from '../lib/axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setError('');
    try {
      await fetchCsrfCookie();
      const response = await axiosInstance.post('/api/login', data);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError(err.response.data.message || 'Invalid credentials');
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">{t('login')}</h2>
        
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('email')}</label>
            <input
              type="email"
              {...register('email')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('password')}</label>
            <input
              type="password"
              {...register('password')}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-700 dark:border-gray-600"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? '...' : t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
