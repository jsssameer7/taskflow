import type { AlertTiming, Priority, SortField, SortOrder, TaskStatusFilter } from '../src/types/task.ts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PRIORITIES: readonly Priority[] = ['low', 'medium', 'high'];
const STATUSES: readonly TaskStatusFilter[] = ['all', 'pending', 'completed', 'overdue'];
const SORT_FIELDS: readonly SortField[] = ['dueDate', 'createdAt', 'priority'];
const SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'];
const ALERT_TIMINGS: readonly AlertTiming[] = ['at_due', '15m', '30m', '1h', '1d', 'never'];
const REMINDER_TIMINGS: readonly (AlertTiming | 'default')[] = [
  'default',
  'at_due',
  '15m',
  '30m',
  '1h',
  '1d',
  'never',
];

export class ValidationError extends Error {
  statusCode: number;
  details: string[];

  constructor(message: string, details: string[] = [], statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.details = details.length > 0 ? details : [message];
  }
}

export function assertValidTaskId(id: unknown): string {
  if (typeof id !== 'string' || !UUID_REGEX.test(id)) {
    throw new ValidationError('Invalid task identifier format.');
  }
  return id;
}

export function sanitizeString(value: unknown, fieldName: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a valid text string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} cannot exceed ${maxLength} characters.`);
  }
  return trimmed;
}

export function parseDueDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ValidationError('Due date must be a valid ISO date string.');
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Due date is not a valid date.');
  }
  return parsed.toISOString();
}

export function parsePriority(value: unknown, fallback?: Priority): Priority {
  if ((value === undefined || value === null || value === '') && fallback) {
    return fallback;
  }
  if (typeof value !== 'string' || !PRIORITIES.includes(value as Priority)) {
    throw new ValidationError('Priority must be one of: low, medium, or high.');
  }
  return value as Priority;
}

export function validateCreateTaskBody(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object.');
  }
  const raw = body as Record<string, unknown>;
  const errors: string[] = [];

  let title = '';
  if (typeof raw.title !== 'string' || raw.title.trim().length === 0) {
    errors.push('Task title is required and cannot be empty.');
  } else if (raw.title.trim().length > 200) {
    errors.push('Task title cannot exceed 200 characters.');
  } else {
    title = raw.title.trim();
  }

  let description = '';
  if (raw.description !== undefined && raw.description !== null) {
    if (typeof raw.description !== 'string') {
      errors.push('Description must be a string.');
    } else if (raw.description.trim().length > 2000) {
      errors.push('Description cannot exceed 2000 characters.');
    } else {
      description = raw.description.trim();
    }
  }

  let priority: Priority = 'medium';
  try {
    priority = parsePriority(raw.priority, 'medium');
  } catch (err) {
    errors.push((err as Error).message);
  }

  let category = 'General';
  if (raw.category !== undefined && raw.category !== null && raw.category !== '') {
    if (typeof raw.category !== 'string') {
      errors.push('Category must be a string.');
    } else if (raw.category.trim().length > 60) {
      errors.push('Category cannot exceed 60 characters.');
    } else {
      category = raw.category.trim() || 'General';
    }
  }

  let dueDate: string | null = null;
  try {
    dueDate = parseDueDate(raw.dueDate);
  } catch (err) {
    errors.push((err as Error).message);
  }

  let reminderTiming: AlertTiming | 'default' = 'default';
  if (raw.reminderTiming !== undefined && raw.reminderTiming !== null && raw.reminderTiming !== '') {
    if (typeof raw.reminderTiming !== 'string' || !REMINDER_TIMINGS.includes(raw.reminderTiming as AlertTiming | 'default')) {
      errors.push('Reminder timing must be one of: default, at_due, 15m, 30m, 1h, 1d, never.');
    } else {
      reminderTiming = raw.reminderTiming as AlertTiming | 'default';
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors[0], errors, 400);
  }

  return { title, description, priority, category, dueDate, reminderTiming };
}

export function validateUpdateTaskBody(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object.');
  }
  const raw = body as Record<string, unknown>;
  const errors: string[] = [];
  const patch: {
    title?: string;
    description?: string;
    priority?: Priority;
    category?: string;
    dueDate?: string | null;
    reminderTiming?: AlertTiming | 'default';
    completed?: boolean;
  } = {};

  if ('title' in raw) {
    if (typeof raw.title !== 'string' || raw.title.trim().length === 0) {
      errors.push('Task title cannot be empty.');
    } else if (raw.title.trim().length > 200) {
      errors.push('Task title cannot exceed 200 characters.');
    } else {
      patch.title = raw.title.trim();
    }
  }

  if ('description' in raw) {
    if (raw.description === null) {
      patch.description = '';
    } else if (typeof raw.description !== 'string') {
      errors.push('Description must be a string.');
    } else if (raw.description.trim().length > 2000) {
      errors.push('Description cannot exceed 2000 characters.');
    } else {
      patch.description = raw.description.trim();
    }
  }

  if ('priority' in raw) {
    try {
      patch.priority = parsePriority(raw.priority);
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  if ('category' in raw) {
    if (typeof raw.category !== 'string') {
      errors.push('Category must be a string.');
    } else if (raw.category.trim().length > 60) {
      errors.push('Category cannot exceed 60 characters.');
    } else {
      patch.category = raw.category.trim() || 'General';
    }
  }

  if ('dueDate' in raw) {
    try {
      patch.dueDate = parseDueDate(raw.dueDate);
    } catch (err) {
      errors.push((err as Error).message);
    }
  }

  if ('reminderTiming' in raw) {
    if (
      raw.reminderTiming !== null &&
      (typeof raw.reminderTiming !== 'string' ||
        !REMINDER_TIMINGS.includes(raw.reminderTiming as AlertTiming | 'default'))
    ) {
      errors.push('Reminder timing must be one of: default, at_due, 15m, 30m, 1h, 1d, never.');
    } else {
      patch.reminderTiming = (raw.reminderTiming as AlertTiming | 'default') ?? 'default';
    }
  }

  if ('completed' in raw) {
    if (typeof raw.completed !== 'boolean') {
      errors.push('Completed status must be a boolean.');
    } else {
      patch.completed = raw.completed;
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors[0], errors, 400);
  }

  if (Object.keys(patch).length === 0) {
    throw new ValidationError('At least one valid field must be provided for update.');
  }

  return patch;
}

export function parseListQuery(query: Record<string, unknown>) {
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 120) : '';
  const status: TaskStatusFilter =
    typeof query.status === 'string' && STATUSES.includes(query.status as TaskStatusFilter)
      ? (query.status as TaskStatusFilter)
      : 'all';
  const priority: Priority | 'all' =
    typeof query.priority === 'string' && PRIORITIES.includes(query.priority as Priority)
      ? (query.priority as Priority)
      : 'all';
  const category =
    typeof query.category === 'string' && query.category.trim() !== '' && query.category !== 'all'
      ? query.category.trim().slice(0, 60)
      : 'all';
  const sortBy: SortField =
    typeof query.sortBy === 'string' && SORT_FIELDS.includes(query.sortBy as SortField)
      ? (query.sortBy as SortField)
      : 'createdAt';
  const sortOrder: SortOrder =
    typeof query.sortOrder === 'string' && SORT_ORDERS.includes(query.sortOrder as SortOrder)
      ? (query.sortOrder as SortOrder)
      : 'desc';

  return { search, status, priority, category, sortBy, sortOrder };
}

export function validateSettingsBody(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Request body must be a JSON object.');
  }
  const raw = body as Record<string, unknown>;
  const errors: string[] = [];

  const displayName =
    typeof raw.displayName === 'string' ? raw.displayName.trim() : '';
  if (!displayName) {
    errors.push('Display name is required.');
  } else if (displayName.length > 80) {
    errors.push('Display name cannot exceed 80 characters.');
  }

  const email = typeof raw.email === 'string' ? raw.email.trim() : '';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Please enter a valid email address.');
  } else if (email.length > 120) {
    errors.push('Email cannot exceed 120 characters.');
  }

  const role = typeof raw.role === 'string' ? raw.role.trim().slice(0, 80) : '';

  let defaultPriority: Priority = 'medium';
  try {
    defaultPriority = parsePriority(raw.defaultPriority, 'medium');
  } catch (err) {
    errors.push((err as Error).message);
  }

  const defaultCategory =
    typeof raw.defaultCategory === 'string' && raw.defaultCategory.trim()
      ? raw.defaultCategory.trim().slice(0, 60)
      : 'Work';

  const notificationsEnabled =
    typeof raw.notificationsEnabled === 'boolean' ? raw.notificationsEnabled : true;

  const alertTiming: AlertTiming =
    typeof raw.alertTiming === 'string' && ALERT_TIMINGS.includes(raw.alertTiming as AlertTiming)
      ? (raw.alertTiming as AlertTiming)
      : '15m';

  const alertOverdue =
    typeof raw.alertOverdue === 'boolean' ? raw.alertOverdue : true;

  const soundEnabled =
    typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : true;

  if (errors.length > 0) {
    throw new ValidationError(errors[0], errors, 400);
  }

  return {
    displayName,
    email,
    role,
    defaultPriority,
    defaultCategory,
    notificationsEnabled,
    alertTiming,
    alertOverdue,
    soundEnabled,
  };
}

export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
