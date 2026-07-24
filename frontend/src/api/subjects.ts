import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export interface Subject {
  id: number;
  name: string;
  description: string | null;
  default_price_centimes: number;
}

export const getSubjects = async (): Promise<Subject[]> => {
  const response = await api.get('/subjects');
  return response.data.data;
};

export const createSubject = async (data: Omit<Subject, 'id'>): Promise<Subject> => {
  const response = await api.post('/subjects', data);
  return response.data.data;
};

export const updateSubject = async (id: number, data: Partial<Subject>): Promise<Subject> => {
  const response = await api.put(`/subjects/${id}`, data);
  return response.data.data;
};

export const deleteSubject = async (id: number): Promise<void> => {
  await api.delete(`/subjects/${id}`);
};
