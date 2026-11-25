import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Menu, Plus, RefreshCw } from 'lucide-react';
import {
  clearCompletedTasksApi,
  createTaskApi,
  deleteTaskApi,
  fetchSettingsApi,
  fetchTasks,
  toggleTaskCompleteApi,
  updateSettingsApi,
  updateTaskApi,
} from './api/client.ts';
import type {
  CreateTaskInput,
  PageRoute,
  Priority,
  SortField,
  SortOrder,
  Task,
  TaskNotification,
  TaskStatusFilter,
  UpdateTaskInput,
  UserSettings,
} from './types/task.ts';
import { computeTaskStats } from './utils/taskHelpers.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { TaskModal } from './components/TaskModal.tsx';
import { ConfirmDialog } from './components/ConfirmDialog.tsx';
import { ToastContainer, type ToastItem } from './components/ToastContainer.tsx';
import { NotificationCenter } from './components/NotificationCenter.tsx';
import {
  checkTaskAlert,
  playAlertSound,
  showBrowserNotification,
} from './utils/notificationService.ts';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { AllTasksPage } from './pages/AllTasksPage.tsx';
import { CompletedTasksPage } from './pages/CompletedTasksPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

const DEFAULT_USER_SETTINGS: UserSettings = {
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

const PAGE_TITLES: Record<PageRoute, string> = {
  dashboard: 'Dashboard',
  tasks: 'All Tasks',
  completed: 'Completed Tasks',
  settings: 'Settings',
};

function getInitialTheme(): 'light' | 'dark' {
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return 'light';
}

export default function App() {
  const [activePage, setActivePage] = useState<PageRoute>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  // Server-backed data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  // Filters & sorting state for All Tasks
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Modals & notifications
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [clearCompletedOpen, setClearCompletedOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const firedAlertsRef = useRef<Set<string>>(new Set());
  const readAlertIdsRef = useRef<Set<string>>(new Set());

  const pushToast = useCallback(
    (type: ToastItem['type'], title: string, description?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 3800);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Periodic alert evaluation
  useEffect(() => {
    if (settings.notificationsEnabled === false) {
      setNotifications([]);
      return;
    }

    const evaluateAlerts = () => {
      const now = new Date();
      const activeList: TaskNotification[] = [];

      for (const task of tasks) {
        if (task.completed || !task.dueDate) continue;

        const alert = checkTaskAlert(task, settings, now);
        if (!alert) continue;

        const notificationId = `${task._id}-${alert.type}`;
        const isRead = readAlertIdsRef.current.has(notificationId);

        activeList.push({
          id: notificationId,
          taskId: task._id,
          taskTitle: task.title,
          type: alert.type,
          message: alert.message,
          dueDate: alert.dueDate,
          timestamp: Date.now(),
          read: isRead,
        });

        // Trigger sound, toast and browser notification once per event
        const eventKey = `${notificationId}-${task.dueDate}`;
        if (!firedAlertsRef.current.has(eventKey)) {
          firedAlertsRef.current.add(eventKey);

          if (settings.soundEnabled !== false) {
            playAlertSound();
          }

          pushToast(
            alert.type === 'overdue' ? 'error' : 'info',
            `Task Alert: ${task.title}`,
            alert.message
          );

          showBrowserNotification(`Task Alert: ${task.title}`, {
            body: alert.message,
          });
        }
      }

      setNotifications(activeList);
    };

    evaluateAlerts();
    const timer = window.setInterval(evaluateAlerts, 15000);
    return () => window.clearInterval(timer);
  }, [tasks, settings, pushToast]);

  const handleMarkNotificationAsRead = useCallback((id: string) => {
    readAlertIdsRef.current.add(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const handleMarkAllNotificationsAsRead = useCallback(() => {
    notifications.forEach((n) => readAlertIdsRef.current.add(n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications]);

  // Theme sync with <html> class and localStorage
  const applyTheme = useCallback((nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('taskflow-theme', nextTheme);
    } catch {
      // Ignore storage write failures in restricted iframes
    }
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, applyTheme]);

  // Initial data load from REST API
  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [fetchedTasks, fetchedSettings] = await Promise.all([
        fetchTasks(),
        fetchSettingsApi(),
      ]);
      setTasks(fetchedTasks);
      setSettings(fetchedSettings);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Unable to reach the TaskFlow API.';
      setLoadError(msg);
      pushToast('error', 'Failed to load workspace', msg);
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const stats = useMemo(() => computeTaskStats(tasks), [tasks]);

  const setTaskBusy = useCallback((id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // CRUD handlers
  const handleCreateTask = useCallback(
    async (input: CreateTaskInput) => {
      const created = await createTaskApi(input);
      setTasks((prev) => [created, ...prev]);
      pushToast('success', 'Task created', `"${created.title}" has been added.`);
    },
    [pushToast]
  );

  const handleSaveTaskModal = useCallback(
    async (payload: CreateTaskInput | UpdateTaskInput, taskId?: string) => {
      if (taskId) {
        const updated = await updateTaskApi(taskId, payload as UpdateTaskInput);
        setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
        pushToast('success', 'Task updated', `"${updated.title}" changes saved.`);
      } else {
        await handleCreateTask(payload as CreateTaskInput);
      }
    },
    [handleCreateTask, pushToast]
  );

  const handleToggleComplete = useCallback(
    async (task: Task) => {
      setTaskBusy(task._id, true);
      try {
        const updated = await toggleTaskCompleteApi(task._id, !task.completed);
        setTasks((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
        pushToast(
          'success',
          updated.completed ? 'Task completed' : 'Task restored to pending',
          `"${updated.title}"`
        );
      } catch (err) {
        pushToast(
          'error',
          'Could not update task status',
          err instanceof Error ? err.message : 'Please try again.'
        );
      } finally {
        setTaskBusy(task._id, false);
      }
    },
    [pushToast, setTaskBusy]
  );

  const handleConfirmDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;
    setConfirmLoading(true);
    try {
      await deleteTaskApi(taskToDelete._id);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      pushToast('success', 'Task deleted', `"${taskToDelete.title}" was permanently removed.`);
      setTaskToDelete(null);
    } catch (err) {
      pushToast(
        'error',
        'Failed to delete task',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setConfirmLoading(false);
    }
  }, [taskToDelete, pushToast]);

  const handleConfirmClearCompleted = useCallback(async () => {
    setConfirmLoading(true);
    try {
      const deletedCount = await clearCompletedTasksApi();
      setTasks((prev) => prev.filter((t) => !t.completed));
      pushToast(
        'success',
        'Completed tasks cleared',
        `Removed ${deletedCount} completed ${deletedCount === 1 ? 'task' : 'tasks'}.`
      );
      setClearCompletedOpen(false);
    } catch (err) {
      pushToast(
        'error',
        'Failed to clear completed tasks',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setConfirmLoading(false);
    }
  }, [pushToast]);

  const handleSaveSettings = useCallback(
    async (input: Omit<UserSettings, 'updatedAt'>) => {
      const updated = await updateSettingsApi(input);
      setSettings(updated);
      pushToast('success', 'Settings saved', 'Your profile and defaults have been updated.');
    },
    [pushToast]
  );

  const openNewTaskModal = useCallback(() => {
    setEditingTask(null);
    setTaskModalOpen(true);
  }, []);

  const openEditTaskModal = useCallback((task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  }, []);

  const handleNavigateFiltered = useCallback(
    (page: PageRoute, nextStatus?: TaskStatusFilter) => {
      if (nextStatus) {
        setStatusFilter(nextStatus);
        setPriorityFilter('all');
        setSearchQuery('');
      }
      setActivePage(page);
    },
    []
  );

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
  }, []);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        stats={stats}
        settings={settings}
        theme={theme}
        onToggleTheme={toggleTheme}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top contextual header */}
        <header className="sticky top-0 z-20 h-16 bg-[#F8FAFC]/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="hidden sm:inline text-slate-400 dark:text-slate-500 whitespace-nowrap">
                TaskFlow
              </span>
              <span
                className="hidden sm:inline text-slate-300 dark:text-slate-700"
                aria-hidden="true"
              >
                /
              </span>
              <span className="font-display font-semibold text-slate-900 dark:text-slate-100 truncate">
                {PAGE_TITLES[activePage]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationCenter
              notifications={notifications}
              tasks={tasks}
              settings={settings}
              onMarkAsRead={handleMarkNotificationAsRead}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              onSelectTask={(task) => {
                setEditingTask(task);
                setTaskModalOpen(true);
              }}
              onNavigateToSettings={() => setActivePage('settings')}
            />

            <button
              type="button"
              onClick={openNewTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-xs transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>New Task</span>
            </button>
          </div>
        </header>

        {/* Main viewport */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {loadError && (
            <div
              role="alert"
              className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 px-4 py-3.5"
            >
              <div className="flex items-start gap-2.5 text-sm text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{loadError}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadWorkspace()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-200 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100/60 dark:hover:bg-rose-500/20 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Retry
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {activePage === 'dashboard' && (
                <DashboardPage
                  tasks={tasks}
                  stats={stats}
                  loading={loading}
                  busyIds={busyIds}
                  settings={settings}
                  onQuickCreate={handleCreateTask}
                  onOpenNewTaskModal={openNewTaskModal}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={openEditTaskModal}
                  onDeleteTask={setTaskToDelete}
                  onNavigateFiltered={handleNavigateFiltered}
                />
              )}

              {activePage === 'tasks' && (
                <AllTasksPage
                  tasks={tasks}
                  loading={loading}
                  busyIds={busyIds}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  priorityFilter={priorityFilter}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSearchChange={setSearchQuery}
                  onStatusFilterChange={setStatusFilter}
                  onPriorityFilterChange={setPriorityFilter}
                  onSortByChange={setSortBy}
                  onSortOrderToggle={() =>
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
                  }
                  onResetFilters={handleResetFilters}
                  onOpenNewTaskModal={openNewTaskModal}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={openEditTaskModal}
                  onDeleteTask={setTaskToDelete}
                  onClearCompleted={() => setClearCompletedOpen(true)}
                />
              )}

              {activePage === 'completed' && (
                <CompletedTasksPage
                  tasks={tasks}
                  loading={loading}
                  busyIds={busyIds}
                  onToggleComplete={handleToggleComplete}
                  onEditTask={openEditTaskModal}
                  onDeleteTask={setTaskToDelete}
                  onClearCompleted={() => setClearCompletedOpen(true)}
                />
              )}

              {activePage === 'settings' && (
                <SettingsPage
                  theme={theme}
                  onSetTheme={applyTheme}
                  settings={settings}
                  completedCount={stats.completed}
                  onSaveSettings={handleSaveSettings}
                  onClearCompleted={() => setClearCompletedOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Create / Edit Task Modal */}
      <TaskModal
        open={taskModalOpen}
        editingTask={editingTask}
        defaultPriority={settings.defaultPriority}
        defaultCategory={settings.defaultCategory}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleSaveTaskModal}
      />

      {/* Delete Individual Task Confirmation */}
      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete task?"
        description={
          taskToDelete
            ? `Are you sure you want to permanently delete "${taskToDelete.title}"? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Task"
        loading={confirmLoading}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={() => void handleConfirmDeleteTask()}
      />

      {/* Clear Completed Tasks Confirmation */}
      <ConfirmDialog
        open={clearCompletedOpen}
        title="Clear all completed tasks?"
        description={`This will permanently remove ${stats.completed} completed ${
          stats.completed === 1 ? 'task' : 'tasks'
        } from your database. Pending tasks will not be affected.`}
        confirmLabel="Clear Completed"
        loading={confirmLoading}
        onCancel={() => setClearCompletedOpen(false)}
        onConfirm={() => void handleConfirmClearCompleted()}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
