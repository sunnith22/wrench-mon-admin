import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.hostname}:8143/api/admin` 
    : 'http://localhost:8143/api/admin');

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000
});

// Attach Admin Bearer Token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tnga_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('tnga_admin_token');
        localStorage.removeItem('tnga_admin_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
