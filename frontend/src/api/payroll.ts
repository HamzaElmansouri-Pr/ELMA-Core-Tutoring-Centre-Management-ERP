import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export interface PayrollBreakdownItem {
  allocation_id: number;
  date: string;
  type: 'payment' | 'refund';
  student_name: string;
  class_name: string;
  subject_name: string;
  amount_centimes: number;
}

export interface PayrollRecord {
  id: number;
  teacher_id: number;
  month: number;
  year: number;
  gross_collected_centimes: number;
  commission_percentage: number;
  payout_amount_centimes: number;
  status: 'calculated' | 'paid';
  breakdown: PayrollBreakdownItem[];
  created_at: string;
}

export interface TeacherPayrollSummary {
  teacher_id: number;
  teacher_name: string;
  commission_percentage: number;
  gross_collected_centimes: number;
  payout_amount_centimes: number;
  status: 'not_calculated' | 'calculated' | 'paid';
  record: PayrollRecord | null;
}

export const getPayrollSummaries = async (month: number, year: number): Promise<TeacherPayrollSummary[]> => {
  const response = await api.get('/payroll', { params: { month, year } });
  return response.data.data;
};

export const calculatePayroll = async (teacher_id: number, month: number, year: number): Promise<PayrollRecord> => {
  const response = await api.post('/payroll/calculate', { teacher_id, month, year });
  return response.data.data;
};

export const markPayrollPaid = async (record_id: number): Promise<PayrollRecord> => {
  const response = await api.post(`/payroll/${record_id}/mark-paid`);
  return response.data.data;
};
