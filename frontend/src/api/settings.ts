import api from '@/lib/axios';

export interface GlobalSettings {
  center_name: string;
  address: string | null;
  phone: string | null;
  default_locale: string;
  logo_url: string | null;
}

export const getSettings = async (): Promise<GlobalSettings> => {
  const response = await api.get('/api/settings');
  return response.data.data;
};

export const updateSettings = async (data: FormData): Promise<GlobalSettings> => {
  const response = await api.post('/api/settings', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
};
