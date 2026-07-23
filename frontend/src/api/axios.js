import axios from 'axios';

/**
 * Normalize API base so both of these work on Vercel:
 *   https://your-api.onrender.com
 *   https://your-api.onrender.com/api
 * Backend routes always live under /api.
 */
function resolveApiBaseUrl(raw) {
  const fallback = '/api';
  if (raw == null || String(raw).trim() === '') {
    return fallback;
  }
  let url = String(raw).trim().replace(/\/+$/, '');
  if (url === '/api' || url.endsWith('/api')) {
    return url;
  }
  // Absolute host without /api → append it
  if (/^https?:\/\//i.test(url)) {
    return `${url}/api`;
  }
  return url.startsWith('/') ? url : `/${url}`;
}

const baseURL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default api;
