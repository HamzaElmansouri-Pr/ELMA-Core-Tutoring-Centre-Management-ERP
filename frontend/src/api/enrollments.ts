import axios from 'axios';
import type { SchoolClass } from './classes';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export interface Enrollment {
  id: number;
  student_id: number;
  school_class_id: number;
  status: 'active' | 'ended';
  start_date: string;
  end_date: string | null;
  school_class?: SchoolClass;
}

export const enrollStudent = async (studentId: number, classId: number, startDate?: string): Promise<Enrollment> => {
  const response = await api.post('/enrollments', {
    student_id: studentId,
    school_class_id: classId,
    start_date: startDate,
  });
  return response.data.data;
};

export const endEnrollment = async (enrollmentId: number, endDate?: string): Promise<Enrollment> => {
  const response = await api.post(`/enrollments/${enrollmentId}/end`, {
    end_date: endDate,
  });
  return response.data.data;
};

export const deleteEnrollment = async (enrollmentId: number): Promise<void> => {
  await api.delete(`/enrollments/${enrollmentId}`);
};
