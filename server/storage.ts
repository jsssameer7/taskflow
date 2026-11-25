import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase.ts';
import type {
  AlertTiming,
  CreateTaskInput,
  Priority,
  SortField,
  SortOrder,
  Task,
  TaskStatusFilter,
  UpdateTaskInput,
  UserSettings,
} from '../src/types/task.ts';

interface SupabaseTaskRow {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  category: string | null;
  due_date: string | null;
  reminder_timing?: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface SupabaseSettingsRow {
  key: string;
  display_name: string;
  email: string;
  role: string;
  default_priority: Priority;
  default_category: string;
  notifications_enabled?: boolean | null;
  alert_timing?: string | null;
  alert_overdue?: boolean | null;
  sound_enabled?: boolean | null;
  updated_at: string;
}

interface LocalStoreData {
  tasks: Task[];
  settings: UserSettings;
}

export interface ListTasksOptions {
  search: string;
  status: TaskStatusFilter;
  priority: Priority | 'all';
  category: string;
  sortBy: SortField;
  sortOrder: SortOrder;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.resolve(DATA_DIR, 'taskflow-store.json');

const DEFAULT_SETTINGS: UserSettings = {
  displayName: 'Alex Morgan',
  email: 'alex@taskflow.app',
  role: 'Product Manager',
  defaultPriority: 'medium',
  defaultCategory: 'Work',
  notificationsEnabled: true,
  alertTiming: '15m',
  alertOverdue: true,
  soundEnabled: true,
  updatedAt: new Date().toISOString(),
};

const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

let supabase: SupabaseClient | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function serializeSupabaseTask(row: SupabaseTaskRow): Task {
  return {
    _id: row.id,
    title: row.title,
    description: row.description ?? '',
    priority: row.priority,
    category: row.category || 'General',
    dueDate: row.due_date ?? null,
    reminderTiming: (row.reminder_timing as AlertTiming | 'default') || 'default',
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function serializeSupabaseSettings(row: SupabaseSettingsRow): UserSettings {
  return {
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    defaultPriority: row.default_priority,
    defaultCategory: row.default_category,
    notificationsEnabled: row.notifications_enabled ?? true,
    alertTiming: (row.alert_timing as AlertTiming) || '15m',
    alertOverdue: row.alert_overdue ?? true,
    soundEnabled: row.sound_enabled ?? true,
    updatedAt: row.updated_at,
  };
}

export function isTaskOverdue(
  task: Pick<Task, 'completed' | 'dueDate'>,
  now = new Date()
): boolean {
  if (task.completed || !task.dueDate) return false;
  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) return false;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return due < startOfToday;
}

function sortTasks(tasks: Task[], sortBy: SortField, sortOrder: SortOrder): Task[] {
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

function filterTasksInMemory(tasks: Task[], options: ListTasksOptions, now = new Date()): Task[] {
  let items = tasks;
  if (options.search) {
    const q = options.search.toLowerCase();
    items = items.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }
  if (options.status === 'completed') {
    items = items.filter((t) => t.completed);
  } else if (options.status === 'pending') {
    items = items.filter((t) => !t.completed);
  } else if (options.status === 'overdue') {
    items = items.filter((t) => isTaskOverdue(t, now));
  }
  if (options.priority !== 'all') {
    items = items.filter((t) => t.priority === options.priority);
  }
  if (options.category !== 'all') {
    items = items.filter((t) => t.category.toLowerCase() === options.category.toLowerCase());
  }
  return sortTasks(items, options.sortBy, options.sortOrder);
}

async function ensureLocalStore(): Promise<LocalStoreData> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LocalStoreData>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      settings: parsed.settings
        ? { ...DEFAULT_SETTINGS, ...parsed.settings }
        : { ...DEFAULT_SETTINGS },
    };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') {
      const initial: LocalStoreData = {
        tasks: [],
        settings: { ...DEFAULT_SETTINGS },
      };
      await atomicWriteStore(initial);
      return initial;
    }
    throw err;
  }
}

async function atomicWriteStore(data: LocalStoreData): Promise<void> {
  const writeOp = async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tempPath = path.resolve(
      DATA_DIR,
      `.taskflow-store.${crypto.randomBytes(6).toString('hex')}.tmp`
    );
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tempPath, STORE_PATH);
  };
  writeQueue = writeQueue.then(writeOp, writeOp);
  return writeQueue;
}

