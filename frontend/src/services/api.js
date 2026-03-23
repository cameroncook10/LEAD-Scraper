import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Scrape endpoints
export const startScrape = async (source, query, limit = 100) => {
  const response = await api.post('/scrape/start', { source, query, limit });
  return response.data;
};

export const getScrapeStatus = async (jobId) => {
  const response = await api.get(`/scrape/status/${jobId}`);
  return response.data;
};

export const getJobs = async (status = null, limit = 50) => {
  const response = await api.get('/scrape/jobs', { 
    params: { ...(status && { status }), limit } 
  });
  return response.data;
};

// Leads endpoints
export const getLeads = async (filters = {}) => {
  const response = await api.get('/leads', { params: filters });
  return response.data;
};

export const getLead = async (id) => {
  const response = await api.get(`/leads/${id}`);
  return response.data;
};

export const getLeadsStats = async () => {
  const response = await api.get('/leads/stats/summary');
  return response.data;
};

export const exportLeads = async (filters = {}) => {
  const response = await api.post('/leads/export', filters, {
    responseType: 'blob'
  });
  return response.data;
};

export const deleteLead = async (id) => {
  const response = await api.delete(`/leads/${id}`);
  return response.data;
};

// Jobs endpoints
export const getJobDetails = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

export default api;
