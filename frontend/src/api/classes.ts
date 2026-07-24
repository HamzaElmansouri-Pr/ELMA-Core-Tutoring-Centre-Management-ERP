import api from '@/lib/axios';
import { type Subject } from './subjects';
import { type Teacher } from './teachers';

export interface ScheduleItem {
  day: string;
  start: string;
  end: string;
}

export interface SchoolClass {
  id: number;
  name: string;
  subject_id: number;
  teacher_id: number;
  schedule_info: ScheduleItem[];
  subject?: Subject;
  teacher?: Teacher;
  enrollments_count?: number;
}

export const getClasses = async (): Promise<SchoolClass[]> => {
  const response = await api.get('/api/school-classes');
  return response.data.data;
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
