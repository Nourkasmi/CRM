export interface User {
  id: number;
  email: string;
  name: string; // ✅ changed from username
  role: 'superuser' | 'manager' | 'user';
  is_validated: boolean;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  manager_id: number;
  phases?: Phase[];
  tasks?: Task[];
  files?: ProjectFile[];
}

export interface Phase {
  id: number;
  name: string;
  description: string;
  status: string;
  project_id: number;
  start_date?: string;
  end_date?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: number;
  project_id: number;
  phase_id?: number;
  due_date?: string;
  created_at: string;
}

export interface ProjectFile {
  id: number;
  name: string;
  original_name: string;
  file_type: string;
  size: number;
  project_id: number;
  uploaded_by: number;
  is_archived: boolean;
  created_at: string;
}

export interface FileType {
  id: number;
  name: string;
  description: string;
  extensions: string[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
