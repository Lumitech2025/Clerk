import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial: Allows browser to send and receive HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-Memory Access Token Storage (Prevents XSS theft via localStorage)
let memoryAccessToken = null;

export const setAuthToken = (token) => {
  memoryAccessToken = token;
};

export const getAuthToken = () => memoryAccessToken;

// Flag and queue to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Attach In-Memory Access Token
API.interceptors.request.use(
  (config) => {
    if (memoryAccessToken) {
      config.headers.Authorization = `Bearer ${memoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Silent Refresh via Cookie
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/refresh/')) {
        setAuthToken(null);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send request to refresh endpoint; cookie is sent automatically by browser
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.access;
        setAuthToken(newAccessToken);

        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAuthToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;