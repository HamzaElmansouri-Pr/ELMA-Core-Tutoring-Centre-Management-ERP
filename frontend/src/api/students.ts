import api from '@/lib/axios';

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  parent_phone: string;
  active_enrollments_count?: number;
  unpaid_invoices_count?: number;
  active_enrollments?: any[];
  ended_enrollments?: any[];
}

export const getStudents = async (): Promise<Student[]> => {
  const response = await api.get('/api/students');
  return response.data.data;
};

export const getStudent = async (id: number): Promise<Student> => {
  const response = await api.get(`/api/students/${id}`);
  return response.data.data;
};

export const createStudent = async (data: Omit<Student, 'id' | 'active_enrollments_count' | 'unpaid_invoices_count'>): Promise<Student> => {
  const response = await api.post('/api/students', data);
  return response.data.data;
};

export const updateStudent = async (id: number, data: Partial<Student>): Promise<Student> => {
  const response = await api.put(`/api/students/${id}`, data);
  return response.data.data;
};

export const deleteStudent = async (id: number): Promise<void> => {
  await api.delete(`/api/students/${id}`);
};
