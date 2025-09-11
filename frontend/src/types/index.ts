export interface User {
  id: string; // MongoDB ObjectId as string
  email: string;
  name: string;
  role: 'superuser' | 'manager' | 'user';
  is_active: boolean; // Changed from is_validated to match backend
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string; // MongoDB ObjectId as string
  name: string;
  description: string;
  deadline?: string;
  created_by: {
    id: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  managers: Array<{
    id: string;
    email: string;
  }>;
  members: Array<{
    id: string;
    email: string;
  }>;
  assigned_to: Array<{
    id: string;
    email: string;
  }>;
  phases: Phase[];
}

export interface Phase {
  id: string;
  name: string;
  project: string; // Project ID
  deadline?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  phase: string; // Phase ID
  project: string; // Project ID
  created_by: {
    id: string;
    email: string;
  };
  assigned_to: Array<{
    id: string;
    email: string;
  }>;
  status: 'todo' | 'in_progress' | 'done';
  deadline?: string;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  filename: string;
  path: string;
  uploaded_by: {
    id: string;
    email: string;
  };
  project: string; // Project ID
  filetype: {
    id: string;
    name: string;
  };
  uploaded_at: string;
  is_archived: boolean;
}

export interface FileType {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface AuthResponse {
  token: string; // Changed from access_token to match backend
  role: string;
  id: string;
  is_active: boolean;
}