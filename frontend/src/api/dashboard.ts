import api from '@/lib/axios';

export interface DashboardKPIs {
  revenue_this_month_centimes: number;
  active_students: number;
  sessions_today: number;
}

export interface UnpaidAlert {
  invoice_id: number;
  student_name: string;
  parent_phone: string;
  amount_due_centimes: number;
  month: number;
  year: number;
}

export const getDashboardKPIs = async (): Promise<DashboardKPIs> => {
  const response = await api.get('/api/dashboard/kpis');
  return response.data.data;
};

export const getUnpaidAlerts = async (): Promise<UnpaidAlert[]> => {
  const response = await api.get('/api/dashboard/unpaid-alerts');
  return response.data.data;
};

export const getProfitBreakdown = async (): Promise<any[]> => {
  const response = await api.get('/api/dashboard/profit-breakdown');
  return response.data.data;
};
