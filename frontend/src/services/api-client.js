import axios from 'axios';

const defaultApiUrl = 'http://127.0.0.1:8000/api';
const useDefaultLocal = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].includes(window.location.origin);

const baseURL = import.meta.env.VITE_API_URL || (useDefaultLocal ? defaultApiUrl : `${window.location.origin}/api`);

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      const redirectPath = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      window.location.href = `/login?redirect=${redirectPath}`;
    }
    return Promise.reject(error);
  }
);

export default apiClient;
