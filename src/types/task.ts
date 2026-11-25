export type Priority = 'low' | 'medium' | 'high';

export type TaskStatusFilter = 'all' | 'pending' | 'completed' | 'overdue';

export type SortField = 'dueDate' | 'createdAt' | 'priority';

export type SortOrder = 'asc' | 'desc';

export type PageRoute = 'dashboard' | 'tasks' | 'completed' | 'settings';

export type AlertTiming = 'at_due' | '15m' | '30m' | '1h' | '1d' | 'never';

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: Priority;
  category: string;
  dueDate: string | null;
  reminderTiming?: AlertTiming | 'default';
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
  reminderTiming?: AlertTiming | 'default';
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
  reminderTiming?: AlertTiming | 'default';
  completed?: boolean;
}

export interface UserSettings {
  displayName: string;
  email: string;
  role: string;
  defaultPriority: Priority;
  defaultCategory: string;
  notificationsEnabled?: boolean;
  alertTiming?: AlertTiming;
  alertOverdue?: boolean;
  soundEnabled?: boolean;
  updatedAt: string;
}

export interface TaskNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  type: 'due_soon' | 'due_now' | 'overdue';
  message: string;
  dueDate: string;
  timestamp: number;
  read: boolean;
}

export const ALERT_TIMING_OPTIONS: Array<{ value: AlertTiming; label: string; offsetMinutes: number }> = [
  { value: 'at_due', label: 'At due time', offsetMinutes: 0 },
  { value: '15m', label: '15 minutes before', offsetMinutes: 15 },
  { value: '30m', label: '30 minutes before', offsetMinutes: 30 },
  { value: '1h', label: '1 hour before', offsetMinutes: 60 },
  { value: '1d', label: '1 day before', offsetMinutes: 1440 },
  { value: 'never', label: 'Do not alert', offsetMinutes: -1 },
];

export const DEFAULT_CATEGORIES = [
  'Work',
  'Personal',
  'Engineering',
  'Design',
  'Finance',
  'Health',
  'General',
] as const;
