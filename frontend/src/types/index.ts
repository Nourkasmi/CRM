// ------------------
// User
// ------------------
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superuser' | 'manager' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ------------------
// Project (API Response)
// ------------------
export interface Project {
  id: string;
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
  managers: Array<{ id: string; email: string }>;
  members: Array<{ id: string; email: string }>;
  assigned_to: Array<{ id: string; email: string }>;
  phases: Phase[];
}

// ✅ New: Project Creation Payload
export interface ProjectCreatePayload {
  name: string;
  description?: string;
  deadline: string;
  manager_ids?: string[]; // ⬅️ backend expects IDs here
}

// ✅ New: Project Update Payload
export interface ProjectUpdatePayload {
  name?: string;
  description?: string;
  deadline?: string;
}

// ------------------
// Phase
// ------------------
export interface Phase {
  id: string;
  name: string;
  project: string; // Project ID
  deadline?: string;
  created_at: string;
  status: 'active' | 'completed';
}

// ------------------
// Task (API Response)
// ------------------
export interface Task {
  id: string;
  title: string;
  description: string;
  phase: string;
  project: string;
  created_by: { id: string; email: string };
  assigned_to: Array<{ id: string; email: string }>;
  status: 'todo' | 'in_progress' | 'done';
  deadline?: string;
  created_at: string;
}

// ✅ New: Task Creation Payload
export interface TaskCreatePayload {
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  deadline?: string;
  assigned_user_id?: string;
  phase_id: string; // ⬅️ required to attach task to phase
}

// ✅ New: Task Update Payload
export interface TaskUpdatePayload {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  deadline?: string;
}

// ------------------
// File
// ------------------
export interface ProjectFile {
  id: string;
  filename: string;
  path: string;
  uploaded_by: { id: string; email: string };
  project: string;
  filetype: { id: string; name: string };
  uploaded_at: string;
  is_archived: boolean;
}

// ------------------
// File Type
// ------------------
export interface FileType {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// ------------------
// Auth
// ------------------
export interface AuthResponse {
  token: string;
  role: string;
  id: string;
  is_active: boolean;
}
