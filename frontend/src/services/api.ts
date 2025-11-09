import axios from "axios";
import {
  AuthResponse,
  User,
  Project,
  ProjectCreatePayload,
  ProjectUpdatePayload,
  Phase,
  Task,
  TaskCreatePayload,
  TaskUpdatePayload,
  ProjectFile,
  FileType,
} from "../types";

// ------------------------------------------------------
// 🌍 API BASE URL
// ------------------------------------------------------
// You can switch automatically between local and production
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// ------------------------------------------------------
// ⚙️ Axios Instance
// ------------------------------------------------------
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ------------------------------------------------------
// 🧠 Interceptors
// ------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ------------------------------------------------------
// 🔐 Auth API
// ------------------------------------------------------
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }),
  register: (data: { email: string; name: string; password: string }) =>
    api.post<AuthResponse>("/auth/register", data),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, new_password: password }),
  logout: () => api.post("/auth/logout"),
};

// ------------------------------------------------------
// 👥 User API
// ------------------------------------------------------
export const userAPI = {
  getAll: () => api.get<User[]>("/users/"),
  getProfile: () => api.get<User>("/users/me"),
  updateProfile: (data: Partial<User>) => api.put<User>("/users/me", data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put("/users/me/reset-password", {
      old_password: oldPassword,
      new_password: newPassword,
    }),
  validateUser: (userId: string) => api.put(`/users/${userId}/validate`),
  assignRole: (userId: string, role: string) =>
    api.put(`/users/${userId}/role`, { role }),
  deleteUser: (userId: string) => api.delete(`/users/${userId}`),
};

// ------------------------------------------------------
// 📁 Project API
// ------------------------------------------------------
export const projectAPI = {
  getAllWithStats: () => api.get<Project[]>("/projects/with-stats"),
  getAll: () => api.get<Project[]>("/projects/"),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: ProjectCreatePayload) => api.post<Project>("/projects/", data),
  update: (id: string, data: ProjectUpdatePayload) =>
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  archive: (id: string) => api.post(`/projects/${id}/archive`),
  unarchive: (id: string) => api.post(`/projects/${id}/unarchive`),
  complete: (id: string) => api.put(`/projects/${id}/complete`),
};

// ------------------------------------------------------
// 📊 Phase API
// ------------------------------------------------------
export const phaseAPI = {
  getByProject: (projectId: string) => api.get<Phase[]>(`/phases/${projectId}`),
  create: (projectId: string, data: { name: string; deadline?: string }) =>
    api.post<Phase>(`/phases/${projectId}`, data),
  update: (id: string, data: Partial<Phase>) =>
    api.put<Phase>(`/phases/update/${id}`, data),
  delete: (id: string) => api.delete(`/phases/${id}`),
  complete: (id: string) => api.put(`/phases/${id}/complete`),
};

// ------------------------------------------------------
// ✅ Task API
// ------------------------------------------------------
export const taskAPI = {
  getByProject: (projectId: string) => api.get<Task[]>(`/tasks/project/${projectId}`),
  getByPhase: (phaseId: string) => api.get<Task[]>(`/tasks/phase/${phaseId}`),
  create: (phaseId: string, data: TaskCreatePayload) =>
    api.post<Task>("/tasks/", { ...data, phase_id: phaseId }),
  update: (id: string, data: TaskUpdatePayload) =>
    api.put<Task>(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/tasks/${id}`, { status }),
  assignUser: (taskId: string, userId: string) =>
    api.post(`/tasks/${taskId}/assign/${userId}`),
  complete: (id: string) => api.put(`/tasks/${id}/complete`),
};

// ------------------------------------------------------
// 📎 File API
// ------------------------------------------------------
export const fileAPI = {
  getAll: (includeArchived = false) =>
    api.get<ProjectFile[]>(`/files/?include_archived=${includeArchived}`),
  getByProject: (projectId: string, includeArchived = false) =>
    api.get<ProjectFile[]>(
      `/files/project/${projectId}?include_archived=${includeArchived}`
    ),
  upload: (projectId: string, file: File, filetypeId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", projectId.toString());
    formData.append("filetype_id", filetypeId.toString());
    return api.post<{ msg: string; file: ProjectFile }>("/files/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  download: (id: string) =>
    api.get(`/files/${id}/download`, { responseType: "blob" }),
  archive: (id: string) => api.post(`/files/${id}/archive`),
  unarchive: (id: string) => api.post(`/files/${id}/unarchive`),
  delete: (id: string) => api.delete(`/files/${id}`),
};

// ------------------------------------------------------
// 📂 FileType API
// ------------------------------------------------------
export const fileTypeAPI = {
  getAll: () => api.get<FileType[]>("/filetypes/"),
  create: (data: Partial<FileType>) => api.post<FileType>("/filetypes/", data),
  update: (id: string, data: Partial<FileType>) =>
    api.put<FileType>(`/filetypes/${id}`, data),
  delete: (id: string) => api.delete(`/filetypes/${id}`),
};

export default api;
