import axios from 'axios';
import { AuthResponse, User, Project, Phase, Task, ProjectFile, FileType } from '../types';

const API_BASE_URL = 'http://localhost:5000/api'; // Flask backend

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add JWT token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
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
    api.post('/auth/reset-password', { token, password }),
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
    api.put('/users/me/reset-password', { old_password: oldPassword, new_password: newPassword }),
  // ✅ Fixed: Use the correct auth endpoint for validation
  validateUser: (userId: number) => api.post(`/auth/validate/${userId}`),
  // ✅ Fixed: Use correct endpoint and parameter format
  assignRole: (userId: number, role: string) => api.put(`/users/${userId}/role`, { role }),
  deleteUser: (userId: number) => api.delete(`/users/${userId}`),
};

// ------------------
// Project endpoints
// ------------------
export const projectAPI = {
  getAll: () => api.get<Project[]>('/projects/'),
  getById: (id: number) => api.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) => api.post<Project>('/projects/', data),
  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
  archive: (id: number) => api.post(`/projects/${id}/archive`),
};

// ------------------
// Phase endpoints
// ------------------
export const phaseAPI = {
  getByProject: (projectId: number) => api.get<Phase[]>(`/phases/${projectId}`),
  create: (data: Partial<Phase> & { project_id: number }) => api.post<Phase>(`/phases/${data.project_id}`, data),
  update: (id: number, data: Partial<Phase>) => api.put<Phase>(`/phases/update/${id}`, data),
  delete: (id: number) => api.delete(`/phases/${id}`),
};

// ------------------
// Task endpoints
// ------------------
export const taskAPI = {
  getByProject: (projectId: number) => api.get<Task[]>(`/tasks/project/${projectId}`),
  getByPhase: (phaseId: number) => api.get<Task[]>(`/tasks/phase/${phaseId}`),
  create: (data: Partial<Task>) => api.post<Task>('/tasks/', data),
  update: (id: number, data: Partial<Task>) => api.put<Task>(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
  updateStatus: (id: number, status: string) => api.patch(`/tasks/${id}`, { status }),
  assignUser: (taskId: number, userId: number) => api.post(`/tasks/${taskId}/assign/${userId}`),
};

// ------------------
// File endpoints
// ------------------
export const fileAPI = {
  getByProject: (projectId: number) => api.get<ProjectFile[]>(`/files/project/${projectId}`),
  upload: (projectId: number, file: File, filetypeId: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId.toString());
    formData.append('filetype_id', filetypeId.toString());
    return api.post<ProjectFile>('/files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  download: (id: number) => api.get(`/files/${id}/download`, { responseType: 'blob' }),
  archive: (id: number) => api.post(`/files/${id}/archive`),
  delete: (id: number) => api.delete(`/files/${id}`),
};

// ------------------
// File type endpoints
// ------------------
export const fileTypeAPI = {
  getAll: () => api.get<FileType[]>('/filetypes/'),
  create: (data: Partial<FileType>) => api.post<FileType>('/filetypes/', data),
  update: (id: number, data: Partial<FileType>) => api.put<FileType>(`/filetypes/${id}`, data),
  delete: (id: number) => api.delete(`/filetypes/${id}`),
};