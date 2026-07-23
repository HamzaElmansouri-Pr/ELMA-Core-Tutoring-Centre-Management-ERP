import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export interface InvoiceItem {
  id: number;
  school_class_id: number;
  amount_centimes: number;
  paid_amount_centimes: number;
  school_class?: any;
}

export interface Payment {
  id: number;
  amount_centimes: number;
  type: 'payment' | 'refund';
  payment_method: string | null;
  reason: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  student_id: number;
  month: number;
  year: number;
  total_amount_centimes: number;
  paid_amount_centimes: number;
  status: 'unpaid' | 'partial' | 'paid';
  balance_due_centimes: number;
  created_at: string;
  student?: any;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export const generateInvoices = async (month: number, year: number): Promise<{ message: string; generated: number }> => {
  const response = await api.post('/invoices/generate', { month, year });
  return response.data;
};

export const getInvoices = async (params?: { status?: string; month?: number; year?: number; page?: number }): Promise<{ data: Invoice[]; meta: any }> => {
  const response = await api.get('/invoices', { params });
  return response.data;
};

export const getInvoiceDetails = async (id: number): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data.data;
};

export const recordPayment = async (invoiceId: number, amount_centimes: number, type: 'payment' | 'refund', payment_method?: string, reason?: string): Promise<Payment> => {
  const response = await api.post(`/invoices/${invoiceId}/payments`, {
    amount_centimes,
    type,
    payment_method,
    reason,
  });
  return response.data.data;
};
