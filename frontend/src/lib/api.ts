import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:4004';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Direct connection to upload service for file uploads
export const uploadClient = axios.create({
  baseURL: UPLOAD_URL,
});

// Token refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Add auth interceptor to main API
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (!refreshToken) {
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.accessToken;

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', newAccessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
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

// Add auth interceptor to upload client
uploadClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor to upload client for token refresh
uploadClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (!refreshToken) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccessToken = data.accessToken;

        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', newAccessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return uploadClient(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Albums API
export const albumsApi = {
  getAll: (page = 1, limit = 10) =>
    api.get(`/albums?page=${page}&limit=${limit}`),
  getOne: (id: string) => api.get(`/albums/${id}`),
  create: (data: { title: string; description?: string }) =>
    api.post('/albums', data),
  update: (id: string, data: { title?: string; description?: string }) =>
    api.patch(`/albums/${id}`, data),
  delete: (id: string) => api.delete(`/albums/${id}`),
  share: (id: string) => api.post(`/albums/${id}/share`),
  unshare: (id: string) => api.delete(`/albums/${id}/share`),
  getShared: (token: string) => api.get(`/albums/shared/${token}`),
};

// Photos API
export const photosApi = {
  getByAlbum: (albumId: string, page = 1, limit = 20, sort = 'acquired_at', order = 'DESC') =>
    api.get(`/photos/album/${albumId}?page=${page}&limit=${limit}&sort=${sort}&order=${order}`),
  getOne: (id: string) => api.get(`/photos/${id}`),
  update: (id: string, data: { title?: string; description?: string }) =>
    api.patch(`/photos/${id}`, data),
  delete: (id: string) => api.delete(`/photos/${id}`),
};

// Upload API - connects directly to upload service
export const uploadApi = {
  uploadPhoto: (albumId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return uploadClient.post(`/upload/photo/${albumId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadPhotos: (albumId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return uploadClient.post(`/upload/photos/${albumId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPresignedUrl: (key: string) =>
    uploadClient.get(`/upload/presigned/${encodeURIComponent(key)}`),
};
