import api from '@/lib/axios';

export interface Teacher {
  id: number;
  name: string;
  email: string | null;
  phone?: string | null;
  whatsapp_phone?: string | null;
  commission_percentage: number;
  is_active: boolean;
}

export const getTeachers = async (): Promise<Teacher[]> => {
  const response = await api.get('/api/teachers');
  return response.data.data;
};

export const createTeacher = async (data: Omit<Teacher, 'id'>): Promise<Teacher> => {
  const response = await api.post('/api/teachers', data);
  return response.data.data;
};

export const updateTeacher = async (id: number, data: Partial<Teacher>): Promise<Teacher> => {
  const response = await api.put(`/api/teachers/${id}`, data);
  return response.data.data;
};

export const deleteTeacher = async (id: number): Promise<void> => {
  await api.delete(`/api/teachers/${id}`);
};
