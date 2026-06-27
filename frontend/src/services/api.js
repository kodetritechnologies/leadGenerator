import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Crucial for HTTP-only cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to catch unauthorized errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    loggerErrorFallback(message);
    return Promise.reject(new Error(message));
  }
);

function loggerErrorFallback(msg) {
  // Simple console output in client-side
  console.warn(`[API INTERCEPTOR ERROR]: ${msg}`);
}

export default api;
