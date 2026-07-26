import api from '@/lib/axios';
import type { Invoice } from './finance';

export interface PaymentPayloadInvoice {
    invoice_id: number;
    amount_centimes: number;
    discount_centimes?: number;
    discount_reason?: string;
}

export interface ProcessPaymentPayload {
    student_id: number;
    payment_method: string;
    invoices: PaymentPayloadInvoice[];
}

export interface PaymentResponse {
    message: string;
    payments: any[];
    primary_payment_id: number | null;
}

export interface PaymentRecord {
    id: number;
    invoice_id: number;
    amount_centimes: number;
    type: string;
    payment_method: string;
    created_at: string;
    invoice?: {
        id: number;
        student_id: number;
        month: number;
        year: number;
        student?: {
            id: number;
            first_name: string;
            last_name: string;
        };
        items?: {
            id: number;
            school_class?: {
                id: number;
                name: string;
                subject?: {
                    id: number;
                    name: string;
                };
            };
        }[];
    };
}

export const getPayments = async (): Promise<{ data: PaymentRecord[] }> => {
    const response = await api.get('/api/payments');
    return response.data;
};

export const getStudentInvoices = async (studentId: number): Promise<Invoice[]> => {
    const response = await api.get(`/api/students/${studentId}/invoices`);
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
};

export const processPayments = async (payload: ProcessPaymentPayload): Promise<PaymentResponse> => {
    const response = await api.post('/api/payments', payload);
    return response.data;
};

export const downloadReceipt = async (paymentId: number): Promise<void> => {
    const response = await api.get(`/api/payments/${paymentId}/receipt`, {
        responseType: 'blob',
    });
    
    // Create a Blob from the PDF Stream
    const file = new Blob([response.data], { type: 'application/pdf' });
    const fileURL = URL.createObjectURL(file);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = fileURL;
    a.download = `receipt-${paymentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