export async function initializeDatabase(): Promise<void> {
  supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from('tasks').select('id').limit(1);
      if (error) {
        console.warn(
          `[TaskFlow Supabase] Check failed (${error.message}). Falling back to local store at data/taskflow-store.json.`
        );
        supabase = null;
      } else {
        console.log('[TaskFlow] Supabase client initialized and connected successfully.');
        return;
      }
    } catch (err) {
      console.warn('[TaskFlow Supabase] Connection error. Falling back to local store.', err);
      supabase = null;
    }
  }

  await ensureLocalStore();
  console.log(
    '[TaskFlow] Local persistent disk store ready at data/taskflow-store.json'
  );
}

export async function listTasks(options: ListTasksOptions): Promise<Task[]> {
  const now = new Date();

  if (supabase) {
    let query = supabase.from('tasks').select('*');

    if (options.status === 'completed') {
      query = query.eq('completed', true);
    } else if (options.status === 'pending') {
      query = query.eq('completed', false);
    } else if (options.status === 'overdue') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      query = query.eq('completed', false).lt('due_date', startOfToday.toISOString());
    }

    if (options.priority !== 'all') {
      query = query.eq('priority', options.priority);
    }

    if (options.category !== 'all') {
      query = query.eq('category', options.category);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[TaskFlow Supabase] listTasks failed:', error);
      throw new Error('Failed to load tasks from Supabase.');
    }

    const tasks = ((data as SupabaseTaskRow[] | null) ?? []).map(serializeSupabaseTask);
    return filterTasksInMemory(tasks, options, now);
  }

  const store = await ensureLocalStore();
  return filterTasksInMemory(store.tasks, options, now);
}

export async function getTaskById(id: string): Promise<Task | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[TaskFlow Supabase] getTaskById failed:', error);
      throw new Error('Failed to retrieve task from Supabase.');
    }
    return data ? serializeSupabaseTask(data as SupabaseTaskRow) : null;
  }

  const store = await ensureLocalStore();
  return store.tasks.find((t) => t._id === id) ?? null;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: input.title,
        description: input.description ?? '',
        priority: input.priority,
        category: input.category || 'General',
        due_date: input.dueDate ?? null,
        reminder_timing: input.reminderTiming ?? 'default',
        completed: false,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('[TaskFlow Supabase] createTask failed:', error);
      throw new Error('Failed to create task in Supabase.');
    }
    return serializeSupabaseTask(data as SupabaseTaskRow);
  }

  const store = await ensureLocalStore();
  const nowIso = new Date().toISOString();
  const task: Task = {
    _id: crypto.randomUUID(),
    title: input.title,
    description: input.description ?? '',
    priority: input.priority,
    category: input.category || 'General',
    dueDate: input.dueDate ?? null,
    reminderTiming: input.reminderTiming ?? 'default',
    completed: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  store.tasks.unshift(task);
  await atomicWriteStore(store);
  return task;
}

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<Task | null> {
  if (supabase) {
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.title !== undefined) updatePayload.title = patch.title;
    if (patch.description !== undefined) updatePayload.description = patch.description;
    if (patch.priority !== undefined) updatePayload.priority = patch.priority;
    if (patch.category !== undefined) updatePayload.category = patch.category;
    if (patch.dueDate !== undefined) updatePayload.due_date = patch.dueDate;
    if (patch.reminderTiming !== undefined) updatePayload.reminder_timing = patch.reminderTiming;
    if (patch.completed !== undefined) updatePayload.completed = patch.completed;

    const { data, error } = await supabase
      .from('tasks')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[TaskFlow Supabase] updateTask failed:', error);
      throw new Error('Failed to update task in Supabase.');
    }
    return data ? serializeSupabaseTask(data as SupabaseTaskRow) : null;
  }

  const store = await ensureLocalStore();
  const idx = store.tasks.findIndex((t) => t._id === id);
  if (idx === -1) return null;

  const current = store.tasks[idx];
  const updated: Task = {
    ...current,
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.category !== undefined ? { category: patch.category } : {}),
    ...(patch.dueDate !== undefined ? { dueDate: patch.dueDate } : {}),
    ...(patch.reminderTiming !== undefined ? { reminderTiming: patch.reminderTiming } : {}),
    ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
    updatedAt: new Date().toISOString(),
  };
  store.tasks[idx] = updated;
  await atomicWriteStore(store);
  return updated;
}

