import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  signup: (data) => api.post('/api/auth/signup', data),
  getMe: () => api.get('/api/auth/me'),
  logout: () => api.post('/api/auth/logout'),
  changePassword: (currentPassword, newPassword) => api.put('/api/auth/change-password', { currentPassword, newPassword })
};

// Dashboard APIs
export const dashboardAPI = {
  getKPIs: (params) => api.get('/api/dashboard/kpis', { params }),
  getSummary: () => api.get('/api/dashboard/summary'),
  getTrends: (params) => api.get('/api/dashboard/trends', { params })
};

// Workflow APIs
export const workflowAPI = {
  getWorkflows: (params) => api.get('/api/workflows', { params }),
  getWorkflow: (id) => api.get(`/api/workflows/${id}`),
  createWorkflow: (data) => api.post('/api/workflows', data),
  updateWorkflow: (id, data) => api.put(`/api/workflows/${id}`, data),
  deleteWorkflow: (id) => api.delete(`/api/workflows/${id}`),
  getSLAStats: () => api.get('/api/workflows/stats/sla')
};

// Task APIs
export const taskAPI = {
  getTasks: (params) => api.get('/api/tasks', { params }),
  getTask: (id) => api.get(`/api/tasks/${id}`),
  createTask: (data) => api.post('/api/tasks', data),
  updateTask: (id, data) => api.put(`/api/tasks/${id}`, data),
  approveTask: (id, decision, notes) => api.post(`/api/tasks/${id}/approve`, { decision, notes }),
  escalateTask: (id, escalateTo, reason) => api.post(`/api/tasks/${id}/escalate`, { escalateTo, reason }),
  deleteTask: (id) => api.delete(`/api/tasks/${id}`)
};

// AI APIs
export const aiAPI = {
  generateForecast: (data) => api.post('/api/ai/forecast', data),
  detectAnomalies: (data) => api.post('/api/ai/detect-anomalies', data),
  generateRecommendations: (data) => api.post('/api/ai/generate-recommendations', data),
  getAIRuns: (params) => api.get('/api/ai/runs', { params }),
  reviewAIRun: (id, decision, notes) => api.post(`/api/ai/runs/${id}/review`, { decision, notes })
};

// Forecast APIs
export const forecastAPI = {
  getForecasts: (params) => api.get('/api/forecasts', { params }),
  getForecast: (id) => api.get(`/api/forecasts/${id}`),
  getCapacityHeatmap: (params) => api.get('/api/capacity/heatmap', { params }),
  getAnomalies: (params) => api.get('/api/anomalies', { params }),
  getAnomaly: (id) => api.get(`/api/anomalies/${id}`),
  updateAnomalyStatus: (id, status, notes) => api.put(`/api/anomalies/${id}/status`, { status, notes })
};

// User APIs
export const userAPI = {
  getUsers: (params) => api.get('/api/users', { params }),
  getUser: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/users/${id}`)
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  markAsRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.put('/api/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/api/notifications/${id}`),
  createNotification: (data) => api.post('/api/notifications', data)
};

// Audit APIs
export const auditAPI = {
  getAuditLogs: (params) => api.get('/api/audit/logs', { params }),
  getAuditLog: (id) => api.get(`/api/audit/logs/${id}`),
  getAuditStats: (params) => api.get('/api/audit/logs/stats', { params }),
  getSettings: (params) => api.get('/api/audit/settings', { params }),
  updateSetting: (id, value) => api.put(`/api/audit/settings/${id}`, { value }),
  createSetting: (data) => api.post('/api/audit/settings', data)
};

// Report APIs
export const reportAPI = {
  getOperationsReport: (params) => api.get('/api/reports/operations', { params }),
  getForecastsReport: (params) => api.get('/api/reports/forecasts', { params }),
  getAnomaliesReport: (params) => api.get('/api/reports/anomalies', { params }),
  getAIPerformanceReport: (params) => api.get('/api/reports/ai-performance', { params })
};

export default api;
