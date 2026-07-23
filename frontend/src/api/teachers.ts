import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export interface Teacher {
  id: number;
  name: string;
  email: string | null;
  commission_percentage: number;
  is_active: boolean;
}

export const getTeachers = async (): Promise<Teacher[]> => {
  const response = await api.get('/teachers');
  return response.data.data;
};

export const createTeacher = async (data: Omit<Teacher, 'id'>): Promise<Teacher> => {
  const response = await api.post('/teachers', data);
  return response.data.data;
};

export const updateTeacher = async (id: number, data: Partial<Teacher>): Promise<Teacher> => {
  const response = await api.put(`/teachers/${id}`, data);
  return response.data.data;
};

export const deleteTeacher = async (id: number): Promise<void> => {
  await api.delete(`/teachers/${id}`);
};
