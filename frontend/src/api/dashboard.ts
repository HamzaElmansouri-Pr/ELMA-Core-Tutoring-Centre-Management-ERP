import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

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
  const response = await api.get('/dashboard/kpis');
  return response.data.data;
};

export const getUnpaidAlerts = async (): Promise<UnpaidAlert[]> => {
  const response = await api.get('/dashboard/unpaid-alerts');
  return response.data.data;
};

export const getProfitBreakdown = async (): Promise<any[]> => {
  const response = await api.get('/dashboard/profit-breakdown');
  return response.data.data;
};
