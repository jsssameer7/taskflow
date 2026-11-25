export type Priority = 'low' | 'medium' | 'high';

export type TaskStatusFilter = 'all' | 'pending' | 'completed' | 'overdue';

export type SortField = 'dueDate' | 'createdAt' | 'priority';

export type SortOrder = 'asc' | 'desc';

export type PageRoute = 'dashboard' | 'tasks' | 'completed' | 'settings';

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: Priority;
  category: string;
  dueDate?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
  completed?: boolean;
}

export interface UserSettings {
  displayName: string;
  email: string;
  role: string;
  defaultPriority: Priority;
  defaultCategory: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES = [
  'Work',
  'Personal',
  'Engineering',
  'Design',
  'Finance',
  'Health',
  'General',
] as const;