export async function toggleTaskComplete(
  id: string,
  explicitCompleted?: boolean
): Promise<Task | null> {
  if (supabase) {
    let nextCompleted = explicitCompleted;
    if (nextCompleted === undefined) {
      const existing = await getTaskById(id);
      if (!existing) return null;
      nextCompleted = !existing.completed;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed: nextCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[TaskFlow Supabase] toggleTaskComplete failed:', error);
      throw new Error('Failed to update task completion status in Supabase.');
    }
    return data ? serializeSupabaseTask(data as SupabaseTaskRow) : null;
  }

  const store = await ensureLocalStore();
  const idx = store.tasks.findIndex((t) => t._id === id);
  if (idx === -1) return null;
  const current = store.tasks[idx];
  const updated: Task = {
    ...current,
    completed: typeof explicitCompleted === 'boolean' ? explicitCompleted : !current.completed,
    updatedAt: new Date().toISOString(),
  };
  store.tasks[idx] = updated;
  await atomicWriteStore(store);
  return updated;
}

export async function deleteTask(id: string): Promise<Task | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) {
      console.error('[TaskFlow Supabase] deleteTask failed:', error);
      throw new Error('Failed to delete task from Supabase.');
    }
    return data ? serializeSupabaseTask(data as SupabaseTaskRow) : null;
  }

  const store = await ensureLocalStore();
  const idx = store.tasks.findIndex((t) => t._id === id);
  if (idx === -1) return null;
  const [removed] = store.tasks.splice(idx, 1);
  await atomicWriteStore(store);
  return removed;
}

export async function clearCompletedTasks(): Promise<number> {
  if (supabase) {
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('completed', true)
      .select('id');

    if (error) {
      console.error('[TaskFlow Supabase] clearCompletedTasks failed:', error);
      throw new Error('Failed to clear completed tasks in Supabase.');
    }
    return Array.isArray(data) ? data.length : 0;
  }

  const store = await ensureLocalStore();
  const before = store.tasks.length;
  store.tasks = store.tasks.filter((t) => !t.completed);
  const deletedCount = before - store.tasks.length;
  if (deletedCount > 0) {
    await atomicWriteStore(store);
  }
  return deletedCount;
}

export async function getSettings(): Promise<UserSettings> {
  if (supabase) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'default')
      .maybeSingle();

    if (error) {
      console.error('[TaskFlow Supabase] getSettings failed:', error);
      throw new Error('Failed to load settings from Supabase.');
    }

    if (data) {
      return serializeSupabaseSettings(data as SupabaseSettingsRow);
    }

    const { data: inserted, error: insertError } = await supabase
      .from('settings')
      .upsert(
        {
          key: 'default',
          display_name: DEFAULT_SETTINGS.displayName,
          email: DEFAULT_SETTINGS.email,
          role: DEFAULT_SETTINGS.role,
          default_priority: DEFAULT_SETTINGS.defaultPriority,
          default_category: DEFAULT_SETTINGS.defaultCategory,
        },
        { onConflict: 'key' }
      )
      .select('*')
      .single();

    if (insertError || !inserted) {
      console.error('[TaskFlow Supabase] seed settings failed:', insertError);
      return { ...DEFAULT_SETTINGS };
    }
    return serializeSupabaseSettings(inserted as SupabaseSettingsRow);
  }

  const store = await ensureLocalStore();
  return store.settings;
}

export async function updateSettings(
  input: Omit<UserSettings, 'updatedAt'>
): Promise<UserSettings> {
  if (supabase) {
    const { data, error } = await supabase
      .from('settings')
      .upsert(
        {
          key: 'default',
          display_name: input.displayName,
          email: input.email,
          role: input.role,
          default_priority: input.defaultPriority,
          default_category: input.defaultCategory,
          notifications_enabled: input.notificationsEnabled ?? true,
          alert_timing: input.alertTiming ?? '15m',
          alert_overdue: input.alertOverdue ?? true,
          sound_enabled: input.soundEnabled ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select('*')
      .single();

    if (error || !data) {
      console.error('[TaskFlow Supabase] updateSettings failed:', error);
      throw new Error('Failed to save settings to Supabase.');
    }
    return serializeSupabaseSettings(data as SupabaseSettingsRow);
  }

  const store = await ensureLocalStore();
  const updated: UserSettings = {
    ...input,
    notificationsEnabled: input.notificationsEnabled ?? true,
    alertTiming: input.alertTiming ?? '15m',
    alertOverdue: input.alertOverdue ?? true,
    soundEnabled: input.soundEnabled ?? true,
    updatedAt: new Date().toISOString(),
  };
  store.settings = updated;
  await atomicWriteStore(store);
  return updated;
}
