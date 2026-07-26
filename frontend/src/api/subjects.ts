import api from '@/lib/axios';

export interface Subject {
  id: number;
  name: string;
  description: string | null;
}

export const getSubjects = async (): Promise<Subject[]> => {
  const response = await api.get('/api/subjects');
  return response.data.data;
};

export const getSubjectsPaginated = async (params?: { search?: string; page?: number; per_page?: number }): Promise<{ data: Subject[]; meta: any }> => {
  const response = await api.get('/api/subjects', { params });
  return response.data;
};

export const getSubjectsAll = async (): Promise<Subject[]> => {
  const response = await api.get('/api/subjects/all');
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
