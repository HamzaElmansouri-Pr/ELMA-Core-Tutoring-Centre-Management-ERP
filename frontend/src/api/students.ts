import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export interface Student {
  id: number;
  name: string;
  parent_phone: string | null;
  active_enrollments_count?: number;
  unpaid_invoices_count?: number;
}

export const getStudents = async (): Promise<Student[]> => {
  const response = await api.get('/students');
  return response.data.data;
};

export const createStudent = async (data: Omit<Student, 'id' | 'active_enrollments_count' | 'unpaid_invoices_count'>): Promise<Student> => {
  const response = await api.post('/students', data);
  return response.data.data;
};

export const updateStudent = async (id: number, data: Partial<Student>): Promise<Student> => {
  const response = await api.put(`/students/${id}`, data);
  return response.data.data;
};

export const deleteStudent = async (id: number): Promise<void> => {
  await api.delete(`/students/${id}`);
};
