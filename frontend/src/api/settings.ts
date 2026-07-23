import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
  },
});

export interface GlobalSettings {
  center_name: string;
  address: string | null;
  phone: string | null;
  default_locale: string;
  logo_url: string | null;
}

export const getSettings = async (): Promise<GlobalSettings> => {
  const response = await api.get('/settings');
  return response.data.data;
};

export const updateSettings = async (data: FormData): Promise<GlobalSettings> => {
  const response = await api.post('/settings', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
};
