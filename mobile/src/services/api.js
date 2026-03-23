import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your backend URL
const API_BASE_URL = __DEV__
  ? 'http://localhost:3002/api'
  : 'https://your-production-api.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Attach JWT token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // SecureStore not available (web)
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    }
    return Promise.reject(error);
  }
);

// Scrape endpoints
export const startScrape = async (source, query, limit = 100) => {
  const { data } = await api.post('/scrape/start', { source, query, limit });
  return data;
};

export const getScrapeStatus = async (jobId) => {
  const { data } = await api.get(`/scrape/status/${jobId}`);
  return data;
};

export const getJobs = async (status = null, limit = 50) => {
  const { data } = await api.get('/scrape/jobs', {
    params: { ...(status && { status }), limit },
  });
  return data;
};

// Leads endpoints
export const getLeads = async (filters = {}) => {
  const { data } = await api.get('/leads', { params: filters });
  return data;
};

export const getLead = async (id) => {
  const { data } = await api.get(`/leads/${id}`);
  return data;
};

export const getLeadsStats = async () => {
  const { data } = await api.get('/leads/stats/summary');
  return data;
};

export const exportLeads = async (filters = {}) => {
  const { data } = await api.post('/leads/export', filters, {
    responseType: 'blob',
  });
  return data;
};

export const deleteLead = async (id) => {
  const { data } = await api.delete(`/leads/${id}`);
  return data;
};

// Jobs endpoints
export const getJobDetails = async (jobId) => {
  const { data } = await api.get(`/jobs/${jobId}`);
  return data;
};

// Campaigns endpoints
export const getCampaigns = async () => {
  const { data } = await api.get('/campaigns');
  return data;
};

export const createCampaign = async (campaignData) => {
  const { data } = await api.post('/campaigns', campaignData);
  return data;
};

export const sendCampaign = async (id) => {
  const { data } = await api.post(`/campaigns/${id}/send`);
  return data;
};

export const deleteCampaign = async (id) => {
  const { data } = await api.delete(`/campaigns/${id}`);
  return data;
};

// Templates endpoints
export const getTemplates = async () => {
  const { data } = await api.get('/templates');
  return data;
};

export const createTemplate = async (templateData) => {
  const { data } = await api.post('/templates', templateData);
  return data;
};

export const deleteTemplate = async (id) => {
  const { data } = await api.delete(`/templates/${id}`);
  return data;
};

export default api;
