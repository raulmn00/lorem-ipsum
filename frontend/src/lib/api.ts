import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

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

// Upload API
export const uploadApi = {
  uploadPhoto: (albumId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/upload/photo/${albumId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadPhotos: (albumId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post(`/upload/photos/${albumId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getPresignedUrl: (key: string) =>
    api.get(`/upload/presigned/${encodeURIComponent(key)}`),
};
