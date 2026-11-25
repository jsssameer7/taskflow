import type {
  CreateTaskInput,
  Priority,
  SortField,
  SortOrder,
  Task,
  TaskStatusFilter,
  UpdateTaskInput,
  UserSettings,
} from '../types/task.ts';

interface ApiErrorPayload {
  error?: string;
  details?: string[];
}

export class ApiClientError extends Error {
  status: number;
  details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const errPayload = data as ApiErrorPayload;
    throw new ApiClientError(
      errPayload.error || `Request failed with status ${response.status}`,
      response.status,
      errPayload.details || []
    );
  }

  return data as T;
}

export interface FetchTasksParams {
  search?: string;
  status?: TaskStatusFilter;
  priority?: Priority | 'all';
  category?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
}

export async function fetchTasks(params: FetchTasksParams = {}): Promise<Task[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.status && params.status !== 'all') qs.set('status', params.status);
  if (params.priority && params.priority !== 'all') qs.set('priority', params.priority);
  if (params.category && params.category !== 'all') qs.set('category', params.category);
  if (params.sortBy) qs.set('sortBy', params.sortBy);
  if (params.sortOrder) qs.set('sortOrder', params.sortOrder);

  const queryString = qs.toString();
  const data = await request<{ tasks: Task[] }>(
    `/api/tasks${queryString ? `?${queryString}` : ''}`
  );
  return data.tasks;
}

export async function fetchTaskById(id: string): Promise<Task> {
  const data = await request<{ task: Task }>(`/api/tasks/${encodeURIComponent(id)}`);
  return data.task;
}

export async function createTaskApi(input: CreateTaskInput): Promise<Task> {
  const data = await request<{ task: Task }>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.task;
}

export async function updateTaskApi(id: string, patch: UpdateTaskInput): Promise<Task> {
  const data = await request<{ task: Task }>(`/api/tasks/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return data.task;
}

export async function toggleTaskCompleteApi(
  id: string,
  completed?: boolean
): Promise<Task> {
  const data = await request<{ task: Task }>(
    `/api/tasks/${encodeURIComponent(id)}/complete`,
    {
      method: 'PATCH',
      body: JSON.stringify(completed === undefined ? {} : { completed }),
    }
  );
  return data.task;
}

export async function deleteTaskApi(id: string): Promise<string> {
  const data = await request<{ deletedId: string }>(
    `/api/tasks/${encodeURIComponent(id)}`,
    { method: 'DELETE' }
  );
  return data.deletedId;
}

export async function clearCompletedTasksApi(): Promise<number> {
  const data = await request<{ deletedCount: number }>('/api/tasks/completed', {
    method: 'DELETE',
  });
  return data.deletedCount;
}

export async function fetchSettingsApi(): Promise<UserSettings> {
  const data = await request<{ settings: UserSettings }>('/api/settings');
  return data.settings;
}

export async function updateSettingsApi(
  input: Omit<UserSettings, 'updatedAt'>
): Promise<UserSettings> {
  const data = await request<{ settings: UserSettings }>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return data.settings;
}
