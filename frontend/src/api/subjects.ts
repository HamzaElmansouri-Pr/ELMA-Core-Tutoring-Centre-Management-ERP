import api from '@/lib/axios';

export interface Subject {
  id: number;
  name: string;
  description: string | null;
  default_price_centimes: number;
}

export const getSubjects = async (): Promise<Subject[]> => {
  const response = await api.get('/api/subjects');
  return response.data.data;
};

export const createSubject = async (data: Omit<Subject, 'id'>): Promise<Subject> => {
  const response = await api.post('/api/subjects', data);
  return response.data.data;
};

export const updateSubject = async (id: number, data: Partial<Subject>): Promise<Subject> => {
  const response = await api.put(`/api/subjects/${id}`, data);
  return response.data.data;
};

export const deleteSubject = async (id: number): Promise<void> => {
  await api.delete(`/api/subjects/${id}`);
};
