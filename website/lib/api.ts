import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
});

export const analyzeImage = async (
  type: 'skin' | 'face' | 'foot' | 'pose',
  imageData: string
) => {
  const formData = new FormData();
  formData.append('image', imageData);
  const response = await api.post(`/api/analyze/${type}`, formData);
  return response.data;
};

export const saveScreeningResults = async (results: any) => {
  const response = await api.post('/api/reports', results);
  return response.data;
};

export const getReports = async (userId: string) => {
  const response = await api.get(`/api/reports?userId=${userId}`);
  return response.data;
};

export const getReport = async (reportId: string) => {
  const response = await api.get(`/api/reports/${reportId}`);
  return response.data;
};
