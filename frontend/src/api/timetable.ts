import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export interface TimetableBlock {
  class_id: number;
  class_name: string;
  subject_name: string;
  teacher_name: string;
  day: string; // 'monday', 'tuesday', etc.
  start: string; // '14:00'
  end: string; // '16:00'
}

export interface AttendanceRecordDTO {
  enrollment_id: number;
  student_name: string;
  status: 'present' | 'absent' | 'late' | null;
}

export const getTimetable = async (): Promise<TimetableBlock[]> => {
  const response = await api.get('/timetable');
  return response.data.data;
};

export const getAttendance = async (class_id: number, session_date: string): Promise<AttendanceRecordDTO[]> => {
  const response = await api.get(`/attendance/${class_id}/${session_date}`);
  return response.data.data;
};

export const saveAttendance = async (payload: { class_id: number; session_date: string; records: { enrollment_id: number; status: string }[] }) => {
  const response = await api.post('/attendance', payload);
  return response.data;
};
