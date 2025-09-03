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

// Retinopathy Detection API - Configure the IP address as needed
const RETINOPATHY_API_BASE = process.env.NEXT_PUBLIC_RETINOPATHY_API_URL || 'http://192.168.1.100:8000';

export const analyzeRetinopathy = async (imageFile: File) => {
  const formData = new FormData();
  formData.append('file', imageFile);
  
  const response = await fetch(`${RETINOPATHY_API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Retinopathy analysis failed: ${response.statusText}`);
  }
  
  return response.json();
};

export const checkRetinopathyApiHealth = async () => {
  try {
    const response = await fetch(`${RETINOPATHY_API_BASE}/health`);
    if (!response.ok) {
      throw new Error('API health check failed');
    }
    return response.json();
  } catch (error) {
    throw new Error(`API not available: ${error}`);
  }
};

export const getRetinopathyModelInfo = async () => {
  const response = await fetch(`${RETINOPATHY_API_BASE}/model-info`);
  if (!response.ok) {
    throw new Error('Failed to get model info');
  }
  return response.json();
};
