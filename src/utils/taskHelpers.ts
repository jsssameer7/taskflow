import type { Priority, SortField, SortOrder, Task } from '../types/task.ts';

export interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  completionRate: number;
}

export function isOverdue(task: Pick<Task, 'completed' | 'dueDate'>): boolean {
  if (task.completed || !task.dueDate) return false;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due < startOfToday;
}

export function isDueToday(dueDate: string | null): boolean {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

export function computeTaskStats(tasks: Task[]): TaskStats {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, pending, completed, overdue, completionRate };
}

export function formatDueDateLabel(dueDate: string | null, completed: boolean): {
  label: string;
  tone: 'overdue' | 'today' | 'upcoming' | 'none';
} {
  if (!dueDate) {
    return { label: 'No due date', tone: 'none' };
  }
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) {
    return { label: 'No due date', tone: 'none' };
  }

  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  }).format(date);

  if (!completed && isOverdue({ completed, dueDate })) {
    return { label: `Overdue · ${formatted}`, tone: 'overdue' };
  }
  if (!completed && isDueToday(dueDate)) {
    return { label: `Due today · ${formatted}`, tone: 'today' };
  }
  return { label: `Due ${formatted}`, tone: 'upcoming' };
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  }).format(date);
}

export function toDateInputValue(isoDate: string | null): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  // Store local noon so timezone offsets do not shift the calendar day
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toISOString();
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getTodayHeadingDate(): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function sortTaskList(
  tasks: Task[],
  sortBy: SortField,
  sortOrder: SortOrder
): Task[] {
  const factor = sortOrder === 'asc' ? 1 : -1;
  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const diff = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (diff !== 0) return diff * factor;
    } else if (sortBy === 'dueDate') {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : null;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : null;
      if (aTime === null && bTime !== null) return 1;
      if (aTime !== null && bTime === null) return -1;
      if (aTime !== null && bTime !== null && aTime !== bTime) {
        return (aTime - bTime) * factor;
      }
    }
    const aCreated = new Date(a.createdAt).getTime();
    const bCreated = new Date(b.createdAt).getTime();
    return (aCreated - bCreated) * factor;
  });
}
