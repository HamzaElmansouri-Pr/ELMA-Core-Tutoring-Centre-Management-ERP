import api from '@/lib/axios';
import { type Subject } from './subjects';
import { type Teacher } from './teachers';

export interface ClassSession {
  id: number;
  school_class_id: number;
  classroom_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
}

export interface SchoolClass {
  id: number;
  name: string;
  subject_id: number;
  teacher_id: number;
  price_centimes: number;
  subject?: Subject;
  teacher?: Teacher;
  sessions?: ClassSession[];
  enrollments_count?: number;
}

export const getClasses = async (): Promise<SchoolClass[]> => {
  const response = await api.get('/api/school-classes');
  return response.data.data;
};

export const getClassesPaginated = async (params?: { search?: string; page?: number; per_page?: number }): Promise<{ data: SchoolClass[]; meta: any }> => {
  const response = await api.get('/api/school-classes', { params });
  return response.data;
};

export const createClass = async (data: Omit<SchoolClass, 'id' | 'subject' | 'teacher' | 'enrollments_count'>): Promise<SchoolClass> => {
  const response = await api.post('/api/school-classes', data);
  return response.data.data;
};

export const updateClass = async (id: number, data: Partial<SchoolClass>): Promise<SchoolClass> => {
  const response = await api.put(`/api/school-classes/${id}`, data);
  return response.data.data;
};

export const deleteClass = async (id: number): Promise<void> => {
  await api.delete(`/api/school-classes/${id}`);
};
