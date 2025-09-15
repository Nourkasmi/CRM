import axios from 'axios';
import { AuthResponse, User, Project, Phase, Task, ProjectFile, FileType } from '../types';

const API_BASE_URL = 'http://localhost:5000/api'; // Flask backend

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ must match Flask CORS supports_credentials=True
});

// ------------------
// Interceptors
// ------------------

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration / unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ------------------
// Auth endpoints
// ------------------
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: { email: string; name: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, new_password: password }),

  logout: () => api.post('/auth/logout'),
};

// ------------------
// User endpoints
// ------------------
export const userAPI = {
  getAll: () => api.get<User[]>('/users/'),
  getProfile: () => api.get<User>('/users/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/users/me/reset-password', {
      old_password: oldPassword,
      new_password: newPassword,
    }),

  // ✅ Fixed: correct backend route + method
  validateUser: (userId: string) => api.put(`/users/${userId}/validate`),

  assignRole: (userId: string, role: string) =>
    api.put(`/users/${userId}/role`, { role }),

  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
};

// ------------------
// Project endpoints
// ------------------
export const projectAPI = {
  getAll: () => api.get<Project[]>('/projects/'),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) => api.post<Project>('/projects/', data),
  update: (id: string, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  archive: (id: string) => api.post(`/projects/${id}/archive`),
};

// ------------------
// Phase endpoints
// ------------------
export const phaseAPI = {
  getByProject: (projectId: string) => api.get<Phase[]>(`/phases/${projectId}`),
  create: (data: Partial<Phase> & { project_id: string }) =>
    api.post<Phase>(`/phases/${data.project_id}`, data),
  update: (id: string, data: Partial<Phase>) =>
    api.put<Phase>(`/phases/update/${id}`, data),
  delete: (id: string) => api.delete(`/phases/${id}`),
};

// ------------------
// Task endpoints
// ------------------
export const taskAPI = {
  getByProject: (projectId: string) => api.get<Task[]>(`/tasks/project/${projectId}`),
  getByPhase: (phaseId: string) => api.get<Task[]>(`/tasks/phase/${phaseId}`),
  create: (data: Partial<Task>) => api.post<Task>('/tasks/', data),
  update: (id: string, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tasks/${id}`, { status }),
  assignUser: (taskId: string, userId: string) =>
    api.post(`/tasks/${taskId}/assign/${userId}`),
};

// ------------------
// File endpoints
// ------------------
export const fileAPI = {
  getByProject: (projectId: string) =>
    api.get<ProjectFile[]>(`/files/project/${projectId}`),

  upload: (projectId: string, file: File, filetypeId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId.toString());
    formData.append('filetype_id', filetypeId.toString());
    return api.post<ProjectFile>('/files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  download: (id: string) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  archive: (id: string) => api.post(`/files/${id}/archive`),
  delete: (id: string) => api.delete(`/files/${id}`),
};

// ------------------
// File type endpoints
// ------------------
export const fileTypeAPI = {
  getAll: () => api.get<FileType[]>('/filetypes/'),
  create: (data: Partial<FileType>) => api.post<FileType>('/filetypes/', data),
  update: (id: string, data: Partial<FileType>) =>
    api.put<FileType>(`/filetypes/${id}`, data),
  delete: (id: string) => api.delete(`/filetypes/${id}`),
};
